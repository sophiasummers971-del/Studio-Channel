/**
 * Local content generation engine.
 * Generates platform-specific content without any external API.
 * Each platform has its own templates, tone, and format conventions.
 */

import type { PlatformId, ContentItem, ContentStage } from '@/types';
import { supabase } from '@/lib/supabase';

export interface GenerationInput {
  platform: PlatformId;
  topic: string;
  niche: string;
  tone: string;
  audience: string;
  count: number; // how many posts to generate
}

interface PlatformTemplates {
  hooks: string[];
  captionEndings: string[];
  hashtags: string[];
  formats: string[];
  postTimes: string[];
  ctaExamples: string[];
}

const PLATFORM_TEMPLATES: Record<PlatformId, PlatformTemplates> = {
  instagram: {
    hooks: [
      "Stop scrolling — this changed how I {topic} 🛑",
      "3 things nobody tells you about {topic}",
      "POV: You finally figured out {topic}",
      "The {topic} hack that went viral for a reason",
      "Watch this before you {topic} again 👀",
      "I tried {topic} for 30 days. Here's what happened.",
      "This is your sign to start {topic}",
      "The truth about {topic} that nobody talks about",
    ],
    captionEndings: [
      "Save this for later 🔖 and follow for more {niche} insights",
      "Drop a 🔥 if this resonated with you",
      "Which tip are you trying first? Comment below 👇",
      "Share this with someone who needs to hear this",
      "Follow for daily {niche} content that actually works",
      "Double tap if you agree 💯",
      "What's your experience with {topic}? Let me know below",
    ],
    hashtags: ["#aiproductivity", "#solobusiness", "#automationtips", "#digitaltools", "#worksmarter", "#productivityhacks", "#contentcreator", "#sidehustle", "#passiveincome", "#trendalert", "#growthmindset", "#businessgrowth", "#socialmediatips", "#marketingstrategy", "#morningroutine"],
    formats: ["reels", "stories", "posts"],
    postTimes: ["7:00 AM", "12:00 PM", "5:00 PM", "6:30 PM", "8:00 PM"],
    ctaExamples: ["Follow for more", "Save this post", "Link in bio", "Comment your thoughts", "Share with a friend"],
  },
  tiktok: {
    hooks: [
      "Wait for it... {topic} explained in 30 seconds ⏱️",
      "You've been {topic} wrong your whole life",
      "This {topic} tip is going to blow your mind 🤯",
      "POV: Teaching you {topic} the easy way",
      "POV: You just discovered {topic} exists",
      "No one talks about {topic} like this 🎤",
      "The {topic} algorithm doesn't want you to know this",
      "I said what I said: {topic} is underrated",
    ],
    captionEndings: [
      "Follow for more {niche} content 🎯",
      "Which one surprised you most? Comment 👇",
      "Part 2? Comment YES if you want more",
      "Stitch this with your version",
      "Duet this if you agree",
      "Save this for later 🔖",
      "Who needs to see this? Tag them 👇",
    ],
    hashtags: ["#fyp", "#viral", "#lifehack", "#aitools", "#productivity", "#solopreneur", "#businesstips", "#contentcreator", "#learnontiktok", "#tiktokmademebuyit", "#growthhacks", "#sidehustle2026", "#automations"],
    formats: ["short-form"],
    postTimes: ["7:00 AM", "10:00 AM", "2:00 PM", "7:00 PM", "9:00 PM"],
    ctaExamples: ["Follow for part 2", "Comment your answer", "Stitch this", "Save this video", "Share with a friend"],
  },
  pinterest: {
    hooks: [
      "{topic} — The Ultimate Visual Guide",
      "How to Master {topic} (Step by Step)",
      "{topic} Ideas That Actually Work",
      "The {topic} Checklist You Didn't Know You Needed",
      "Visual {topic} Inspiration for Your Next Project",
      "{topic} Tips for Beginners — Start Here",
      "Transform Your {topic} with These Ideas",
      "{topic} — What Works, What Doesn't",
    ],
    captionEndings: [
      "Click the link for the full guide 🔗",
      "Save this pin for your next {topic} session",
      "Follow the board for more {niche} inspiration",
      "Pin this for later — you'll thank yourself",
      "Explore more ideas on our {niche} board",
    ],
    hashtags: ["productivity", "businessideas", "digitalnomad", "aiinspiration", "automation", "passiveincome", "solopreneur", "contentcreation", "growthstrategy", "morningmotivation", "aesthetic", "darkfantasy", "magicalaesthetic", "ancientsymbols"],
    formats: ["pins"],
    postTimes: ["8:00 AM", "11:00 AM", "2:00 PM", "8:00 PM"],
    ctaExamples: ["Visit the link", "Save to board", "Follow for more", "Explore the full guide"],
  },
  facebook: {
    hooks: [
      "Here's what nobody tells you about {topic}",
      "Stop scrolling — {topic} is about to change everything",
      "3 quick tips for {topic} that actually work",
      "POV: You just discovered {topic} and now everything makes sense",
      "The {topic} strategy that grew our community overnight",
      "Unpopular opinion: {topic} is simpler than you think",
      "We tried {topic} for a month. The results speak for themselves.",
      "Your {topic} checklist for this week — save it",
    ],
    captionEndings: [
      "Like this page for more {niche} insights daily",
      "Share this with someone who needs to hear it",
      "Drop your thoughts in the comments below",
      "Save this post for when you need it",
      "Tag a friend who'd benefit from this",
      "What's your experience with {topic}?",
    ],
    hashtags: ["#aiproductivity", "#solobusiness", "#automationtips", "#digitaltools", "#worksmarter", "#productivityhacks", "#contentcreator", "#communitygrowth"],
    formats: ["posts", "reels", "stories"],
    postTimes: ["9:00 AM", "1:00 PM", "4:00 PM", "7:00 PM"],
    ctaExamples: ["Like & Follow", "Share with your network", "Comment your thoughts", "Save for later"],
  },
  linkedin: {
    hooks: [
      "I spent 3 years figuring out {topic}. Here's the short version:",
      "Unpopular opinion: {topic} is overcomplicated. Let me simplify it.",
      "The biggest mistake I see people make with {topic}:",
      "{topic} is evolving fast. Here's what changed this year:",
      "After helping 100+ people with {topic}, I noticed a pattern:",
      "I was wrong about {topic}. Here's what I learned instead:",
      "Here's a {topic} framework that actually delivers results:",
      "3 books that completely changed my approach to {topic}:",
    ],
    captionEndings: [
      "What's your experience with {topic}? I'd love to hear in the comments",
      "If this was helpful, reshare it with your network",
      "Follow me for more insights on {niche}",
      "What would you add to this list?",
      "Agree or disagree? Let's discuss below 👇",
    ],
    hashtags: ["#leadership", "#productivity", "#ai", "#futureofwork", "#solopreneur", "#digitaltransformation", "#growthmindset", "#startup", "#businessstrategy", "#professionaldevelopment", "#networking", "#careeradvice"],
    formats: ["posts"],
    postTimes: ["7:30 AM", "10:00 AM", "12:00 PM", "5:00 PM"],
    ctaExamples: ["Comment your thoughts", "Reshare this post", "Follow for insights", "Connect with me"],
  },
};

// ── Niche-specific content enrichers ──
const NICHE_ENRICHERS: Record<string, { subtopics: string[]; examples: string[] }> = {
  'AI productivity': {
    subtopics: ['ChatGPT workflows', 'automated scheduling', 'prompt engineering', 'AI writing assistants', 'no-code automations'],
    examples: ['ChatGPT prompt that writes your emails in 10 seconds', 'Automate your entire morning routine with 3 tools', 'The 5-minute AI workflow that saves 3 hours daily'],
  },
  'dark fantasy': {
    subtopics: ['shadow magic', 'occult symbols', 'gothic aesthetics', 'ritual art', 'mystic photography'],
    examples: ['The forgotten ritual that channels ancient power', 'Dark fantasy photography tips for otherworldly shots', 'Occult symbols explained — what they really mean'],
  },
  'ancient wisdom': {
    subtopics: ['stoic philosophy', 'hermetic principles', 'sacred geometry', 'alchemical knowledge', 'mystic traditions'],
    examples: ['The 3000-year-old productivity system that still works', 'Sacred geometry in modern design — a visual guide', 'What the Stoics knew about focus that we forgot'],
  },
  'solopreneur': {
    subtopics: ['passive income', 'AI side hustle', 'content systems', 'scaling alone', 'digital products'],
    examples: ['How I built a $5K/month income stream with AI tools', 'The solopreneur stack — 7 tools running my business', 'From zero to first sale: the 30-day solopreneur challenge'],
  },
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function enrich(text: string, vars: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

function generateCaption(
  platform: PlatformId,
  topic: string,
  niche: string,
  tone: string,
): string {
  const templates = PLATFORM_TEMPLATES[platform];
  const hook = enrich(pick(templates.hooks), { topic, niche });
  const ending = enrich(pick(templates.captionEndings), { topic, niche });
  const cta = pick(templates.ctaExamples);

  // Build a short body paragraph
  const nicheData = NICHE_ENRICHERS[niche];
  const subtopic = nicheData ? pick(nicheData.subtopics) : topic;
  const example = nicheData ? pick(nicheData.examples) : '';

  const bodies = [
    `Here's what most people miss about ${subtopic}...\n\nThe key isn't doing more — it's doing the right things in the right order. Start with one small change today.`,
    `${subtopic} doesn't have to be complicated.\n\nStart here: ${example || 'pick one thing and master it before moving on.'}`,
    `Let me break this down simply:\n\n1️⃣ Start with understanding ${subtopic}\n2️⃣ Apply it to your daily workflow\n3️⃣ Measure what actually changes\n\nMost people skip step 1 and wonder why nothing works.`,
    `Real talk about ${subtopic}:\n\nIt's not about having the perfect setup. It's about being consistent with what you already have. One step at a time.`,
    `Quick ${subtopic} breakdown 🧵\n\n${example || 'Here are the 3 principles that changed everything for me:'}\n\nStay till the end — the last one is the most powerful.`,
  ];

  return `${hook}\n\n${pick(bodies)}\n\n${ending}\n\n${cta}`;
}

function generateHashtags(platform: PlatformId, niche: string): string[] {
  const base = pick(PLATFORM_TEMPLATES[platform].hashtags);
  const tags = [base];
  // Add niche-specific tags
  const nicheTag = `#${niche.toLowerCase().replace(/\s+/g, '')}`;
  tags.push(nicheTag);
  // Add 3-5 more random platform tags
  const allTags = [...PLATFORM_TEMPLATES[platform].hashtags];
  for (let i = 0; i < Math.min(4, allTags.length); i++) {
    const t = pick(allTags.filter((x) => !tags.includes(x)));
    if (t) tags.push(t);
  }
  return tags.slice(0, platform === 'pinterest' ? 3 : 8);
}

function generateScript(platform: PlatformId, topic: string, caption: string): string {
  const hooks = [
    `Opening: Quick visual hook showing ${topic} — 2 seconds max.`,
    `Start with a bold statement: "Stop scrolling. ${topic} is about to change."`,
    `Cold open: Handwritten note or screen recording of ${topic} process.`,
  ];
  const mids = [
    `Middle: Show 3 key points with text overlays. Keep pace fast.`,
    `Core content: Walk through the steps visually, one at a time.`,
    `Main section: Split-screen comparison — before/after.`,
    `Show the process: screen recording or whiteboard walkthrough.`,
  ];
  const ends = [
    `Ending: CTA card with follow/save reminder.`,
    `Close: "Follow for more" text overlay + profile pin.`,
    `Final frame: Key takeaway text + CTA.`,
  ];
  return `${pick(hooks)}\n\n${pick(mids)}\n\n${pick(ends)}`;
}

function generateVisualDirection(platform: PlatformId, topic: string): string {
  const styles = [
    `Clean dark background with neon accent text. Minimal, high-contrast.`,
    `Gradient overlay (deep purple → indigo) with white sans-serif text.`,
    `Split-screen layout: visual on left, text overlay on right.`,
    `Full-bleed image with semi-transparent text box overlay.`,
    `Dark moody aesthetic with subtle particle effects and glow text.`,
  ];
  const platformSpecific = {
    instagram: `9:16 vertical (Reels) or 1:1 (Post). Text-safe zone centered. Brand colors.`,
    tiktok: `9:16 full screen. Hook text at top third. Fast cuts every 2-3 seconds.`,
    facebook: `1200x630 landscape or 1:1 square. Bold text overlay. Eye-catching colors.`,
    pinterest: `2:3 vertical pin. Bold headline text at top. Clean white or dark bg.`,
    linkedin: `1200x627 landscape. Professional but bold. Minimal text, strong visual.`,
  };
  return `${pick(styles)}\n\nPlatform spec: ${platformSpecific[platform]}`;
}

function generateThumbnailConcept(platform: PlatformId, topic: string): string {
  const concepts = [
    `Bold text overlay: "${topic} — What You Need to Know" on dark background`,
    `Split before/after image with dramatic lighting`,
    `Numbered list visual: "3 Things About ${topic}" with icon grid`,
    `Close-up of relevant object/screen with annotation arrows`,
    `Abstract geometric pattern with topic keyword in center`,
  ];
  return pick(concepts);
}

function bestPostingTime(platform: PlatformId): string {
  return pick(PLATFORM_TEMPLATES[platform].postTimes);
}

function estimatedReach(platform: PlatformId): string {
  const ranges = {
    instagram: ['2K-5K', '5K-15K', '10K-25K', '15K-50K'],
    tiktok: ['5K-20K', '10K-50K', '50K-200K', '100K-1M'],
    facebook: ['500-2K', '1K-5K', '3K-15K', '10K-50K'],
    pinterest: ['1K-3K', '3K-10K', '5K-20K', '10K-50K'],
    linkedin: ['500-2K', '1K-5K', '3K-10K', '5K-25K'],
  };
  return pick(ranges[platform]);
}

export function generateContent(input: GenerationInput): ContentItem[] {
  const items: ContentItem[] = [];
  const now = new Date();

  for (let i = 0; i < input.count; i++) {
    const platform = input.platform;
    const template = PLATFORM_TEMPLATES[platform];
    const format = pick(template.formats);
    const title = enrich(pick(NICHE_ENRICHERS[input.niche]?.examples || [input.topic]), { topic: input.topic });
    const caption = generateCaption(platform, input.topic, input.niche, input.tone);
    const hashtags = generateHashtags(platform, input.niche);

    const item: ContentItem = {
      id: `gen-${Date.now()}-${i}`,
      platform,
      format: format as ContentItem['format'],
      title,
      stage: 'ideation' as ContentStage,
      status: 'active',
      createdAt: new Date(now.getTime() + i * 86400000).toISOString(),
      updatedAt: now.toISOString(),
      assignee: 'AI Generator',
      input: {
        topic: input.topic,
        audience: input.audience,
        tone: input.tone,
        keywords: hashtags.slice(0, 5),
        callToAction: pick(template.ctaExamples),
        brandGuidelines: `Niche: ${input.niche}. Tone: ${input.tone}. Target: ${input.audience}.`,
      },
      output: {
        caption,
        hashtags,
        script: generateScript(platform, input.topic, caption),
        visualDirection: generateVisualDirection(platform, input.topic),
        thumbnailConcept: generateThumbnailConcept(platform, input.topic),
        postingTime: bestPostingTime(platform),
        estimatedReach: estimatedReach(platform),
      },
    };
    items.push(item);
  }

  return items;
}

// ── AI-powered content generation via Supabase Edge Function ──

interface AiGeneratedItem {
  title?: string;
  caption?: string;
  hashtags?: string[];
  script?: string;
  visualDirection?: string;
  thumbnailConcept?: string;
  postingTime?: string;
  estimatedReach?: string;
  pinTitle?: string;
  pinDescription?: string;
  boardName?: string;
  altText?: string;
}

function mapAiItem(item: AiGeneratedItem, platform: PlatformId, index: number): ContentItem {
  const format = pick(PLATFORM_TEMPLATES[platform].formats);
  return {
    id: `ai-${Date.now()}-${index}`,
    platform,
    format: format as ContentItem['format'],
    title: item.title || `AI Generated ${platform} Content ${index + 1}`,
    stage: 'ideation' as ContentStage,
    status: 'active',
    createdAt: new Date(Date.now() + index * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    assignee: 'AI Generator',
    input: {
      topic: '',
      audience: '',
      tone: '',
      keywords: (item.hashtags || []).slice(0, 5),
      callToAction: '',
      brandGuidelines: '',
    },
    output: {
      caption: item.caption || '',
      hashtags: item.hashtags || [],
      script: item.script || '',
      visualDirection: item.visualDirection || '',
      thumbnailConcept: item.thumbnailConcept || '',
      postingTime: item.postingTime || bestPostingTime(platform),
      estimatedReach: item.estimatedReach || estimatedReach(platform),
      pinTitle: item.pinTitle,
      pinDescription: item.pinDescription,
      boardName: item.boardName,
      altText: item.altText,
    },
  };
}

/**
 * Generate content using AI (OpenAI via Supabase Edge Function).
 * AI mode never silently falls back to templates. If the real call fails,
 * the caller must surface the error so the operator knows AI did not run.
 */
export async function generateContentAI(input: GenerationInput): Promise<ContentItem[]> {
  const { data, error } = await supabase.functions.invoke('generate-content', {
    body: {
      platform: input.platform,
      topic: input.topic,
      niche: input.niche,
      tone: input.tone,
      audience: input.audience,
      count: input.count,
    },
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);

  const items: AiGeneratedItem[] = data?.items || [];
  if (!items.length) throw new Error('AI generation returned no content items.');

  return items.map((item, i) => mapAiItem(item, input.platform, i));
}
