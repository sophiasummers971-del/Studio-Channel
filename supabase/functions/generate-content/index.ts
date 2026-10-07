import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { operatorErrorResponse, requireOperator } from "../_shared/requireOperator.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-6-luna";

interface GenerationRequest {
  platform: string;
  topic: string;
  niche: string;
  tone: string;
  audience: string;
  count: number;
}

interface GeneratedItem {
  title: string;
  caption: string;
  hashtags: string[];
  script: string;
  visualDirection: string;
  thumbnailConcept: string;
  postingTime: string;
  estimatedReach: string;
  pinTitle: string;
  pinDescription: string;
  boardName: string;
  altText: string;
}

function buildSystemPrompt(platform: string, niche: string, tone: string): string {
  const base =
    `You are a social media content strategist and copywriter. Generate content for ${platform} in the "${niche}" niche. Tone: ${tone}. Keep claims grounded, avoid fabricated statistics, and return only content suitable for the requested platform.`;

  const platformInstructions: Record<string, string> = {
    instagram: `${base}
Create Instagram content with strong hooks, engaging captions, and relevant hashtags.
Optimize for a professional Business or Creator account. Keep captions within Instagram limits and end naturally with an appropriate CTA.`,

    facebook: `${base}
Create Facebook content optimized for feed engagement and shares.
Keep it conversational, community-focused, and avoid engagement bait.`,

    tiktok: `${base}
Create TikTok short-form content concepts.
Scripts should be practical for short-form video, with a clear opening hook, body, and CTA. Do not assume a public-posting permission level or privacy setting.`,

    pinterest: `${base}
Create Pinterest Pin content optimized for search and discovery.
Use keyword-rich natural language, a 2:3 visual concept, useful alt text, and a sensible board name. Do not keyword-stuff.`,

    linkedin: `${base}
Create LinkedIn content for professional thought leadership.
Use readable line breaks, an authentic professional voice, and a clear insight or lesson. Avoid invented credentials or achievements.`,
  };

  return platformInstructions[platform] || platformInstructions.instagram;
}

function buildUserPrompt(
  platform: string,
  topic: string,
  audience: string,
  count: number,
): string {
  return `Generate exactly ${count} distinct ${platform} content pieces about "${topic}" for this target audience: ${audience}.
Give each piece a different angle and hook.
For fields that are platform-specific and not needed, return an empty string rather than inventing a value.`;
}

const itemSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    caption: { type: "string" },
    hashtags: {
      type: "array",
      items: { type: "string" },
    },
    script: { type: "string" },
    visualDirection: { type: "string" },
    thumbnailConcept: { type: "string" },
    postingTime: { type: "string" },
    estimatedReach: { type: "string" },
    pinTitle: { type: "string" },
    pinDescription: { type: "string" },
    boardName: { type: "string" },
    altText: { type: "string" },
  },
  required: [
    "title",
    "caption",
    "hashtags",
    "script",
    "visualDirection",
    "thumbnailConcept",
    "postingTime",
    "estimatedReach",
    "pinTitle",
    "pinDescription",
    "boardName",
    "altText",
  ],
};

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: itemSchema,
    },
  },
  required: ["items"],
};

function findOutputText(data: any): string | null {
  for (const output of data?.output || []) {
    for (const part of output?.content || []) {
      if (part?.type === "output_text" && typeof part.text === "string") {
        return part.text;
      }
    }
  }
  return null;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    await requireOperator(req);

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI generation is not configured." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body: GenerationRequest = await req.json();
    const platform = String(body.platform || "").trim().toLowerCase();
    const topic = String(body.topic || "").trim();
    const niche = String(body.niche || "general").trim();
    const tone = String(body.tone || "professional").trim();
    const audience = String(body.audience || "general audience").trim();
    const count = Math.min(10, Math.max(1, Number(body.count) || 3));

    if (!platform || !topic) {
      return new Response(
        JSON.stringify({ error: "platform and topic are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemPrompt = buildSystemPrompt(platform, niche, tone);
    const userPrompt = buildUserPrompt(platform, topic, audience, count);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        store: false,
        instructions: systemPrompt,
        input: userPrompt,
        max_output_tokens: 6000,
        text: {
          format: {
            type: "json_schema",
            name: "channel_studio_content",
            description: "Structured social content generated for Channel Studio.",
            strict: true,
            schema: responseSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      const requestId = response.headers.get("x-request-id");
      console.error("OpenAI Responses API error", {
        status: response.status,
        requestId,
      });

      return new Response(
        JSON.stringify({ error: "AI generation failed", requestId }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const outputText = findOutputText(data);

    if (!outputText) {
      console.error("OpenAI response contained no output_text", {
        responseId: data?.id,
        status: data?.status,
      });
      return new Response(
        JSON.stringify({ error: "AI returned no usable content" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsed: { items?: GeneratedItem[] };
    try {
      parsed = JSON.parse(outputText);
    } catch {
      console.error("Structured output could not be parsed", { responseId: data?.id });
      return new Response(
        JSON.stringify({ error: "AI returned invalid structured content" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const items = Array.isArray(parsed.items) ? parsed.items.slice(0, count) : [];
    if (items.length === 0) {
      return new Response(
        JSON.stringify({ error: "AI returned an empty content set" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        items,
        model: OPENAI_MODEL,
        platform,
        responseId: data?.id ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const authResponse = operatorErrorResponse(err, corsHeaders);
    if (authResponse) return authResponse;

    console.error("generate-content error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
