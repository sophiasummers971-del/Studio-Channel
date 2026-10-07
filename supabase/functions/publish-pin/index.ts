import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
  imageUrl?: string;       // direct URL to an image for the pin
  link?: string;           // destination link when pin is clicked
}

// ── Pinterest API helpers ──

async function listPinterestBoards(accessToken: string): Promise<{ id: string; name: string }[]> {
  const resp = await fetch("https://api.pinterest.com/v5/boards?page_size=25", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  return (data.items || []).map((b: Record<string, unknown>) => ({ id: b.id as string, name: b.name as string }));
}

async function findOrCreateBoard(
  accessToken: string,
  boardName: string
): Promise<string | null> {
  const boards = await listPinterestBoards(accessToken);
  const existing = boards.find((b) => b.name.toLowerCase() === boardName.toLowerCase());
  if (existing) return existing.id;

  // Create the board
  const resp = await fetch("https://api.pinterest.com/v5/boards", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: boardName, description: `Auto-created by Channel Studio for ${boardName}` }),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.id || null;
}

async function createPinterestPin(
  accessToken: string,
  boardId: string,
  title: string,
  description: string,
  imageUrl?: string,
  link?: string
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

  if (link) {
    body.link = link;
  }

  const resp = await fetch("https://api.pinterest.com/v5/pins", {
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

// ── Edge Function handler ──

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { admin: supabase } = await requireOperator(req);
    const body: PublishRequest = await req.json();
    const { jobId, contentId, platform, pinTitle, pinDescription, boardName, caption, hashtags, imageUrl, link } = body;

    if (!jobId || !contentId) {
      return new Response(
        JSON.stringify({ error: "jobId and contentId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark job as publishing
    await supabase
      .from("publish_jobs")
      .update({ status: "publishing", attempt_count: supabase.rpc ? 1 : 1, last_attempt_at: new Date().toISOString() })
      .eq("id", jobId);

    if (platform !== "pinterest") {
      await supabase
        .from("publish_jobs")
        .update({ status: "failed", error_message: `Platform ${platform} not yet supported. Pinterest is the first integration.` })
        .eq("id", jobId);
      return new Response(
        JSON.stringify({ error: `Platform ${platform} not yet supported` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Pinterest access token
    const accessToken = await getPinterestAccessToken(supabase);
    if (!accessToken) {
      await supabase
        .from("publish_jobs")
        .update({ status: "failed", error_message: "No Pinterest access token. Connect your Pinterest account first." })
        .eq("id", jobId);
      return new Response(
        JSON.stringify({ error: "No Pinterest access token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find or create board
    const boardId = await findOrCreateBoard(accessToken, boardName || "Channel Studio Pins");
    if (!boardId) {
      await supabase
        .from("publish_jobs")
        .update({ status: "failed", error_message: "Could not find or create Pinterest board." })
        .eq("id", jobId);
      return new Response(
        JSON.stringify({ error: "Could not find or create board" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build pin title and description
    const title = pinTitle || "Untitled Pin";
    const description = pinDescription || caption || "";
    const fullDescription = hashtags?.length
      ? `${description}\n\n${hashtags.map((t) => t.startsWith("#") ? t : `#${t}`).join(" ")}`
      : description;

    // Create the pin
    const result = await createPinterestPin(accessToken, boardId, title, fullDescription, imageUrl, link);

    if ("error" in result) {
      await supabase
        .from("publish_jobs")
        .update({ status: "failed", error_message: result.error })
        .eq("id", jobId);
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Success — record the result
    await supabase
      .from("publish_jobs")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        external_id: result.id,
        external_url: result.link,
      })
      .eq("id", jobId);

    // Also update content_items stage to published
    await supabase
      .from("content_items")
      .update({ stage: "published", updated_at: new Date().toISOString() })
      .eq("id", contentId);

    return new Response(
      JSON.stringify({ ok: true, pinId: result.id, pinLink: result.link, boardId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const authResponse = operatorErrorResponse(err, corsHeaders);
    if (authResponse) return authResponse;

    console.error("publish-pin error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
