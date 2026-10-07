import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { operatorErrorResponse, requireOperator } from "../_shared/requireOperator.ts";

const AI_GATEWAY_URL = "https://studio-ai-gateway.s-jade0131.workers.dev/generate";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    await requireOperator(req);

    const authHeader = req.headers.get("Authorization") || "";
    const body = await req.json();
    const platform = String(body.platform || "").trim().toLowerCase();
    const topic = String(body.topic || "").trim();

    if (!platform || !topic) {
      return new Response(JSON.stringify({ error: "platform and topic are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        platform,
        topic,
        niche: String(body.niche || "general"),
        tone: String(body.tone || "professional"),
        audience: String(body.audience || "general audience"),
        count: Math.min(10, Math.max(1, Number(body.count) || 3)),
      }),
    });

    const text = await response.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("AI gateway returned non-JSON", { status: response.status });
      return new Response(JSON.stringify({ error: "AI gateway returned an invalid response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      console.error("Cloudflare AI gateway error", {
        status: response.status,
        error: data.error || "unknown",
      });
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const authResponse = operatorErrorResponse(err, corsHeaders);
    if (authResponse) return authResponse;

    console.error("generate-content error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});