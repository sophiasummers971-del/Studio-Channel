import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { operatorErrorResponse, requireOperator } from "../_shared/requireOperator.ts";
import { getPinterestAccessToken } from "../_shared/pinterestCredentials.ts";

interface PublishRequest {
  jobId: string;
  contentId: string;
  platform: string;
  pinTitle?: string;
  pinDescription?: string;
  boardName?: string;
  caption?: string;
  hashtags?: string[];
  imageUrl?: string;
  link?: string;
}

interface PinterestRuntime {
  environment: "sandbox" | "production";
  apiBaseUrl: string;
  accessToken: string;
}

async function getPinterestRuntime(supabase: any): Promise<PinterestRuntime | null> {
  const environment = (Deno.env.get("PINTEREST_API_ENV") || "production").trim().toLowerCase();

  if (environment === "sandbox") {
    const accessToken = Deno.env.get("PINTEREST_SANDBOX_ACCESS_TOKEN");
    if (!accessToken) return null;
    return {
      environment: "sandbox",
      apiBaseUrl: "https://api-sandbox.pinterest.com",
      accessToken,
    };
  }

  const accessToken = await getPinterestAccessToken(supabase);
  if (!accessToken) return null;

  return {
    environment: "production",
    apiBaseUrl: "https://api.pinterest.com",
    accessToken,
  };
}

async function listPinterestBoards(
  apiBaseUrl: string,
  accessToken: string,
): Promise<{ id: string; name: string }[]> {
  const boards: { id: string; name: string }[] = [];
  let bookmark: string | null = null;
  let pages = 0;

  do {
    const params = new URLSearchParams({ page_size: "250" });
    if (bookmark) params.set("bookmark", bookmark);

    const resp = await fetch(`${apiBaseUrl}/v5/boards?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Pinterest list boards failed", {
        status: resp.status,
        error: errText.substring(0, 200),
      });
      return boards;
    }

    const data = await resp.json();
    for (const b of data.items || []) {
      if (b?.id && b?.name) {
        boards.push({ id: String(b.id), name: String(b.name) });
      }
    }

    bookmark = typeof data.bookmark === "string" && data.bookmark.length
      ? data.bookmark
      : null;

    pages += 1;
  } while (bookmark && pages < 20);

  if (bookmark) {
    console.warn("Pinterest board pagination stopped after safety limit", { pages });
  }

  return boards;
}

async function createPinterestBoard(
  apiBaseUrl: string,
  accessToken: string,
  boardName: string,
): Promise<{ id: string | null; code?: number }> {
  const resp = await fetch(`${apiBaseUrl}/v5/boards`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: boardName,
      description: `Auto-created by Channel Studio for ${boardName}`,
    }),
  });

  const text = await resp.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {}

  if (!resp.ok) {
    console.error("Pinterest create board failed", {
      status: resp.status,
      error: text.substring(0, 200),
    });
    return {
      id: null,
      code: typeof data.code === "number" ? data.code : undefined,
    };
  }

  return { id: typeof data.id === "string" ? data.id : null };
}

async function findOrCreateBoard(
  apiBaseUrl: string,
  accessToken: string,
  boardName: string,
): Promise<string | null> {
  const boards = await listPinterestBoards(apiBaseUrl, accessToken);
  const existing = boards.find((b) => b.name.toLowerCase() === boardName.toLowerCase());
  if (existing) return existing.id;

  const first = await createPinterestBoard(apiBaseUrl, accessToken, boardName);
  if (first.id) return first.id;

  const isSandbox = apiBaseUrl === "https://api-sandbox.pinterest.com";
  if (isSandbox && first.code === 58) {
    const suffix = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    const fallbackName = `${boardName} Sandbox ${suffix}`;
    console.warn("Pinterest Sandbox hid an existing board from list; creating unique fallback", {
      requestedName: boardName,
      fallbackName,
    });

    const fallback = await createPinterestBoard(apiBaseUrl, accessToken, fallbackName);
    if (fallback.id) return fallback.id;
  }

  return null;
}

async function createPinterestPin(
  apiBaseUrl: string,
  accessToken: string,
  boardId: string,
  title: string,
  description: string,
  imageUrl?: string,
  link?: string,
): Promise<{ id: string; link: string } | { error: string }> {
  const body: Record<string, unknown> = {
    board_id: boardId,
    title,
    description,
  };

  if (imageUrl) {
    body.media_source = {
      source_type: "image_url",
      url: imageUrl,
    };
  }

  if (link) body.link = link;

  const resp = await fetch(`${apiBaseUrl}/v5/pins`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error("Pinterest create pin failed:", resp.status, errText);
    return { error: `Pinterest API ${resp.status}: ${errText.substring(0, 200)}` };
  }

  const data = await resp.json();
  return { id: data.id, link: data.link || "" };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { admin: supabase } = await requireOperator(req);
    const body: PublishRequest = await req.json();
    const {
      jobId,
      contentId,
      platform,
      pinTitle,
      pinDescription,
      boardName,
      caption,
      hashtags,
      imageUrl,
      link,
    } = body;

    if (!jobId || !contentId) {
      return new Response(
        JSON.stringify({ error: "jobId and contentId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (platform === "pinterest") {
      if (!imageUrl) {
        return new Response(
          JSON.stringify({ error: "Pinterest requires a public HTTPS image URL." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      try {
        const parsed = new URL(imageUrl);
        if (parsed.protocol !== "https:") {
          return new Response(
            JSON.stringify({ error: "Pinterest media URL must use HTTPS." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      } catch {
        return new Response(
          JSON.stringify({ error: "Pinterest media URL is invalid." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    await supabase
      .from("publish_jobs")
      .update({
        status: "publishing",
        attempt_count: 1,
        last_attempt_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (platform !== "pinterest") {
      await supabase
        .from("publish_jobs")
        .update({
          status: "failed",
          error_message: `Platform ${platform} not yet supported. Pinterest is the first integration.`,
        })
        .eq("id", jobId);

      return new Response(
        JSON.stringify({ error: `Platform ${platform} not yet supported` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const pinterest = await getPinterestRuntime(supabase);
    if (!pinterest) {
      const env = (Deno.env.get("PINTEREST_API_ENV") || "production").trim().toLowerCase();
      const message = env === "sandbox"
        ? "Pinterest Sandbox is selected but PINTEREST_SANDBOX_ACCESS_TOKEN is not configured."
        : "No Pinterest production access token. Connect your Pinterest account first.";

      await supabase
        .from("publish_jobs")
        .update({ status: "failed", error_message: message })
        .eq("id", jobId);

      return new Response(
        JSON.stringify({ error: message }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const boardId = await findOrCreateBoard(
      pinterest.apiBaseUrl,
      pinterest.accessToken,
      boardName || "Channel Studio Pins",
    );

    if (!boardId) {
      const message = `Could not find or create Pinterest board in ${pinterest.environment}.`;

      await supabase
        .from("publish_jobs")
        .update({ status: "failed", error_message: message })
        .eq("id", jobId);

      return new Response(
        JSON.stringify({ error: message, pinterestEnvironment: pinterest.environment }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const title = pinTitle || "Untitled Pin";
    const description = pinDescription || caption || "";
    const fullDescription = hashtags?.length
      ? `${description}\n\n${hashtags.map((t) => t.startsWith("#") ? t : `#${t}`).join(" ")}`
      : description;

    const result = await createPinterestPin(
      pinterest.apiBaseUrl,
      pinterest.accessToken,
      boardId,
      title,
      fullDescription,
      imageUrl,
      link,
    );

    if ("error" in result) {
      await supabase
        .from("publish_jobs")
        .update({ status: "failed", error_message: result.error })
        .eq("id", jobId);

      return new Response(
        JSON.stringify({
          error: result.error,
          pinterestEnvironment: pinterest.environment,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await supabase
      .from("publish_jobs")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        external_id: result.id,
        external_url: result.link,
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
        pinId: result.id,
        pinLink: result.link,
        boardId,
        pinterestEnvironment: pinterest.environment,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const authResponse = operatorErrorResponse(err, corsHeaders);
    if (authResponse) return authResponse;

    console.error("publish-pin error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});