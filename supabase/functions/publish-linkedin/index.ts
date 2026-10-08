import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { operatorErrorResponse, requireOperator } from "../_shared/requireOperator.ts";

interface PublishRequest {
  jobId: string;
  contentId: string;
  platform: string;
  caption?: string;
  hashtags?: string[];
  imageUrl?: string;
  title?: string;
  altText?: string;
}

interface LinkedInCredential {
  access_token: string;
  external_id: string | null;
  expires_at: string | null;
}

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function buildCommentary(caption?: string, hashtags?: string[]) {
  const base = (caption || "").trim();
  const tags = (hashtags || [])
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

  return [base, tags.join(" ")].filter(Boolean).join("\n\n");
}

async function markFailed(supabase: any, jobId: string, message: string) {
  await supabase
    .from("publish_jobs")
    .update({
      status: "failed",
      error_message: message,
      last_attempt_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

async function getLinkedInCredential(supabase: any): Promise<LinkedInCredential | null> {
  const { data, error } = await supabase
    .from("oauth_credentials")
    .select("access_token, external_id, expires_at")
    .eq("provider", "linkedin")
    .maybeSingle();

  if (error || !data?.access_token) return null;
  return data as LinkedInCredential;
}

async function resolvePersonId(accessToken: string, storedExternalId: string | null) {
  if (storedExternalId) return storedExternalId;

  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return null;
  const data = await response.json();
  return typeof data?.sub === "string" && data.sub.length > 0 ? data.sub : null;
}

async function registerLinkedInImage(accessToken: string, ownerUrn: string) {
  const response = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: ownerUrn,
        serviceRelationships: [
          {
            relationshipType: "OWNER",
            identifier: "urn:li:userGeneratedContent",
          },
        ],
      },
    }),
  });

  const text = await response.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {}

  if (!response.ok) {
    throw new Error(`LinkedIn image registration failed (${response.status}): ${text.substring(0, 240)}`);
  }

  const mechanism =
    data?.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"];
  const uploadUrl = mechanism?.uploadUrl;
  const asset = data?.value?.asset;

  if (!uploadUrl || !asset) {
    throw new Error("LinkedIn did not return an image upload URL and asset URN.");
  }

  return { uploadUrl: String(uploadUrl), asset: String(asset) };
}

async function uploadLinkedInImage(accessToken: string, uploadUrl: string, imageUrl: string) {
  const source = await fetch(imageUrl);
  if (!source.ok) {
    throw new Error(`Could not fetch Studio media for LinkedIn (${source.status}).`);
  }

  const contentType = (source.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const allowed = new Set(["image/jpeg", "image/png", "image/gif"]);
  if (!allowed.has(contentType)) {
    throw new Error(
      `LinkedIn image publishing supports JPEG, PNG, or GIF. Selected media is ${contentType || "unknown"}.`,
    );
  }

  const body = new Uint8Array(await source.arrayBuffer());
  if (body.byteLength > 10 * 1024 * 1024) {
    throw new Error("LinkedIn image must be 10 MB or smaller.");
  }

  const upload = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": contentType,
    },
    body,
  });

  if (!upload.ok) {
    const text = await upload.text();
    throw new Error(`LinkedIn image upload failed (${upload.status}): ${text.substring(0, 240)}`);
  }
}

async function createLinkedInPost(
  accessToken: string,
  authorUrn: string,
  commentary: string,
  media?: { asset: string; title?: string; altText?: string },
) {
  const shareContent: Record<string, unknown> = {
    shareCommentary: { text: commentary },
    shareMediaCategory: media ? "IMAGE" : "NONE",
  };

  if (media) {
    shareContent.media = [
      {
        status: "READY",
        media: media.asset,
        ...(media.title ? { title: { text: media.title } } : {}),
        ...(media.altText ? { description: { text: media.altText } } : {}),
      },
    ];
  }

  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": shareContent,
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`LinkedIn publish failed (${response.status}): ${responseText.substring(0, 300)}`);
  }

  const externalId =
    response.headers.get("x-restli-id") ||
    response.headers.get("x-linkedin-id") ||
    "";

  if (!externalId) {
    throw new Error("LinkedIn published the request but did not return a post identifier.");
  }

  return {
    externalId,
    externalUrl: `https://www.linkedin.com/feed/update/${externalId}`,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { admin: supabase } = await requireOperator(req);
    const body: PublishRequest = await req.json();
    const { jobId, contentId, platform, caption, hashtags, imageUrl, title, altText } = body;

    if (!jobId || !contentId) {
      return new Response(
        JSON.stringify({ error: "jobId and contentId are required" }),
        { status: 400, headers: jsonHeaders },
      );
    }

    if (platform !== "linkedin") {
      return new Response(
        JSON.stringify({ error: `Platform ${platform} is not handled by publish-linkedin` }),
        { status: 400, headers: jsonHeaders },
      );
    }

    const commentary = buildCommentary(caption, hashtags);
    if (!commentary) {
      return new Response(
        JSON.stringify({ error: "LinkedIn requires post text before publishing." }),
        { status: 400, headers: jsonHeaders },
      );
    }

    await supabase
      .from("publish_jobs")
      .update({
        status: "publishing",
        error_message: null,
        last_attempt_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    const credential = await getLinkedInCredential(supabase);
    if (!credential) {
      const message = "No LinkedIn access token. Connect LinkedIn first.";
      await markFailed(supabase, jobId, message);
      return new Response(JSON.stringify({ error: message }), { status: 503, headers: jsonHeaders });
    }

    if (credential.expires_at && new Date(credential.expires_at).getTime() <= Date.now()) {
      const message = "LinkedIn access token has expired. Reconnect LinkedIn and try again.";
      await markFailed(supabase, jobId, message);
      return new Response(JSON.stringify({ error: message }), { status: 401, headers: jsonHeaders });
    }

    const personId = await resolvePersonId(credential.access_token, credential.external_id);
    if (!personId) {
      const message = "LinkedIn member identifier is missing. Reconnect LinkedIn and try again.";
      await markFailed(supabase, jobId, message);
      return new Response(JSON.stringify({ error: message }), { status: 409, headers: jsonHeaders });
    }

    const authorUrn = personId.startsWith("urn:li:person:")
      ? personId
      : `urn:li:person:${personId}`;

    let media: { asset: string; title?: string; altText?: string } | undefined;
    if (imageUrl) {
      let parsed: URL;
      try {
        parsed = new URL(imageUrl);
      } catch {
        const message = "LinkedIn media URL is invalid.";
        await markFailed(supabase, jobId, message);
        return new Response(JSON.stringify({ error: message }), { status: 400, headers: jsonHeaders });
      }

      if (parsed.protocol !== "https:") {
        const message = "LinkedIn media URL must use HTTPS.";
        await markFailed(supabase, jobId, message);
        return new Response(JSON.stringify({ error: message }), { status: 400, headers: jsonHeaders });
      }

      const { uploadUrl, asset } = await registerLinkedInImage(credential.access_token, authorUrn);
      await uploadLinkedInImage(credential.access_token, uploadUrl, imageUrl);
      media = { asset, title, altText };
    }

    const result = await createLinkedInPost(
      credential.access_token,
      authorUrn,
      commentary,
      media,
    );

    await supabase
      .from("publish_jobs")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        external_id: result.externalId,
        external_url: result.externalUrl,
        error_message: null,
      })
      .eq("id", jobId);

    await supabase
      .from("content_items")
      .update({ stage: "published", updated_at: new Date().toISOString() })
      .eq("id", contentId);

    return new Response(
      JSON.stringify({
        ok: true,
        externalId: result.externalId,
        externalUrl: result.externalUrl,
      }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (err) {
    const authResponse = operatorErrorResponse(err, corsHeaders);
    if (authResponse) return authResponse;

    console.error("publish-linkedin error:", err);
    const message = err instanceof Error ? err.message : "Internal error";

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
