import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { operatorErrorResponse, requireOperator } from "../_shared/requireOperator.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface GenerationRequest {
  platform: string;
  topic: string;
  niche: string;
  tone: string;
  audience: string;
  count: number;
}

function buildSystemPrompt(platform: string, niche: string, tone: string): string {
  const base = `You are a social media content strategist and copywriter. Generate content for ${platform} in the "${niche}" niche. Tone: ${tone}.`;

  const platformInstructions: Record<string, string> = {
    instagram: `${base}
Create Instagram content with strong hooks, engaging captions, and relevant hashtags.
Output JSON array of objects with: title, caption, hashtags (array of 8-10), script (3-part: hook/middle/ending), visualDirection, thumbnailConcept, postingTime, estimatedReach.
Caption max 2200 chars. Include emojis naturally. End with a CTA.`,

    facebook: `${base}
Create Facebook content optimized for feed engagement and shares.
Output JSON array of objects with: title, caption, hashtags (array of 5-8), script (3-part: hook/middle/ending), visualDirection, thumbnailConcept, postingTime, estimatedReach.
Caption max 63206 chars. Conversational, community-focused. Include CTA.`,

    tiktok: `${base}
Create TikTok short-form video scripts optimized for the For You Page.
Output JSON array of objects with: title, caption, hashtags (array of 5-8), script (detailed shot-by-shot: hook (0-3s), main content, CTA), visualDirection, thumbnailConcept, postingTime, estimatedReach.
Scripts should be 15-60 seconds. Hook must grab attention in first 2 seconds.`,

    pinterest: `${base}
Create Pinterest pin content optimized for search and discovery. Pinterest is a visual search engine — titles and descriptions must be SEO-rich.
Output JSON array of objects with:
- title (pin title, max 100 chars, keyword-rich)
- caption (pin description, max 500 chars, includes keywords naturally)
- hashtags (array of 3-5 relevant tags)
- pinTitle (SEO-optimized pin title, different from social title)
- pinDescription (rich keyword description for Pinterest SEO, 100-500 chars)
- boardName (suggested board name for organizing this pin)
- altText (accessibility alt text for the pin image, 100-150 chars)
- script (visual layout description for the pin design)
- visualDirection (2:3 vertical pin design direction)
- thumbnailConcept (pin design concept)
- postingTime (optimal pinning time)
- estimatedReach
Focus on evergreen, searchable content. Use natural keywords, not hashtag-stuffing.`,

    linkedin: `${base}
Create LinkedIn content for professional thought leadership.
Output JSON array of objects with: title, caption, hashtags (array of 3-5), script (structured narrative: insight/story, lesson, CTA), visualDirection, thumbnailConcept, postingTime, estimatedReach.
Professional but authentic. Use line breaks for readability. Hook in first 2 lines.`,
  };

  return platformInstructions[platform] || platformInstructions.instagram;
}

function buildUserPrompt(platform: string, topic: string, audience: string, count: number): string {
  return `Generate ${count} distinct ${platform} content pieces about "${topic}".
Target audience: ${audience}.
Each piece should have a unique angle, hook, and approach.
Return ONLY a valid JSON array — no markdown, no explanation.`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    await requireOperator(req);

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured in Supabase secrets. Set it with: supabase secrets set OPENAI_API_KEY=sk-..." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: GenerationRequest = await req.json();
    const { platform, topic, niche, tone, audience, count } = body;

    if (!platform || !topic) {
      return new Response(
        JSON.stringify({ error: "platform and topic are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = buildSystemPrompt(platform, niche || "general", tone || "professional");
    const userPrompt = buildUserPrompt(platform, topic, audience || "general audience", count || 3);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: `AI generation failed: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No content returned from AI" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON — AI may wrap in markdown code block
    let parsed: unknown;
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to extract array from the response
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        parsed = JSON.parse(arrayMatch[0]);
      } else {
        console.error("Failed to parse AI response:", cleaned.substring(0, 200));
        return new Response(
          JSON.stringify({ error: "Failed to parse AI response", raw: cleaned.substring(0, 500) }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const items = Array.isArray(parsed) ? parsed : [parsed];

    return new Response(
      JSON.stringify({ items, model: "gpt-4o-mini", platform }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const authResponse = operatorErrorResponse(err, corsHeaders);
    if (authResponse) return authResponse;

    console.error("generate-content error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
