import { useState, useEffect, useRef, useCallback } from "react";
import { GoArrowLeft, GoInfo, GoPlus, GoDash, GoKebabHorizontal, GoLocation, GoChevronDown, GoPulse } from "react-icons/go";
import { TbLayoutListFilled, TbLayoutList } from "react-icons/tb";
import { MdOutlineViewCarousel } from "react-icons/md";
import { BsSliders2Vertical } from "react-icons/bs";

/* ────────────────────────────────────────────
   Genre & Voice Constants + Preset Mappings
   ──────────────────────────────────────────── */

const GENRES = [
  { id: "fantasy", label: "Fantasy", mood: 7, prompt: "mythical creatures, ancient magic, epic quests" },
  { id: "romance", label: "Romance", mood: 6, dialogue: 6, prompt: "emotional tension, relationships, longing" },
  { id: "mystery", label: "Mystery", mood: 3, prompt: "clues, suspicion, hidden truths, tension" },
  { id: "scifi", label: "Science Fiction", mood: 5, prompt: "technology, alien worlds, future societies" },
  { id: "bedtime", label: "Bedtime", mood: 7, prompt: "wonder, imagination, gentle lessons, playful adventures" },
  { id: "horror", label: "Horror", mood: 1, prompt: "dread, the uncanny, creeping fear" },
];

const VOICES_BY_GENRE = {
  fantasy: [
    { id: "lyrical", label: "Lyrical & Labyrinthine", tone: 7, length: 6, description: "Winding, dreamlike, nested clauses" },
    { id: "poetic", label: "Poetic & Dramatic", tone: 8, length: 5, description: "Elevated language, rhythm, metaphor" },
    { id: "gothic", label: "Lush & Gothic", tone: 8, length: 7, description: "Dense atmosphere, ornate description" },
    { id: "cinematic", label: "Cinematic & Vivid", tone: 6, length: 5, dialogue: 4, description: "Visual, fast-paced, sensory-driven" },
    { id: "mythic", label: "Mythic & Ancient", tone: 7, length: 5, description: "Timeless cadence, legend-like narration" },
    { id: "spare", label: "Spare & Direct", tone: 2, length: 3, description: "Short sentences, no embellishment" },
  ],
  romance: [
    { id: "lyrical", label: "Lyrical & Tender", tone: 7, length: 6, description: "Flowing prose, emotionally rich" },
    { id: "witty", label: "Witty & Sparkling", tone: 5, length: 4, dialogue: 6, description: "Sharp banter, playful tension" },
    { id: "slow-burn", label: "Slow Burn", tone: 6, length: 6, dialogue: 4, description: "Gradual intimacy, lingering detail" },
    { id: "passionate", label: "Passionate & Bold", tone: 8, length: 5, dialogue: 5, description: "Intense emotions, dramatic moments" },
    { id: "spare", label: "Spare & Honest", tone: 3, length: 3, description: "Understated, raw, emotionally direct" },
    { id: "cinematic", label: "Cinematic & Vivid", tone: 6, length: 5, dialogue: 4, description: "Visual, fast-paced, sensory-driven" },
  ],
  mystery: [
    { id: "spare", label: "Spare & Direct", tone: 2, length: 3, description: "Short sentences, no embellishment" },
    { id: "noir", label: "Noir & Hardboiled", tone: 4, length: 4, dialogue: 5, description: "Cynical voice, streetwise, moody" },
    { id: "wry", label: "Wry & Observant", tone: 4, length: 4, dialogue: 5, description: "Dry wit, sharp observation" },
    { id: "atmospheric", label: "Atmospheric & Tense", tone: 6, length: 5, description: "Slow dread, layered detail" },
    { id: "clinical", label: "Clinical & Precise", tone: 2, length: 3, description: "Forensic eye, methodical, detached" },
    { id: "cinematic", label: "Cinematic & Vivid", tone: 6, length: 5, dialogue: 4, description: "Visual, fast-paced, sensory-driven" },
  ],
  scifi: [
    { id: "spare", label: "Spare & Direct", tone: 2, length: 3, description: "Short sentences, no embellishment" },
    { id: "cinematic", label: "Cinematic & Vivid", tone: 6, length: 5, dialogue: 4, description: "Visual, fast-paced, sensory-driven" },
    { id: "cerebral", label: "Cerebral & Cool", tone: 3, length: 5, description: "Ideas-driven, detached, philosophical" },
    { id: "lyrical", label: "Lyrical & Strange", tone: 7, length: 6, description: "Alien beauty, dreamlike imagery" },
    { id: "wry", label: "Wry & Observant", tone: 4, length: 4, dialogue: 5, description: "Dry wit, sharp observation" },
    { id: "clinical", label: "Clinical & Precise", tone: 2, length: 4, description: "Detached, technical, matter-of-fact" },
  ],
  bedtime: [
    { id: "warm", label: "Warm & Gentle", tone: 5, length: 4, description: "Soft, soothing, reassuring" },
    { id: "playful", label: "Playful & Silly", tone: 4, length: 3, dialogue: 5, description: "Fun voices, giggles, surprises" },
    { id: "whimsical", label: "Whimsical & Magical", tone: 6, length: 4, description: "Fairy-tale wonder, enchanting details" },
    { id: "rhyming", label: "Rhythmic & Singsongy", tone: 5, length: 3, description: "Musical cadence, near-rhymes" },
    { id: "adventurous", label: "Adventurous & Brave", tone: 5, length: 4, dialogue: 4, description: "Exciting journeys, can-do spirit" },
    { id: "cozy", label: "Cozy & Snug", tone: 5, length: 4, description: "Blanket-soft narration, safe and calm" },
  ],
  horror: [
    { id: "gothic", label: "Lush & Gothic", tone: 8, length: 7, description: "Dense atmosphere, ornate description" },
    { id: "spare", label: "Spare & Dread", tone: 2, length: 3, description: "Stark, stripped-down, unsettling" },
    { id: "atmospheric", label: "Creeping & Slow", tone: 6, length: 6, description: "Building unease, lingering detail" },
    { id: "clinical", label: "Clinical & Wrong", tone: 2, length: 4, description: "Detached tone that makes it worse" },
    { id: "feverish", label: "Feverish & Unhinged", tone: 8, length: 5, dialogue: 3, description: "Frantic, unreliable, spiraling" },
    { id: "wry", label: "Darkly Comic", tone: 4, length: 4, dialogue: 4, description: "Gallows humor, ironic detachment" },
  ],
};

const ALL_VOICES = Object.values(VOICES_BY_GENRE).flat();
function getVoicesForGenre(genreId) {
  return VOICES_BY_GENRE[genreId] || VOICES_BY_GENRE.fantasy;
}

const THEMES_BY_GENRE = {
  fantasy: [
    { id: "redemption", label: "Redemption", prompt: "seeking forgiveness and second chances" },
    { id: "power", label: "Power & Corruption", prompt: "the corrupting influence of power and ambition" },
    { id: "identity", label: "Identity", prompt: "questioning who we are and who we become" },
    { id: "freedom", label: "Freedom", prompt: "the struggle for liberation and autonomy" },
    { id: "sacrifice", label: "Sacrifice", prompt: "giving up what matters most for a greater cause" },
    { id: "legacy", label: "Legacy", prompt: "what we inherit and what we leave behind" },
  ],
  romance: [
    { id: "love-loss", label: "Love & Loss", prompt: "deep emotional bonds and the pain of separation" },
    { id: "identity", label: "Identity", prompt: "questioning who we are and who we become" },
    { id: "betrayal", label: "Betrayal", prompt: "broken trust and its consequences" },
    { id: "freedom", label: "Freedom", prompt: "the struggle for liberation and autonomy" },
    { id: "forgiveness", label: "Forgiveness", prompt: "letting go of hurt and finding peace" },
    { id: "desire", label: "Desire", prompt: "longing, want, and what we chase" },
  ],
  mystery: [
    { id: "betrayal", label: "Betrayal", prompt: "broken trust and its consequences" },
    { id: "justice", label: "Justice", prompt: "the pursuit of what is right against what is easy" },
    { id: "identity", label: "Identity", prompt: "questioning who we are and who we become" },
    { id: "power", label: "Power & Corruption", prompt: "the corrupting influence of power and ambition" },
    { id: "obsession", label: "Obsession", prompt: "a fixation that consumes and distorts" },
    { id: "truth", label: "Truth & Deception", prompt: "the gap between what is seen and what is real" },
  ],
  scifi: [
    { id: "identity", label: "Identity", prompt: "questioning who we are and who we become" },
    { id: "survival", label: "Survival", prompt: "endurance against overwhelming odds" },
    { id: "freedom", label: "Freedom", prompt: "the struggle for liberation and autonomy" },
    { id: "power", label: "Power & Corruption", prompt: "the corrupting influence of power and ambition" },
    { id: "evolution", label: "Evolution", prompt: "transformation of species, society, or self" },
    { id: "connection", label: "Connection", prompt: "bridging distance, species, or understanding" },
  ],
  bedtime: [
    { id: "friendship", label: "Friendship", prompt: "the power of companionship and loyalty" },
    { id: "courage", label: "Courage", prompt: "finding bravery even when you're scared" },
    { id: "kindness", label: "Kindness", prompt: "small acts of generosity that change everything" },
    { id: "belonging", label: "Belonging", prompt: "finding where you fit in the world" },
    { id: "curiosity", label: "Curiosity", prompt: "the wonder of exploring and discovering" },
    { id: "growing-up", label: "Growing Up", prompt: "learning new things and becoming who you are" },
  ],
  horror: [
    { id: "survival", label: "Survival", prompt: "endurance against overwhelming odds" },
    { id: "betrayal", label: "Betrayal", prompt: "broken trust and its consequences" },
    { id: "identity", label: "Identity", prompt: "questioning who we are and who we become" },
    { id: "isolation", label: "Isolation", prompt: "being cut off, alone, and vulnerable" },
    { id: "guilt", label: "Guilt", prompt: "sins that follow and demand payment" },
    { id: "forbidden", label: "Forbidden Knowledge", prompt: "truths that should have stayed buried" },
  ],
};

const ALL_THEMES = Object.values(THEMES_BY_GENRE).flat();
function getThemesForGenre(genreId) {
  return THEMES_BY_GENRE[genreId] || THEMES_BY_GENRE.fantasy;
}

const PROTAGONISTS_BY_GENRE = {
  fantasy: [
    { id: "reluctant-hero", label: "Reluctant Hero", prompt: "a protagonist thrust unwillingly into action" },
    { id: "outsider", label: "Outsider", prompt: "a protagonist who doesn't belong and sees society from the margins" },
    { id: "scholar", label: "Scholar", prompt: "a seeker of knowledge drawn into events beyond the academic" },
    { id: "wanderer", label: "Wanderer", prompt: "a rootless traveler searching for meaning or home" },
    { id: "ruler", label: "Ruler", prompt: "a leader burdened by the weight of command and consequence" },
    { id: "outcast", label: "Outcast", prompt: "a rejected figure forging their own path" },
  ],
  romance: [
    { id: "outsider", label: "Outsider", prompt: "a protagonist who doesn't belong and sees society from the margins" },
    { id: "wanderer", label: "Wanderer", prompt: "a rootless traveler searching for meaning or home" },
    { id: "caretaker", label: "Caretaker", prompt: "someone who puts others first, learning to accept love in return" },
    { id: "rebel", label: "Rebel", prompt: "a free spirit who resists expectations" },
    { id: "dreamer", label: "Dreamer", prompt: "an idealist chasing something just out of reach" },
    { id: "stranger", label: "Stranger in Town", prompt: "a newcomer who disrupts the familiar" },
  ],
  mystery: [
    { id: "detective", label: "Detective", prompt: "an investigator driven to uncover the truth" },
    { id: "anti-hero", label: "Anti-Hero", prompt: "a morally ambiguous protagonist with questionable methods" },
    { id: "outsider", label: "Outsider", prompt: "a protagonist who doesn't belong and sees society from the margins" },
    { id: "journalist", label: "Journalist", prompt: "a reporter who won't let go of a story" },
    { id: "witness", label: "Witness", prompt: "someone who saw too much and can't unsee it" },
    { id: "suspect", label: "Suspect", prompt: "accused and racing to prove their innocence" },
  ],
  scifi: [
    { id: "reluctant-hero", label: "Reluctant Hero", prompt: "a protagonist thrust unwillingly into action" },
    { id: "scholar", label: "Scientist", prompt: "a researcher confronting the consequences of discovery" },
    { id: "outsider", label: "Outsider", prompt: "a protagonist who doesn't belong and sees society from the margins" },
    { id: "android", label: "Artificial Being", prompt: "a created intelligence questioning its own nature" },
    { id: "pilot", label: "Pilot", prompt: "a navigator of ships, stations, or unknown frontiers" },
    { id: "survivor", label: "Last Survivor", prompt: "the sole remaining witness to a lost world" },
  ],
  bedtime: [
    { id: "child", label: "Curious Child", prompt: "a young explorer discovering the world with wonder" },
    { id: "animal", label: "Brave Animal", prompt: "a loyal creature on an unexpected adventure" },
    { id: "tiny-creature", label: "Tiny Creature", prompt: "a small being proving that size doesn't matter" },
    { id: "lost-toy", label: "Lost Toy", prompt: "a beloved toy on a journey back home" },
    { id: "sibling", label: "Big Sibling", prompt: "an older brother or sister learning to protect and share" },
    { id: "magical-friend", label: "Magical Friend", prompt: "a fantastical companion who appears when needed most" },
  ],
  horror: [
    { id: "anti-hero", label: "Anti-Hero", prompt: "a morally ambiguous protagonist with questionable methods" },
    { id: "outsider", label: "Outsider", prompt: "a protagonist who doesn't belong and sees society from the margins" },
    { id: "child", label: "Child", prompt: "a young protagonist experiencing the world with fresh, terrified eyes" },
    { id: "skeptic", label: "Skeptic", prompt: "a rational mind forced to confront the inexplicable" },
    { id: "caretaker", label: "Caretaker", prompt: "someone responsible for others in an impossible situation" },
    { id: "inheritor", label: "Inheritor", prompt: "someone who has received something they shouldn't have" },
  ],
};

const ALL_PROTAGONISTS = Object.values(PROTAGONISTS_BY_GENRE).flat();
function getProtagonistsForGenre(genreId) {
  return PROTAGONISTS_BY_GENRE[genreId] || PROTAGONISTS_BY_GENRE.fantasy;
}

const TENSIONS_BY_GENRE = {
  fantasy: [
    { id: "vs-nature", label: "Person vs Nature", prompt: "conflict against the natural world and its forces" },
    { id: "vs-self", label: "Person vs Self", prompt: "internal struggle, doubt, and inner demons" },
    { id: "vs-person", label: "Person vs Person", prompt: "direct conflict between characters with opposing goals" },
    { id: "fate", label: "Fate / Prophecy", prompt: "the tension between destiny and free will" },
    { id: "vs-power", label: "Person vs Power", prompt: "standing against a force far greater than oneself" },
    { id: "quest", label: "The Quest", prompt: "a journey toward a goal that keeps shifting" },
  ],
  romance: [
    { id: "vs-self", label: "Person vs Self", prompt: "internal struggle, doubt, and inner demons" },
    { id: "vs-person", label: "Person vs Person", prompt: "direct conflict between characters with opposing goals" },
    { id: "vs-society", label: "Person vs Society", prompt: "rebellion against social norms and institutions" },
    { id: "timing", label: "Wrong Timing", prompt: "love that arrives at the worst possible moment" },
    { id: "secret", label: "Hidden Truth", prompt: "a secret that could change everything between them" },
    { id: "distance", label: "Distance", prompt: "separation that tests the strength of connection" },
  ],
  mystery: [
    { id: "vs-person", label: "Person vs Person", prompt: "direct conflict between characters with opposing goals" },
    { id: "mystery", label: "Mystery / Secret", prompt: "a hidden truth that drives the narrative forward" },
    { id: "vs-self", label: "Person vs Self", prompt: "internal struggle, doubt, and inner demons" },
    { id: "vs-society", label: "Person vs Society", prompt: "rebellion against social norms and institutions" },
    { id: "clock", label: "Race Against Time", prompt: "a deadline that tightens with every chapter" },
    { id: "trust", label: "Shifting Trust", prompt: "allies who might be enemies in disguise" },
  ],
  scifi: [
    { id: "vs-nature", label: "Person vs Nature", prompt: "conflict against the natural world and its forces" },
    { id: "vs-self", label: "Person vs Self", prompt: "internal struggle, doubt, and inner demons" },
    { id: "vs-society", label: "Person vs Society", prompt: "rebellion against social norms and institutions" },
    { id: "vs-technology", label: "Person vs Technology", prompt: "conflict with the machines and systems we created" },
    { id: "vs-unknown", label: "Person vs Unknown", prompt: "encountering something beyond comprehension" },
    { id: "paradox", label: "Paradox", prompt: "contradictions that unravel the rules of the world" },
  ],
  bedtime: [
    { id: "getting-lost", label: "Getting Lost", prompt: "wandering far from home and finding the way back" },
    { id: "big-fear", label: "Facing a Fear", prompt: "confronting something scary and discovering bravery" },
    { id: "new-friend", label: "Making a Friend", prompt: "overcoming shyness to form an unlikely bond" },
    { id: "vs-nature", label: "Wild Weather", prompt: "a storm, a flood, or a long winter to outlast" },
    { id: "mix-up", label: "A Big Mix-Up", prompt: "a silly misunderstanding that snowballs into adventure" },
    { id: "promise", label: "A Promise to Keep", prompt: "a vow that's harder to honor than expected" },
  ],
  horror: [
    { id: "vs-self", label: "Person vs Self", prompt: "internal struggle, doubt, and inner demons" },
    { id: "vs-nature", label: "Person vs Nature", prompt: "conflict against the natural world and its forces" },
    { id: "vs-unknown", label: "Person vs Unknown", prompt: "encountering something beyond comprehension" },
    { id: "mystery", label: "Mystery / Secret", prompt: "a hidden truth that drives the narrative forward" },
    { id: "confinement", label: "Confinement", prompt: "trapped with no clear way out" },
    { id: "corruption", label: "Corruption", prompt: "something familiar slowly becoming wrong" },
  ],
};

const ALL_TENSIONS = Object.values(TENSIONS_BY_GENRE).flat();
function getTensionsForGenre(genreId) {
  return TENSIONS_BY_GENRE[genreId] || TENSIONS_BY_GENRE.fantasy;
}

function getStyleForStory(genre, voice) {
  const g = GENRES.find((x) => x.id === genre) || GENRES[0];
  const v = ALL_VOICES.find((x) => x.id === voice) || getVoicesForGenre(genre)[0];
  return {
    tone: v.tone,
    length: v.length,
    mood: g.mood,
    dialogue: g.dialogue || v.dialogue || 2,
  };
}

function getStoryContext(meta) {
  const g = GENRES.find((x) => x.id === meta.genre);
  const v = ALL_VOICES.find((x) => x.id === meta.writingStyle);
  if (!g || !v) return "";
  let ctx = `This is a ${g.label} story written in a ${v.label.toLowerCase()} voice. Key themes: ${g.prompt}. Writing style: ${v.description.toLowerCase()}.`;
  if (meta.themes && meta.themes.length > 0) {
    const themeDescs = meta.themes.map((id) => ALL_THEMES.find((t) => t.id === id)).filter(Boolean);
    if (themeDescs.length > 0) ctx += ` Thematic focus: ${themeDescs.map((t) => t.prompt).join("; ")}.`;
  }
  if (meta.protagonist) {
    const p = ALL_PROTAGONISTS.find((x) => x.id === meta.protagonist);
    if (p) ctx += ` Protagonist: ${p.prompt}.`;
  }
  if (meta.tension) {
    const t = ALL_TENSIONS.find((x) => x.id === meta.tension);
    if (t) ctx += ` Central tension: ${t.prompt}.`;
  }
  return ctx;
}

/* ────────────────────────────────────────────
   Stories Index Helpers
   ──────────────────────────────────────────── */

const STORIES_INDEX_KEY = "stories-index-v1";

async function loadStoriesIndex() {
  try {
    const result = await window.storage.get(STORIES_INDEX_KEY, true);
    return result ? JSON.parse(result.value) : [];
  } catch {
    return [];
  }
}

async function saveStoriesIndex(index) {
  await window.storage.set(STORIES_INDEX_KEY, JSON.stringify(index), true);
}

function storyKey(id, suffix) {
  return `story-${id}-${suffix}`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function findStoryBySlug(index, slug) {
  return index.find((s) => s.slug === slug);
}

/* ────────────────────────────────────────────
   Shared API Helper
   ──────────────────────────────────────────── */

async function callClaude(system, userMessage, maxTokens = 100) {
  const resp = await fetch("/api/anthropic/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!resp.ok) {
    const errBody = await resp.text().catch(() => "unknown");
    throw new Error(`API ${resp.status}: ${errBody.slice(0, 200)}`);
  }
  const data = await resp.json();
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

async function deleteStoryData(id) {
  const suffixes = ["data-v1", "prompt-v1", "count-v1", "chapter-v1", "titles-v1"];
  for (const s of suffixes) {
    await window.storage.delete(storyKey(id, s), true).catch(() => {});
  }
}

/* ────────────────────────────────────────────
   AI Prompt Generation
   ──────────────────────────────────────────── */

async function generatePrompt(existingStory, chapter = 1, isNewChapter = false, genreVoiceCtx = "") {
  const storyContext = existingStory.length > 0
    ? existingStory.slice(-3).map((e) => e.text).join("\n\n")
    : "";

  const systemPrompt = `Generate a single question that a person can answer in a few words. It must be a question ending with "?" that invites a short, imaginative response. NOT a story sentence. NOT a statement. It should feel like a question a friend asks you.
${genreVoiceCtx ? `\nContext: ${genreVoiceCtx}\nThe question should fit naturally within this genre and voice.\n` : ""}
Good examples:
- "What did the stranger have in their pocket?"
- "What was written on the note?"
- "What woke everyone up at 3am?"
- "What did it smell like inside?"

Bad examples (DO NOT do these):
- "The door creaked open revealing..." (this is a statement, not a question)
- "A mysterious light appeared in the sky." (this is a story sentence)
- "Continue the story about..." (this is an instruction)

Output ONLY the question. No quotes. Under 12 words.`;

  let userMessage;
  if (existingStory.length === 0) {
    userMessage = "Generate an opening question that will seed the very first paragraph of a novel. The question should invite the user to establish a character, a place, or a mood — something that anchors the reader in a scene. Examples: \"Who was standing at the door?\" or \"What kind of town was it?\" or \"What was the first thing you noticed about the room?\"";
  } else if (isNewChapter) {
    userMessage = `STORY SO FAR (last passages):\n"""${storyContext}"""\n\nYou are starting Chapter ${chapter} of the story. Generate an opening question for this new chapter that shifts the setting, introduces a new thread, or jumps forward in time. It should feel like a fresh start while still connected to the world established so far.`;
  } else {
    userMessage = `STORY SO FAR (last passages):\n"""${storyContext}"""\n\nGenerate a short question about what happens next in Chapter ${chapter}, based on the story so far.`;
  }

  try {
    const text = await callClaude(systemPrompt, userMessage, 100);
    if (text && text.length > 5) return text;
  } catch (err) {
    console.warn("Prompt generation failed:", err.message);
  }

  const fallbacks = [
    "What happened next?",
    "Something unexpected appeared...",
    "A sound broke the silence...",
    "Someone arrived with news...",
    "The weather suddenly changed...",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/* ────────────────────────────────────────────
   AI Story Generation via Anthropic API
   ──────────────────────────────────────────── */

function getStyleInstructions(settings) {
  const { tone, length, mood, dialogue, surprise = 3, emotion = 4 } = settings;

  const toneDesc = tone <= 3
    ? `minimalist and spare (${tone}/9) — short declarative sentences, very few adjectives`
    : tone <= 6
    ? `balanced literary prose (${tone}/9) — moderate detail and description`
    : `lush and ornate (${tone}/9) — richly descriptive with layered sensory detail and elaborate phrasing`;

  const sentenceCount = Math.round(1 + (length / 9) * 5);
  const lengthDesc = `approximately ${sentenceCount} sentence${sentenceCount !== 1 ? "s" : ""}`;

  const moodDesc = mood <= 3
    ? `dark and unsettling (${mood}/9) — undercurrents of dread and unease`
    : mood <= 6
    ? `mysterious and grounded (${mood}/9) — slightly magical, atmospheric`
    : `light and whimsical (${mood}/9) — playful with gentle humor`;

  const dialogueDesc = dialogue <= 2
    ? "no dialogue, only narration"
    : dialogue <= 5
    ? "occasional brief dialogue mixed with narration"
    : `dialogue-heavy (${dialogue}/9) — characters speaking to each other frequently`;

  const surpriseDesc = surprise <= 2
    ? "predictable and steady (keep the narrative on a familiar path)"
    : surprise <= 5
    ? "mild surprises (small twists or unexpected details woven in)"
    : `highly unexpected (${surprise}/9) — surprising turns, subverted expectations, strange revelations`;

  const emotionDesc = emotion <= 2
    ? "emotionally restrained — understated feelings, mostly implied"
    : emotion <= 5
    ? "moderate emotional depth — characters show feelings but stay grounded"
    : `emotionally expressive (${emotion}/9) — vivid inner life, strong feelings surfacing openly`;

  return `- Style: ${toneDesc}
- Length: ${lengthDesc}
- Mood: ${moodDesc}
- Dialogue: ${dialogueDesc}
- Surprise: ${surpriseDesc}
- Emotion: ${emotionDesc}`;
}

async function shouldEndChapter(story, currentChapter) {
  const chapterPassages = story.filter((e) => e.chapter === currentChapter);
  if (chapterPassages.length < 4) return false;

  const chapterText = chapterPassages.map((e) => e.text).join("\n\n");

  try {
    const answer = await callClaude(
      `You are a narrative structure analyst. Given the passages of a story chapter, determine if the chapter's narrative arc feels complete — has it built tension and reached a natural resolution or resting point? Consider: has there been a setup, development, and some form of payoff or shift? Chapters typically run 5-8 passages but can be shorter if the arc resolves early. Respond with ONLY "yes" or "no".`,
      `Here are the passages of Chapter ${currentChapter}:\n\n${chapterText}\n\nIs this chapter's narrative arc complete?`,
      10
    );
    return answer.toLowerCase().startsWith("yes");
  } catch (err) {
    console.warn("Chapter check failed:", err.message);
    return false;
  }
}

async function generateChapterTitle(story, chapter) {
  const chapterText = story
    .filter((e) => e.chapter === chapter)
    .map((e) => e.text)
    .join("\n\n");

  try {
    const title = await callClaude(
      `You are a literary editor. Given the text of a story chapter, produce a short, evocative chapter title. Output ONLY the title — no quotes, no "Chapter N:", no punctuation unless it's part of the title. 2-5 words.`,
      `Here is Chapter ${chapter}:\n\n${chapterText}\n\nWhat should this chapter be titled?`,
      30
    );
    const cleaned = title.replace(/^["']|["']$/g, "");
    return cleaned && cleaned.length > 0 ? cleaned : null;
  } catch (err) {
    console.warn("Chapter title generation failed:", err.message);
    return null;
  }
}

async function callClaudeAPI(existingStory, prompt, userAnswer, styleSettings, chapter = 1, genreVoiceCtx = "") {
  const storyContext =
    existingStory.length > 0
      ? (() => {
          const recent = existingStory.slice(-8);
          const first = existingStory[0];
          // Include first passage for grounding if it's not already in the recent window
          const passages = recent.includes(first) ? recent : [first, ...recent];
          return passages.map((e) => e.text).join("\n\n");
        })()
      : "";

  const styleInstructions = getStyleInstructions(styleSettings);

  const systemPrompt = `You are a collaborative storyteller writing Chapter ${chapter} of an evolving collaborative story. You take a user's brief answer to a creative writing prompt and transform it into prose that continues the story.
${genreVoiceCtx ? `\n${genreVoiceCtx}\n` : ""}
CRITICAL RULES:
- Write ONLY the story text. No preamble, no explanation, no quotes around it.
- Write in third person, past tense.
- Seamlessly continue from the existing story if provided.
- The output must be substantially different and richer than the user's raw input.
- Build toward a satisfying narrative arc within this chapter.

YOU MUST STRICTLY FOLLOW THESE STYLE SETTINGS — they are the most important constraint:
${styleInstructions}

These style settings override any other instinct you have. If the style says "spare", write bare-bones prose. If it says "ornate", write elaborate prose. If it says "1 sentence", write exactly 1 sentence. If dialogue is "none", include zero dialogue. Follow the settings literally.`;

  const userMessage =
    existingStory.length > 0
      ? `STORY SO FAR (last passages):\n"""${storyContext}"""\n\nPROMPT SHOWN TO USER: "${prompt}"\nUSER'S ANSWER: "${userAnswer}"\n\nTransform their answer into the next story passage following the style settings exactly. Continue naturally from what came before. Output ONLY the story text.`
      : `This is the FIRST passage of a brand new story — the opening paragraph.\n\nPROMPT SHOWN TO USER: "${prompt}"\nUSER'S ANSWER: "${userAnswer}"\n\nWrite this as the opening paragraph of a novel. It should establish setting, character, or atmosphere and draw the reader in immediately. Ground the reader in a specific scene — a place, a moment, a sensory detail. Weave the user's answer naturally into the prose. This must read like the first paragraph you'd find on page one of a published book. Follow the style settings exactly. Output ONLY the story text.`;

  const text = await callClaude(systemPrompt, userMessage, 1000);

  if (!text || text.length < 10) {
    throw new Error("API returned empty or too-short text");
  }

  if (text.toLowerCase() === userAnswer.toLowerCase().trim()) {
    throw new Error("AI echoed input verbatim");
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* ────────────────────────────────────────────
   AI Story Opener (title + first paragraph)
   ──────────────────────────────────────────── */

async function generateStoryOpener(meta) {
  const genreObj = GENRES.find((g) => g.id === meta.genre);
  const voiceObj = ALL_VOICES.find((v) => v.id === meta.writingStyle);
  if (!genreObj || !voiceObj) return null;

  const styleSettings = getStyleForStory(meta.genre, meta.writingStyle);
  const styleInstructions = getStyleInstructions(styleSettings);

  let extraContext = "";
  if (meta.themes && meta.themes.length > 0) {
    const themeDescs = meta.themes.map((id) => ALL_THEMES.find((t) => t.id === id)).filter(Boolean);
    if (themeDescs.length > 0) extraContext += `\nThematic focus: ${themeDescs.map((t) => `${t.label} (${t.prompt})`).join(", ")}`;
  }
  if (meta.protagonist) {
    const p = ALL_PROTAGONISTS.find((x) => x.id === meta.protagonist);
    if (p) extraContext += `\nProtagonist type: ${p.label} — ${p.prompt}`;
  }
  if (meta.tension) {
    const t = ALL_TENSIONS.find((x) => x.id === meta.tension);
    if (t) extraContext += `\nCentral tension: ${t.label} — ${t.prompt}`;
  }

  try {
    const text = await callClaude(
      `You are a novelist. Given a genre and writing voice, generate the title and opening paragraph of an original story.

Genre: ${genreObj.label} — themes: ${genreObj.prompt}
Voice: ${voiceObj.label} — ${voiceObj.description.toLowerCase()}${extraContext}

Style constraints:
${styleInstructions}

Respond in EXACTLY this format (no extra text):
TITLE: <a short evocative title, 2-5 words>
PARAGRAPH: <the opening paragraph>

The opening paragraph must read like page one of a published novel — establish a character, setting, or atmosphere. Ground the reader in a specific scene. Follow the style constraints literally.`,
      "Write the title and opening paragraph.",
      600
    );

    const titleMatch = text.match(/TITLE:\s*(.+)/i);
    const paraMatch = text.match(/PARAGRAPH:\s*([\s\S]+)/i);
    if (!titleMatch || !paraMatch) return null;

    return {
      title: titleMatch[1].trim().replace(/^["']|["']$/g, ""),
      paragraph: paraMatch[1].trim().charAt(0).toUpperCase() + paraMatch[1].trim().slice(1),
    };
  } catch (err) {
    console.warn("Story opener generation failed:", err.message);
    return null;
  }
}

/* ────────────────────────────────────────────
   Local fallback story expansion (no API)
   ──────────────────────────────────────────── */

const SCENE_OPENERS = [
  "It was the kind of moment that made the air feel heavier.",
  "The town had seen many strange things, but nothing quite like this.",
  "No one could say exactly when it started, only that it did.",
  "The evening light shifted, casting long shadows across the cobblestones.",
  "A hush fell over the square, thick as morning fog.",
  "Time seemed to slow, the way it does before something changes forever.",
  "The wind carried with it a scent no one could name.",
  "Something stirred at the edge of perception, just beyond understanding.",
];

const CONTINUATIONS = [
  "The townsfolk exchanged uneasy glances, sensing that the world had tilted slightly on its axis.",
  "It lingered in the air like a half-remembered dream, impossible to shake.",
  "No one spoke of it aloud, but everyone felt the shift in their bones.",
  "The silence that followed was louder than any sound the town had ever known.",
  "Even the stray cats paused in the alleyways, ears pricked toward something unseen.",
  "It was as if the town itself had drawn a breath and was holding it still.",
  "Those who witnessed it would carry the memory like a stone in their pocket, smooth and heavy.",
  "By the time anyone thought to question it, the moment had already slipped into the fabric of the town's long history.",
];

function expandLocally(existingStory, userAnswer) {
  const seed =
    userAnswer.split("").reduce((a, c) => a + c.charCodeAt(0), 0) +
    existingStory.length;

  const answer = userAnswer.trim();
  const polished = answer.charAt(0).toUpperCase() + answer.slice(1);
  const withPunctuation = /[.!?]$/.test(polished) ? polished : polished + ".";

  if (existingStory.length === 0) {
    const opener = SCENE_OPENERS[seed % SCENE_OPENERS.length];
    const continuation = CONTINUATIONS[(seed + 3) % CONTINUATIONS.length];
    return `${opener} ${withPunctuation} ${continuation}`;
  } else {
    const continuation = CONTINUATIONS[seed % CONTINUATIONS.length];
    return `${withPunctuation} ${continuation}`;
  }
}

/* ────────────────────────────────────────────
   Main generation function with fallback
   ──────────────────────────────────────────── */

async function fetchLocation() {
  // Use browser geolocation if enabled
  if (localStorage.getItem("falcor_geo_enabled") === "true") {
    const loc = await requestBrowserLocation();
    if (loc) return loc;
  }

  // Fall back to IP-based geolocation
  try {
    const resp = await fetch("https://ipapi.co/json/");
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.region && data.country_name) return data.region + ", " + data.country_name;
    if (data.country_name) return data.country_name;
    return null;
  } catch {
    return null;
  }
}

function requestBrowserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=14`);
          if (!resp.ok) { resolve(null); return; }
          const data = await resp.json();
          const addr = data.address || {};
          const place = addr.borough || addr.suburb || addr.neighbourhood || addr.city || addr.town || addr.village || addr.municipality || "";
          const country = addr.country || "";
          const location = place && country ? `${place}, ${country}` : country || null;
          resolve(location);
        } catch { resolve(null); }
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 300000 }
    );
  });
}

async function generateStoryPassage(existingStory, prompt, userAnswer, styleSettings, chapter = 1, genreVoiceCtx = "") {
  try {
    const aiText = await callClaudeAPI(existingStory, prompt, userAnswer, styleSettings, chapter, genreVoiceCtx);
    return { text: aiText, source: "ai" };
  } catch (err) {
    console.warn("AI generation failed, using local expansion:", err.message);
  }
  const localText = expandLocally(existingStory, userAnswer);
  return { text: localText, source: "local" };
}

/* ────────────────────────────────────────────
   Paragraph Splitting
   ──────────────────────────────────────────── */

function splitIntoParagraphs(text) {
  if (!text) return [text];
  // If the text already has double newlines, split on those
  if (text.includes("\n\n")) {
    return text.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
  }
  // For long single-block text, split at sentence boundaries roughly every 3-4 sentences
  const sentences = text.match(/[^.!?]+[.!?]+[\s"]*/g);
  if (!sentences || sentences.length <= 3) return [text];
  const paragraphs = [];
  let current = "";
  let count = 0;
  const target = Math.ceil(sentences.length / Math.ceil(sentences.length / 3));
  for (const s of sentences) {
    current += s;
    count++;
    if (count >= target) {
      paragraphs.push(current.trim());
      current = "";
      count = 0;
    }
  }
  if (current.trim()) paragraphs.push(current.trim());
  return paragraphs.length > 0 ? paragraphs : [text];
}

/* ────────────────────────────────────────────
   Typewriter Reveal
   ──────────────────────────────────────────── */

function TypewriterReveal({ text, narrow, onComplete }) {
  const [charCount, setCharCount] = useState(0);
  const idx = useRef(0);
  const paragraphs = useRef([]);

  // Compute paragraph breaks once from the full text
  useEffect(() => {
    paragraphs.current = splitIntoParagraphs(text);
    idx.current = 0;
    setCharCount(0);
    const interval = setInterval(() => {
      idx.current++;
      if (idx.current <= text.length) {
        setCharCount(idx.current);
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 18);
    return () => clearInterval(interval);
  }, [text, onComplete]);

  // Map charCount to pre-computed paragraphs
  const fullParagraphs = paragraphs.current;
  const visibleParagraphs = [];
  let remaining = charCount;
  for (const para of fullParagraphs) {
    if (remaining <= 0) break;
    const shown = para.slice(0, remaining);
    visibleParagraphs.push(shown);
    remaining -= para.length;
  }
  const isTyping = charCount < text.length;

  return (
    <div style={{
      fontFamily: "'Courier New', 'Courier', monospace", fontSize: "16px", fontWeight: 400,
      lineHeight: 1.7, color: "#e8ddd0", fontStyle: "normal", margin: 0,
      textRendering: "optimizeLegibility", fontOpticalSizing: "auto",
      fontFeatureSettings: '"kern", "liga", "calt"',
      hangingPunctuation: "first last",
      textWrap: narrow ? "auto" : "pretty",
      hyphens: narrow ? "auto" : "manual",
      overflowWrap: "break-word", maxWidth: "65ch",
      display: "flex", flexDirection: "column", gap: "12px",
    }}>
      {visibleParagraphs.map((para, i) => (
        <p key={i} style={{ margin: 0 }}>
          {para}
          {isTyping && i === visibleParagraphs.length - 1 && (
            <span style={{
              display: "inline-block", width: "2px", height: "18px",
              background: "#999", marginLeft: "2px",
              verticalAlign: "text-bottom", animation: "pulse 1s infinite",
            }} />
          )}
        </p>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────
   Story Entry (minimal)
   ──────────────────────────────────────────── */

function StoryLine({ entry, onHover, onLeave, narrow, onShowDialog, onPinPopover, hideIcon, isChapterStart }) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  return (
    <div
      ref={ref}
      onMouseEnter={() => {
        setHovered(true);
        if (!narrow) onHover(entry);
      }}
      onMouseLeave={() => {
        setHovered(false);
        if (!narrow) onLeave();
      }}
      style={{
        display: "grid",
        gridTemplateColumns: narrow ? "1fr" : "1fr 16px",
        gap: "12px",
        marginRight: narrow ? 0 : "-36px",
      }}
    >
      <div style={{
        fontFamily: "'Faustina', serif", fontSize: "19px", fontWeight: 300, lineHeight: 1.8,
        color: "#e8ddd0", margin: 0,
        textRendering: "optimizeLegibility", fontOpticalSizing: "auto",
        fontFeatureSettings: '"kern", "liga", "calt"',
        hangingPunctuation: "first last",
        textWrap: narrow ? "auto" : "pretty",
        hyphens: narrow ? "auto" : "manual",
        overflowWrap: "break-word", maxWidth: "65ch",
        display: "flex", flexDirection: "column", gap: "12px",
      }}>
        {splitIntoParagraphs(entry.text).map((para, i) => (
          <p key={i} className={isChapterStart && i === 0 ? "drop-cap" : undefined} style={{ margin: 0 }}>{para.charAt(0).toUpperCase() + para.slice(1)}</p>
        ))}
      </div>
      {!narrow && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "8px" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPinPopover(entry);
            }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "2px",
              color: "rgba(255,255,255,0.2)",
              transition: "opacity 0.15s, color 0.15s",
              opacity: hideIcon ? 0 : (hovered ? 1 : 0),
              pointerEvents: hideIcon ? "none" : (hovered ? "auto" : "none"),
              position: "sticky", top: "24px",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}
          >
            <GoInfo size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function StoryPopover({ entry, onClose }) {
  if (!entry) return null;
  return (
    <div style={{
      zIndex: 10,
      background: "#1a1917",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "6px",
      padding: "14px 16px",
      fontFamily: MONO,
      fontSize: "12px", color: "rgba(255,255,255,0.4)",
      lineHeight: 1.6,
      width: "280px",
      display: "flex", flexDirection: "column", gap: "8px",
      position: "relative",
    }}>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "8px", right: "8px",
            background: "none", border: "none",
            cursor: "pointer", color: "rgba(255,255,255,0.25)",
            fontSize: "14px", lineHeight: 1, padding: "2px",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.25)"}
        >
          &times;
        </button>
      )}
      {entry.location && (
        <div>
          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Location</div>
          <div style={{ color: "rgba(255,255,255,0.5)" }}>{entry.location}</div>
        </div>
      )}
      {entry.time && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date</div>
          <div style={{ color: "rgba(255,255,255,0.5)" }}>{entry.time}</div>
        </div>
      )}
      {entry.prompt && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Prompt</div>
          <div style={{ color: "rgba(255,255,255,0.5)" }}>{entry.prompt}</div>
        </div>
      )}
      {entry.originalAnswer && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Answer</div>
          <div style={{ color: "rgba(255,255,255,0.5)" }}>{entry.originalAnswer}</div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Home Screen — Grid of Books
   ──────────────────────────────────────────── */

function StoryRow({ title, stories, onSelectStory, isTouch }) {
  const scrollRef = useRef(null);

  return (
    <div style={{ marginBottom: isTouch ? "32px" : "40px" }}>
      <h2 style={{
        fontFamily: MONO, fontSize: "12px", fontWeight: 400,
        color: "rgba(255,255,255,0.4)", letterSpacing: "0.5px",
        textTransform: "uppercase", margin: "0 0 12px",
        padding: "0 32px",
      }}>
        {title}
      </h2>
      <div style={{ position: "relative", overflow: "clip visible" }}>
        <div style={{
          position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
          pointerEvents: "none", zIndex: 1,
          background: "linear-gradient(to right, #0e0d0b 0%, transparent 32px, transparent calc(100% - 32px), #0e0d0b 100%)",
        }} />
        <div
          ref={scrollRef}
          className="story-hscroll"
          style={{
            display: "flex", gap: "20px",
            overflowX: "auto", WebkitOverflowScrolling: "touch",
            padding: "30px 32px",
            scrollbarWidth: "none", msOverflowStyle: "none",
            perspective: isTouch ? "none" : "800px",
          }}
        >
          {stories.map((s) => (
            <div
              key={s.id}
              onClick={(e) => {
                e.currentTarget.style.transform = "scale(1.08)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.35)";
                setTimeout(() => onSelectStory(s.id), 150);
              }}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "4px",
                padding: "20px 16px",
                cursor: "pointer",
                width: "150px", minWidth: "150px",
                aspectRatio: "2 / 3",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                transition: "transform 0.2s ease-out, border-color 0.15s, box-shadow 0.15s",
                transformStyle: isTouch ? "flat" : "preserve-3d",
              }}
              {...(!isTouch ? {
                onMouseMove: (e) => {
                  if (e.buttons) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / rect.width - 0.5;
                  const y = (e.clientY - rect.top) / rect.height - 0.5;
                  e.currentTarget.style.transform = `scale(1.08) rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
                  e.currentTarget.style.boxShadow = `${-x * 14}px ${y * 14}px 25px rgba(0,0,0,0.35)`;
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                },
                onMouseDown: (e) => {
                  e.currentTarget.style.transform = "scale(0.95)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
                },
                onMouseUp: (e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.transform = "scale(1) rotateY(0deg) rotateX(0deg)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                },
              } : {})}
            >
              <div style={{
                fontFamily: SERIF, fontSize: "16px", fontWeight: 600,
                color: "#e8ddd0", lineHeight: 1.3,
              }}>
                {s.title || "Untitled"}
              </div>
              <span style={{
                fontFamily: MONO, fontSize: "10px",
                color: "rgba(255,255,255,0.2)",
              }}>
                {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ stories, onSelectStory, onNewStory, onAbout }) {
  const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const [homeLayout, setHomeLayout] = useState("rows"); // "rows" | "carousel" | "activity"
  const carouselRef = useRef(null);
  const [carouselFilter, setCarouselFilter] = useState("all");
  const [wideEnough, setWideEnough] = useState(() => typeof window !== "undefined" && window.innerWidth >= 900);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const handler = (e) => setWideEnough(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  const [activityFeed, setActivityFeed] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const sorted = [...stories].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));

  // Load activity feed when switching to activity tab
  useEffect(() => {
    if (homeLayout !== "activity" || stories.length === 0) return;
    let cancelled = false;
    setActivityLoading(true);
    (async () => {
      const entries = [];
      for (const s of stories) {
        try {
          const result = await window.storage.get(storyKey(s.id, "data-v1"), true);
          if (result) {
            const data = JSON.parse(result.value);
            data.forEach((entry, idx) => {
              entries.push({
                ...entry,
                storyId: s.id,
                storyTitle: s.title || "Untitled",
                storyGenre: s.genre,
                passageIndex: idx,
              });
            });
          }
        } catch { /* skip */ }
      }
      entries.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      if (!cancelled) {
        setActivityFeed(entries);
        setActivityLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [homeLayout, stories]);

  // Carousel: center on load + infinite scroll loop for "all" filter
  useEffect(() => {
    if (homeLayout !== "carousel" || carouselFilter !== "all") return;
    const el = carouselRef.current;
    if (!el) return;
    const needsLoop = sorted.length > 2;
    if (!needsLoop) return;
    // Center on the first card of the middle copy
    requestAnimationFrame(() => {
      const firstCard = el.children[sorted.length];
      if (firstCard) {
        el.scrollLeft = firstCard.offsetLeft - (el.clientWidth - firstCard.offsetWidth) / 2;
      } else {
        el.scrollLeft = el.scrollWidth / 3;
      }
    });
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const oneSetWidth = el.scrollWidth / 3;
        if (el.scrollLeft >= oneSetWidth * 2 - 1) {
          el.scrollLeft -= oneSetWidth;
        } else if (el.scrollLeft <= 1) {
          el.scrollLeft += oneSetWidth;
        }
        ticking = false;
      });
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [homeLayout, carouselFilter, sorted.length]);

  // Carousel: mobile center-scale effect
  const updateCenterScale = useCallback(() => {
    const el = carouselRef.current;
    if (!el || !isTouch) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    for (const child of el.children) {
      const cardCenter = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(center - cardCenter);
      const maxDist = el.clientWidth / 2;
      const t = Math.min(dist / maxDist, 1);
      const scale = 1.12 - t * 0.12;
      const opacity = 1 - t * 0.4;
      child.style.transform = `scale(${scale})`;
      child.style.opacity = opacity;
    }
  }, [isTouch]);

  useEffect(() => {
    if (homeLayout !== "carousel" || !isTouch) return;
    const el = carouselRef.current;
    if (!el) return;
    requestAnimationFrame(updateCenterScale);
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateCenterScale();
        ticking = false;
      });
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [homeLayout, isTouch, carouselFilter, updateCenterScale]);

  // Group stories by genre, only show genres that have stories
  const genreRows = GENRES
    .map((g) => ({ genre: g, stories: sorted.filter((s) => s.genre === g.id) }))
    .filter((r) => r.stories.length > 0);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      minHeight: "100vh", padding: isTouch ? "60px 0 24px" : "80px 0 40px",
      maxWidth: "1200px", margin: "0 auto", width: "100%",
      ...(isTouch ? { overflow: "auto" } : {}),
    }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 10,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: isTouch ? "16px 20px" : "20px 32px",
        maxWidth: "1200px", margin: "0 auto",
        background: "linear-gradient(to bottom, #0e0d0b 60%, transparent)",
        paddingBottom: isTouch ? "32px" : "40px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
          <h1 style={{
            fontFamily: TYPEWRITER, fontSize: isTouch ? "18px" : "20px", fontWeight: 400,
            color: "#e8ddd0", margin: 0, flexShrink: 0,
          }}>
            Falcor
          </h1>
          {homeLayout === "carousel" && wideEnough && (
            <div className="story-hscroll" style={{ display: "flex", gap: "6px", marginLeft: "12px", overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {[{ id: "all", label: "All" }, ...GENRES].map((g) => {
                const active = carouselFilter === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setCarouselFilter(g.id)}
                    style={{
                      fontFamily: MONO, fontSize: "10px", textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      padding: "4px 12px", borderRadius: "20px",
                      border: active ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.1)",
                      background: active ? "rgba(255,255,255,0.08)" : "transparent",
                      color: active ? "#e8ddd0" : "rgba(255,255,255,0.3)",
                      cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                      transition: "all 0.15s",
                    }}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: "2px", background: "rgba(255,255,255,0.05)", borderRadius: "20px", padding: "2px" }}>
            {[{ id: "rows", icon: TbLayoutListFilled, iconOff: TbLayoutList }, { id: "carousel", icon: MdOutlineViewCarousel, iconOff: MdOutlineViewCarousel }, { id: "activity", icon: GoPulse, iconOff: GoPulse }].map((tab) => {
              const active = homeLayout === tab.id;
              const Icon = active ? tab.icon : tab.iconOff;
              return (
              <button
                key={tab.id}
                onClick={() => setHomeLayout(tab.id)}
                style={{
                  background: active ? "rgba(255,255,255,0.12)" : "transparent",
                  border: "none", borderRadius: "18px",
                  padding: "6px 10px",
                  color: active ? "#e8ddd0" : "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                <Icon size={14} />
              </button>
              );
            })}
          </div>
          <button
            onClick={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)";
              setTimeout(() => onNewStory(), 150);
            }}
            style={{
              padding: isTouch ? "6px 16px" : "8px 20px", borderRadius: "28px",
              background: "#e8ddd0", border: "none", color: "#0e0d0b",
              cursor: "pointer",
              boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
              display: "flex", alignItems: "center", gap: "8px",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.4)"; }}
          >
            <span style={{ fontSize: isTouch ? "14px" : "16px", lineHeight: 1 }}>+</span>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {homeLayout === "rows" && genreRows.map((r) => (
          <StoryRow
            key={r.genre.id}
            title={r.genre.label}
            stories={r.stories}
            onSelectStory={onSelectStory}
            isTouch={isTouch}
          />
        ))}

        {homeLayout === "carousel" && (() => {
          const carouselBase = carouselFilter === "all"
            ? sorted
            : sorted.filter((s) => s.genre === carouselFilter);
          const needsLoop = carouselFilter === "all" && carouselBase.length > 2;
          const carouselStories = needsLoop
            ? [...carouselBase, ...carouselBase, ...carouselBase]
            : carouselBase;
          return (
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {!wideEnough && (
              <div style={{ position: "relative", marginBottom: "16px" }}>
                <div style={{
                  position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
                  pointerEvents: "none", zIndex: 1,
                  background: "linear-gradient(to right, #0e0d0b 0%, transparent 24px, transparent calc(100% - 24px), #0e0d0b 100%)",
                }} />
              <div className="story-hscroll" style={{
                display: "flex", gap: "8px",
                overflowX: "auto", WebkitOverflowScrolling: "touch",
                padding: "0 24px",
                scrollbarWidth: "none", msOverflowStyle: "none",
              }}>
                {[{ id: "all", label: "All" }, ...GENRES].map((g) => {
                  const active = carouselFilter === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setCarouselFilter(g.id)}
                      style={{
                        fontFamily: MONO, fontSize: "11px", textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        padding: "6px 14px", borderRadius: "20px",
                        border: active ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.1)",
                        background: active ? "rgba(255,255,255,0.08)" : "transparent",
                        color: active ? "#e8ddd0" : "rgba(255,255,255,0.3)",
                        cursor: "pointer", flexShrink: 0,
                        transition: "all 0.15s",
                      }}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
              </div>
              )}
              <div style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{
                  position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
                  pointerEvents: "none", zIndex: 1,
                  background: "linear-gradient(to right, #0e0d0b 0%, transparent 48px, transparent calc(100% - 48px), #0e0d0b 100%)",
                }} />
                <div
                  ref={carouselRef}
                  className="story-hscroll"
                  style={{
                    display: "flex", gap: isTouch ? "24px" : "20px",
                    overflowX: "auto", WebkitOverflowScrolling: "touch",
                    padding: isTouch ? "20px calc(50% - 100px)" : "30px 32px",
                    scrollbarWidth: "none", msOverflowStyle: "none",
                    perspective: isTouch ? "none" : "800px",
                    width: "100%",
                    ...(!needsLoop && !isTouch ? { justifyContent: "center" } : {}),
                    ...(isTouch ? { scrollSnapType: "x mandatory" } : {}),
                  }}
                >
                  {carouselStories.map((s, i) => {
                    const genre = GENRES.find((g) => g.id === s.genre);
                    return (
                      <div
                        key={`${s.id}-${i}`}
                        onClick={(e) => {
                          e.currentTarget.style.transform = "scale(1.08)";
                          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.35)";
                          setTimeout(() => onSelectStory(s.id), 150);
                        }}
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "4px",
                          padding: "24px 20px",
                          cursor: "pointer",
                          width: "200px", minWidth: "200px",
                          aspectRatio: "2 / 3",
                          display: "flex", flexDirection: "column", justifyContent: "space-between",
                          transition: "transform 0.2s ease-out, opacity 0.2s ease-out, border-color 0.15s, box-shadow 0.15s",
                          transformStyle: isTouch ? "flat" : "preserve-3d",
                          willChange: isTouch ? "transform" : "auto",
                          ...(isTouch ? { scrollSnapAlign: "center" } : {}),
                        }}
                        {...(!isTouch ? {
                          onMouseMove: (e) => {
                            if (e.buttons) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = (e.clientX - rect.left) / rect.width - 0.5;
                            const y = (e.clientY - rect.top) / rect.height - 0.5;
                            e.currentTarget.style.transform = `scale(1.08) rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
                            e.currentTarget.style.boxShadow = `${-x * 14}px ${y * 14}px 25px rgba(0,0,0,0.35)`;
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                          },
                          onMouseDown: (e) => {
                            e.currentTarget.style.transform = "scale(0.95)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
                          },
                          onMouseUp: (e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "none";
                          },
                          onMouseLeave: (e) => {
                            e.currentTarget.style.transform = "scale(1) rotateY(0deg) rotateX(0deg)";
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                          },
                        } : {})}
                      >
                        <div>
                          {genre && (
                            <div style={{
                              fontFamily: MONO, fontSize: "11px",
                              color: "rgba(255,255,255,0.3)",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              marginBottom: "8px",
                            }}>
                              {genre.label}
                            </div>
                          )}
                          <div style={{
                            fontFamily: SERIF, fontSize: "20px", fontWeight: 600,
                            color: "#e8ddd0", lineHeight: 1.3,
                          }}>
                            {s.title || "Untitled"}
                          </div>
                        </div>
                        <span style={{
                          fontFamily: MONO, fontSize: "11px",
                          color: "rgba(255,255,255,0.2)",
                        }}>
                          {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {homeLayout === "activity" && (
          <div style={{ maxWidth: "600px", margin: "0 auto", padding: isTouch ? "0 20px" : "0 24px", width: "100%" }}>
            {activityLoading ? (
              <p style={{ fontFamily: MONO, fontSize: "12px", color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                Loading activity...
              </p>
            ) : activityFeed.length === 0 ? (
              <p style={{ fontFamily: MONO, fontSize: "12px", color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                No activity yet
              </p>
            ) : (
              (() => {
                // Group consecutive entries by story
                const groups = [];
                for (const entry of activityFeed) {
                  const last = groups[groups.length - 1];
                  if (last && last.storyId === entry.storyId) {
                    last.entries.push(entry);
                  } else {
                    groups.push({ storyId: entry.storyId, storyTitle: entry.storyTitle, entries: [entry] });
                  }
                }
                return groups.map((group, gi) => (
                  <div
                    key={`${group.storyId}-${gi}`}
                    onClick={() => onSelectStory(group.storyId)}
                    style={{
                      padding: "20px 16px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ marginBottom: "12px" }}>
                      <span style={{
                        fontFamily: SERIF, fontSize: "18px", fontWeight: 600,
                        color: "#e8ddd0",
                      }}>
                        {group.storyTitle}
                      </span>
                    </div>
                    {group.entries.map((entry, ei) => (
                      <div key={`${entry.passageIndex}-${ei}`} style={{ marginBottom: ei < group.entries.length - 1 ? "16px" : 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                          <span style={{ fontFamily: MONO, fontSize: "12px", color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>
                            {entry.ts ? new Date(entry.ts).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : entry.time || ""}
                          </span>
                          {entry.location && (
                            <span style={{
                              fontFamily: MONO, fontSize: "12px", color: "rgba(255,255,255,0.2)",
                              display: "flex", alignItems: "center", gap: "4px",
                            }}>
                              <GoLocation size={11} />
                              {entry.location}
                            </span>
                          )}
                        </div>
                        {entry.prompt && (
                          <p style={{
                            fontFamily: TYPEWRITER, fontSize: "15px", lineHeight: 1.5,
                            color: "rgba(255,255,255,0.4)", margin: "0 0 4px",
                          }}>
                            {entry.prompt}
                          </p>
                        )}
                        {entry.originalAnswer && (
                          <p style={{
                            fontFamily: TYPEWRITER, fontSize: "16px", lineHeight: 1.6,
                            color: "rgba(255,255,255,0.7)", margin: 0,
                          }}>
                            {entry.originalAnswer}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ));
              })()
            )}
          </div>
        )}
      </div>

      <footer style={{
        padding: isTouch ? "12px 24px 24px" : "24px 24px 0",
        display: "flex", flexDirection: isTouch ? "column" : "row", alignItems: "center", justifyContent: "center", gap: isTouch ? "8px" : "16px",
        fontFamily: MONO, fontSize: "11px",
        color: "rgba(255,255,255,0.2)",
      }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span>
            Built by{" "}
            <a
              href="https://gabrielvaldivia.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
            >
              Gabriel Valdivia
            </a>
          </span>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onAbout(); }}
            style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
          >
            About
          </a>
        </div>
        {!isTouch && <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>}
        <span>&copy; Copyright {new Date().getFullYear()}</span>
      </footer>

    </div>
  );
}

/* ────────────────────────────────────────────
   About Screen
   ──────────────────────────────────────────── */

function AboutScreen({ onBack, narrow }) {
  return (
    <>
      {narrow ? (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          zIndex: 10,
          background: "linear-gradient(to bottom, #181714 60%, transparent)",
          padding: "16px 24px",
          display: "flex", alignItems: "center",
        }}>
          <button
            onClick={onBack}
            style={{
              background: "none", border: "none",
              color: "rgba(255,255,255,0.4)", cursor: "pointer",
              padding: 0, display: "flex", alignItems: "center",
            }}
          >
            <GoArrowLeft size={16} />
          </button>
          <span style={{
            fontFamily: MONO, fontSize: "12px",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.5px", textTransform: "uppercase",
            flex: 1, textAlign: "center",
            marginRight: "16px",
          }}>
            About
          </span>
        </div>
      ) : (
        <div style={{
          position: "fixed", left: "24px", top: "24px",
          zIndex: 5,
        }}>
          <button
            onClick={onBack}
            style={{
              background: "none", border: "none",
              fontFamily: MONO, fontSize: "12px",
              color: "rgba(255,255,255,0.3)", cursor: "pointer",
              padding: 0, textAlign: "left",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
          >
            <GoArrowLeft size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />Back
          </button>
        </div>
      )}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: narrow ? "56px 24px 40px" : "60px 24px 40px" }}>
        <pre className="about-ascii" style={{
          fontFamily: "'Courier New', monospace", fontSize: "9px", lineHeight: 1.0,
          color: "rgba(255,255,255,0.6)", marginBottom: "32px",
          overflow: "hidden", whiteSpace: "pre", letterSpacing: "0px",
        }}>{`@:--:---------------------------------------------------------------------------------------------:@
@::::::::::::::%@@+::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@:::::::::::::++*=:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@::::::::::::*-::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@:::::::::::@=-::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@::::::::::%*#-::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@:::::::::=-++:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@:::::::::::%@=:::-====+-::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@:::::::::::-@@-:-+--=:.:%@-:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@::::::::::::-%@+:.....=@@@=:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@::::::::::::::-::...-:+%@@+::::::::::-----------::::::::::::::::::-=-----*@%=:::::::::::::::::::::@
@::::::::::::.::+-..::--*=*-:-::::---=%@@@@@@@%=-------------::::----%@@@@@@@@%-:::::::::::::::::::@
@:::::::::::==*#%#@@=---**-------=%@@@@@@@@@@@@@@@*=---------=*=-+%@@@@@@@@@@@@=-::::::::::::::::::@
@::::::::::-@=*%#@@@@@=+@*=#@@@@@@@@@@@@@@@@@@@@@@@@@@#+---=@@@@@@@@@@@@@@@@@@@@@#-::::::::::::::::@
@::::::::::%*%-+@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#@#=#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@=-::::::::::::::@
@:::::::::-+=:*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%@@*::::::::::::::@
@:::::::::=@-*#%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%*+==:::::=:-+%#::::::::::::::@
@:::::::==**@#%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#%*:....=-..::::-:=+::::::::::::::@
@::::::-*++@#*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%*+-+-..:..=#=::::::--:::::::::::::::@
@::::-%-=@@@###@@@%%@%#*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@=..:=+#@@@@@@@@#=:+%-::::::::::::::::@
@::::-%#@@@@@%-=+%##%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*=:.:::+@@@@@@@@@@@@@*-:::::::::::::::::@
@:=++*=..:+@@+@@@@*@@@@@@@@@@@@@@@%##*%@@@@@@@@@@@@@@@@@%=:....#@##@@###*#%%%@@@@@+-:::::::::::::::@
@%@@@@#==##@@@@@@@%@%@@@@@@@@@@@*=-=++++-=%@@@@@@@@@@@@*....:-=++=++---::--=+++*#%%-:::::::::::::::@
@@@@@@@*=-+++*@@%%@@@@@#+%@@####+--*++*++=-----::::--::...::----::-:::..:::::::====::::::::::::::::@
@@@@@@@@--+++=#@@@%@@@#+++=@@@@@%%=:::::---=-::.......:::::::::::::......:.::::---:::::::::::::::::@
@@@@@@@#=::..:@@@***###%%**@@@%*-..-=-===-:...::....::::::.:...::.::::::::::--:::::::::::::::::::::@
@@@@#+:......#@@@@@@@@*-....-+-::::::::::...::.....:......:::::::::::::::::::::::::::::::::::::::::@
@##+:......:@@@@@%@@@#:.....:::.........::::-.............:::::::----::::::::::::::::::::::::::::::@
@+-:......=@@@@@@@@@@%:.......::==:..:-:..::.......:...:::::---::::::::::::::::::::::::::::::::::::@
@=:......#@@@@@@@%#%*:.......-++---:........::::::::::::---::::::::::::::::::::::::::::::::::::::::@
@:.....:@@@@@#==+=:.........---::........::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@:...:#@@@@:..:-:..........:--:..........:::::::...:-::::::::::::::::::::::::::::::::::::::::::::::@
@-..:#@@@@%...............:---::..................:::::::::::::::::::::::::::::::::::::::::::::::::@
@:..-@@@@@:...............-++=+=:................:-::::::::::::::::::::::::::::::::::::::::::::::::@
@..:@@@=.................:====-:...............::+-::::::::::::::::::::::::::::::::::::::::::::::::@
@.:#@=..................:==-:::::.............::-::::::::::::::::::::::::::::::::::::::::::::::::::@
@.:#*:.............:::::-++-:::::::.......:--::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@.=@@:........::::::::::=-==::::::::::::-::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@#%*-::::::::::-::::::::-+=-:::::-:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@==::::::::::::::::::::::-:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::@
@--------------------------------------------------------------------------------------------------@`}</pre>
        <h1 style={{
          fontFamily: SERIF, fontSize: "28px", fontWeight: 600,
          color: "#e8ddd0", marginBottom: "32px",
        }}>
          About Falcor
        </h1>

        <div style={{
          fontFamily: "'Faustina', serif", fontSize: "17px", fontWeight: 300,
          lineHeight: 1.8, color: "rgba(255,255,255,0.6)",
          display: "flex", flexDirection: "column", gap: "20px",
        }}>
          <p>
            Falcor is an experiment in co-creative storytelling. Anyone can
            contribute to a shared story. You answer a simple question about
            what should happen next, and AI turns it into prose. The result
            is a living artifact shaped by strangers.
          </p>
          <h2 style={{
            fontFamily: MONO, fontSize: "12px", fontWeight: 400,
            color: "rgba(255,255,255,0.3)", letterSpacing: "0.5px",
            textTransform: "uppercase", marginTop: "8px",
          }}>
            Why this exists
          </h2>
          <p>
            Writing is hard. But answering "what should happen next?" is
            easy. This lowers the barrier to entry by turning storytelling 
            into a back-and-forth, where your direction sets the path 
            and AI carries it forward. This feels like a new kind of media 
            experience. It isn't writing per se, 
            but it is shaped by human input.
          </ p>

          <p>
            All stories are shared and open. You can see what
            each person wrote and where in the world they wrote it from.
            When strangers from different places contribute
            to a shared output, the world feels a little smaller.
          </p>
          <h2 style={{
            fontFamily: MONO, fontSize: "12px", fontWeight: 400,
            color: "rgba(255,255,255,0.3)", letterSpacing: "0.5px",
            textTransform: "uppercase", marginTop: "8px",
          }}>
            How it works
          </h2>
          <p>
            Start by choosing a genre. Each genre unlocks its own curated set
            of writing voices, themes, protagonist types, and narrative tensions,
            all tailored to fit the kind of story you want to tell.
          </p>
          <p>
            Falcor generates a title and opening passage, then asks you
            questions about what happens next. Your brief answers become the
            seeds for each new passage. The AI considers everything that came
            before, building on earlier choices, tracking narrative arcs,
            deciding when chapters should end, and generating chapter titles.
          </p>
          <p>
            Stories are stored in the cloud and can be shared with a direct
            link using the menu on any story page. Anyone with the link can
            read along and contribute to the story.
          </p>
          <h2 style={{
            fontFamily: MONO, fontSize: "12px", fontWeight: 400,
            color: "rgba(255,255,255,0.3)", letterSpacing: "0.5px",
            textTransform: "uppercase", marginTop: "8px",
          }}>
            Credits
          </h2>
          <p>
            Built by{" "}
            <a
              href="https://gabrielvaldivia.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#e8ddd0", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.15)" }}
              onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.4)"}
              onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.15)"}
            >
              Gabriel Valdivia
            </a>
            . Powered by{" "}
            <a
              href="https://claude.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#e8ddd0", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.15)" }}
              onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.4)"}
              onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.15)"}
            >
              Claude
            </a>.
          </p>
        </div>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────
   New Story Screen — Genre + Voice Selection
   ──────────────────────────────────────────── */

function NewStoryScreen({ onCancel, onCreate, narrow }) {
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [selectedProtagonist, setSelectedProtagonist] = useState(null);
  const [selectedTension, setSelectedTension] = useState(null);
  const [activeStep, setActiveStep] = useState("genre");
  const [creating, setCreating] = useState(false);

  const toggleTheme = (id) => {
    setSelectedThemes((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= 2) return prev;
      const next = [...prev, id];
      setTimeout(() => advanceFrom("themes"), 150);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!selectedGenre || !selectedVoice || creating) return;
    setCreating(true);
    const id = Date.now();
    const meta = {
      id,
      title: "",
      genre: selectedGenre,
      writingStyle: selectedVoice,
      themes: selectedThemes.length > 0 ? selectedThemes : [],
      protagonist: selectedProtagonist || null,
      tension: selectedTension || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      passageCount: 0,
    };
    await onCreate(meta);
  };

  const steps = [
    { key: "genre", label: "Genre", optional: false },
    { key: "voice", label: "Writing Voice", optional: false },
    { key: "themes", label: "Themes", optional: true },
    { key: "protagonist", label: "Protagonist", optional: true },
    { key: "tension", label: "Narrative Tension", optional: true },
  ];

  const getStepAnswer = (key) => {
    switch (key) {
      case "genre": {
        const g = GENRES.find((x) => x.id === selectedGenre);
        return g ? g.label : null;
      }
      case "voice": {
        const v = ALL_VOICES.find((x) => x.id === selectedVoice);
        return v ? v.label : null;
      }
      case "themes": {
        if (selectedThemes.length === 0) return null;
        return selectedThemes.map((id) => ALL_THEMES.find((t) => t.id === id)?.label).filter(Boolean).join(", ");
      }
      case "protagonist": {
        const p = ALL_PROTAGONISTS.find((x) => x.id === selectedProtagonist);
        return p ? p.label : null;
      }
      case "tension": {
        const t = ALL_TENSIONS.find((x) => x.id === selectedTension);
        return t ? t.label : null;
      }
      default: return null;
    }
  };

  const isStepVisible = (key) => {
    const order = steps.map((s) => s.key);
    const idx = order.indexOf(key);
    if (idx === 0) return true;
    // Show step if all previous required steps are answered
    for (let i = 0; i < idx; i++) {
      const prev = steps[i];
      if (!prev.optional && !getStepAnswer(prev.key)) return false;
    }
    // Also show if previous step was answered or skipped (activeStep moved past it)
    const activeIdx = order.indexOf(activeStep);
    return activeIdx >= idx || getStepAnswer(order[idx - 1]) !== null || steps[idx - 1].optional;
  };

  const advanceFrom = (key) => {
    const order = steps.map((s) => s.key);
    const idx = order.indexOf(key);
    if (idx < order.length - 1) {
      setActiveStep(order[idx + 1]);
    }
  };

  const handleSelectGenre = (id) => {
    setSelectedGenre(id);
    setSelectedVoice(null);
    setSelectedThemes([]);
    setSelectedProtagonist(null);
    setSelectedTension(null);
    setTimeout(() => advanceFrom("genre"), 150);
  };

  const handleSelectVoice = (id) => {
    setSelectedVoice(id);
    setTimeout(() => advanceFrom("voice"), 150);
  };

  const canCreate = selectedGenre && selectedVoice;

  const renderCollapsedRow = (step, disabled = false) => {
    const answer = getStepAnswer(step.key);
    return (
      <button
        onClick={disabled ? undefined : () => setActiveStep(step.key)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          width: "100%", background: "none", border: "none",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 0",
          lineHeight: "normal",
          font: "inherit",
          cursor: disabled ? "default" : "pointer",
          transition: "all 0.15s",
          opacity: disabled ? 0.3 : 1,
        }}
        onMouseEnter={disabled ? undefined : (e) => e.currentTarget.querySelector("[data-answer]").style.color = "#e8ddd0"}
        onMouseLeave={disabled ? undefined : (e) => e.currentTarget.querySelector("[data-answer]").style.color = "rgba(255,255,255,0.5)"}
      >
        <span style={{
          fontFamily: MONO, fontSize: "12px", fontWeight: 400,
          color: "rgba(255,255,255,0.4)", letterSpacing: "0.5px",
          textTransform: "uppercase",
        }}>
          {step.label}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span data-answer="" style={{
            fontFamily: SERIF, fontSize: "15px", fontWeight: 500,
            color: "rgba(255,255,255,0.5)",
            transition: "color 0.15s",
          }}>
            {answer || ""}
          </span>
          <GoPlus size={16} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
        </span>
      </button>
    );
  };

  const renderOptionGrid = (items, selectedId, onSelect, multi = false) => (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
      gap: "10px",
    }}>
      {items.map((item) => {
        const isSelected = multi ? selectedId.includes(item.id) : selectedId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              background: isSelected ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
              border: isSelected ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.06)",
              borderRadius: "6px",
              padding: "14px 16px",
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                e.currentTarget.querySelector("[data-label]").style.color = "#e8ddd0";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.querySelector("[data-label]").style.color = "rgba(255,255,255,0.5)";
              }
            }}
          >
            <div data-label="" style={{
              fontFamily: TYPEWRITER, fontSize: "15px", fontWeight: 400,
              color: isSelected ? "#e8ddd0" : "rgba(255,255,255,0.5)",
              transition: "color 0.15s",
            }}>
              {item.label}
            </div>
          </button>
        );
      })}
    </div>
  );

  const collapseStep = (stepKey) => {
    const order = steps.map((s) => s.key);
    const idx = order.indexOf(stepKey);
    // Find the next step that doesn't have an answer yet
    for (let i = idx + 1; i < order.length; i++) {
      if (!getStepAnswer(order[i])) { setActiveStep(order[i]); return; }
    }
    setActiveStep(null);
  };

  const renderExpandedStep = (step) => {
    const isOptional = step.optional;
    return (
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", marginBottom: "0" }}>
          <h2 style={{
            fontFamily: MONO, fontSize: "12px", fontWeight: 400,
            color: "rgba(255,255,255,0.4)", letterSpacing: "0.5px",
            textTransform: "uppercase", margin: 0,
          }}>
            {step.label}{isOptional && <span style={{ textTransform: "none", color: "rgba(255,255,255,0.2)" }}> (optional{step.key === "themes" ? ", up to 2" : ""})</span>}
          </h2>
          <button
            onClick={() => collapseStep(step.key)}
            style={{
              background: "none", border: "none",
              cursor: "pointer", padding: "2px",
              color: "rgba(255,255,255,0.25)",
              transition: "color 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.25)"}
          >
            <GoDash size={16} />
          </button>
        </div>
        {step.key === "genre" && renderOptionGrid(GENRES, selectedGenre, handleSelectGenre)}
        {step.key === "voice" && renderOptionGrid(getVoicesForGenre(selectedGenre), selectedVoice, handleSelectVoice)}
        {step.key === "themes" && renderOptionGrid(getThemesForGenre(selectedGenre), selectedThemes, toggleTheme, true)}
        {step.key === "protagonist" && (
          <>
            {renderOptionGrid(getProtagonistsForGenre(selectedGenre), selectedProtagonist, (id) => {
              setSelectedProtagonist(selectedProtagonist === id ? null : id);
              if (selectedProtagonist !== id) setTimeout(() => advanceFrom("protagonist"), 150);
            })}
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => advanceFrom("protagonist")}
                style={{
                  background: "none", border: "none",
                  fontFamily: MONO, fontSize: "12px",
                  color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
              >
                {selectedProtagonist ? "Continue" : "Skip"}
              </button>
            </div>
          </>
        )}
        {step.key === "tension" && renderOptionGrid(getTensionsForGenre(selectedGenre), selectedTension, (id) => {
          setSelectedTension(selectedTension === id ? null : id);
          if (selectedTension !== id) setTimeout(() => setActiveStep(null), 150);
        })}
      </div>
    );
  };

  return (
    <>
      {narrow ? (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          zIndex: 10,
          background: "linear-gradient(to bottom, #181714 60%, transparent)",
          padding: "16px 24px",
          display: "flex", alignItems: "center",
        }}>
          <button
            onClick={onCancel}
            style={{
              background: "none", border: "none",
              color: "rgba(255,255,255,0.4)", cursor: "pointer",
              padding: 0, display: "flex", alignItems: "center",
            }}
          >
            <GoArrowLeft size={16} />
          </button>
          <span style={{
            fontFamily: MONO, fontSize: "12px",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.5px", textTransform: "uppercase",
            flex: 1, textAlign: "center",
            marginRight: "16px",
          }}>
            New Story
          </span>
        </div>
      ) : (
        <div style={{
          position: "fixed", left: "24px", top: "24px",
          zIndex: 5,
        }}>
          <button
            onClick={onCancel}
            style={{
              background: "none", border: "none",
              fontFamily: MONO, fontSize: "12px",
              color: "rgba(255,255,255,0.3)", cursor: "pointer",
              padding: 0, textAlign: "left",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
          >
            <GoArrowLeft size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />Back
          </button>
        </div>
      )}
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: narrow ? "56px 24px 40px" : "60px 24px 40px" }}>

      {!narrow && (
        <h1 style={{
          fontFamily: SERIF, fontSize: "28px", fontWeight: 600,
          color: "#e8ddd0", textAlign: "center",
          marginBottom: "48px",
        }}>
          New Story
        </h1>
      )}

      {steps.map((step) => {
        const answer = getStepAnswer(step.key);
        const isActive = activeStep === step.key;
        const reachable = isStepVisible(step.key);
        const isCollapsed = !isActive && reachable;
        const isFuture = !isActive && !reachable && answer === null;

        if (isActive && reachable) {
          return <div key={step.key}>{renderExpandedStep(step)}</div>;
        }
        if (isCollapsed) {
          return <div key={step.key}>{renderCollapsedRow(step)}</div>;
        }
        if (isFuture) {
          return <div key={step.key}>{renderCollapsedRow(step, true)}</div>;
        }
        return null;
      })}

      {/* Start Story Button */}
      <button
        onClick={handleCreate}
        disabled={!canCreate || creating}
        style={{
          width: "100%",
          background: creating ? "rgba(255,255,255,0.04)" : canCreate ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
          border: "none",
          borderRadius: "6px",
          padding: "14px 16px",
          fontFamily: MONO, fontSize: "13px",
          color: creating ? "#999" : canCreate ? "#e8ddd0" : "rgba(255,255,255,0.15)",
          cursor: canCreate && !creating ? "pointer" : "default",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          transition: "all 0.15s",
          marginTop: "24px",
          animation: creating ? "pulse 1.5s ease-in-out infinite" : "none",
        }}
      >
        {creating ? "Creating..." : "Start Story"}
      </button>
    </div>
    </>
  );
}

/* ────────────────────────────────────────────
   Main App
   ──────────────────────────────────────────── */

const MONO = "'SF Pro Mono', 'SF Mono', 'Menlo', 'Courier New', monospace";
const TYPEWRITER = "'Courier New', 'Courier', monospace";
const SERIF = "'Faustina', serif";

export default function CollaborativeStoryApp() {
  // Navigation state
  const [view, setView] = useState(() => {
    if (window.location.hash === "#about") return "about";
    return window.location.hash.match(/^#story\//) ? "story" : "home";
  }); // "home" | "new" | "story" | "about"
  const [activeStoryId, setActiveStoryId] = useState(null);
  const [storiesIndex, setStoriesIndex] = useState([]);

  // Story state
  const [story, setStory] = useState([]);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState("input");
  const [generatedText, setGeneratedText] = useState("");
  const [generationSource, setGenerationSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [contributorCount, setContributorCount] = useState(0);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [chapterTitles, setChapterTitles] = useState({});
  const [error, setError] = useState(null);
  const [hoveredEntry, setHoveredEntry] = useState(null);

  const [narrowViewport, setNarrowViewport] = useState(false);
  const [visibleChapter, setVisibleChapter] = useState(1);
  const [dialogEntry, setDialogEntry] = useState(null);
  const [pinnedEntry, setPinnedEntry] = useState(null);
  const [showStoryMenu, setShowStoryMenu] = useState(false);
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [confirmDeleteMenu, setConfirmDeleteMenu] = useState(false);
  const [showSliders, setShowSliders] = useState(false);
  const [sliderLength, setSliderLength] = useState(4);
  const [sliderDialogue, setSliderDialogue] = useState(2);
  const [sliderSurprise, setSliderSurprise] = useState(3);
  const [sliderEmotion, setSliderEmotion] = useState(4);
  const [geoEnabled, setGeoEnabled] = useState(() => localStorage.getItem("falcor_geo_enabled") === "true");
  const [geoLabel, setGeoLabel] = useState("");
  const storyEndRef = useRef(null);
  const contentRef = useRef(null);
  const pollRef = useRef(null);

  // Active story metadata
  const activeStoryMeta = storiesIndex.find((s) => s.id === activeStoryId);

  const getGenreVoiceCtx = useCallback(() => {
    if (!activeStoryMeta) return "";
    return getStoryContext(activeStoryMeta);
  }, [activeStoryMeta]);

  const getActiveStyleSettings = useCallback(() => {
    const base = activeStoryMeta
      ? getStyleForStory(activeStoryMeta.genre, activeStoryMeta.writingStyle)
      : { tone: 5, length: 4, mood: 5, dialogue: 2 };
    return { ...base, length: sliderLength, dialogue: sliderDialogue, surprise: sliderSurprise, emotion: sliderEmotion };
  }, [activeStoryMeta, sliderLength, sliderDialogue, sliderSurprise, sliderEmotion]);

  // Resolve geo label on mount if enabled
  useEffect(() => {
    if (geoEnabled) {
      requestBrowserLocation().then((loc) => { if (loc) setGeoLabel(loc); });
    }
  }, []);

  // Load stories index on mount + check hash for deep link
  useEffect(() => {
    (async () => {
      const idx = await loadStoriesIndex();
      setStoriesIndex(idx);
      setLoading(false);

      const hash = window.location.hash;
      const slugMatch = hash.match(/^#story\/(.+)$/);
      if (slugMatch) {
        const slug = slugMatch[1];
        // Support legacy numeric IDs
        const numId = parseInt(slug, 10);
        const found = !isNaN(numId) && idx.some((s) => s.id === numId)
          ? idx.find((s) => s.id === numId)
          : findStoryBySlug(idx, slug);
        if (found) {
          openStory(found.id);
        }
      }
    })();
  }, []);

  // Load a specific story's data
  const loadStoryData = useCallback(async (id, isInitial) => {
    try {
      const storyResult = await window.storage.get(storyKey(id, "data-v1"), true);
      const countResult = await window.storage.get(storyKey(id, "count-v1"), true);
      const chapterResult = await window.storage.get(storyKey(id, "chapter-v1"), true);
      const titlesResult = await window.storage.get(storyKey(id, "titles-v1"), true);
      const loadedStory = storyResult ? JSON.parse(storyResult.value) : [];
      const loadedChapter = chapterResult ? parseInt(chapterResult.value, 10) : 1;
      const loadedTitles = titlesResult ? JSON.parse(titlesResult.value) : {};
      if (storyResult) setStory(loadedStory);
      if (countResult) setContributorCount(parseInt(countResult.value, 10));
      setCurrentChapter(loadedChapter);
      setChapterTitles(loadedTitles);

      if (isInitial) {
        // Load the active story meta for genre/voice context
        const idx = await loadStoriesIndex();
        const meta = idx.find((s) => s.id === id);
        const ctx = meta ? getStoryContext(meta) : "";

        // Backfill titles for completed chapters that don't have one
        const allChapters = [...new Set(loadedStory.map((e) => e.chapter || 1))];
        const completedWithoutTitle = allChapters.filter(
          (ch) => ch < loadedChapter && !loadedTitles[ch]
        );
        if (completedWithoutTitle.length > 0) {
          const backfilled = { ...loadedTitles };
          await Promise.all(completedWithoutTitle.map(async (ch) => {
            const title = await generateChapterTitle(loadedStory, ch);
            if (title) backfilled[ch] = title;
          }));
          setChapterTitles(backfilled);
          await window.storage.set(storyKey(id, "titles-v1"), JSON.stringify(backfilled), true);
        }
        const prompt = await generatePrompt(loadedStory, loadedChapter, false, ctx);
        setCurrentPrompt(prompt);
        await window.storage.set(storyKey(id, "prompt-v1"), prompt, true);
      }
    } catch (e) { /* first run */ }
  }, []);

  // Navigate to a story
  const openStory = useCallback(async (id) => {
    setActiveStoryId(id);
    setStory([]);
    setCurrentPrompt("");
    setAnswer("");
    setPhase("input");
    setGeneratedText("");
    setGenerationSource("");
    setContributorCount(0);
    setCurrentChapter(1);
    setChapterTitles({});
    setError(null);
    setShowStoryMenu(false);
    setLinkCopied(false);
    setConfirmDeleteMenu(false);
    setShowSliders(false);
    const meta = storiesIndex.find((s) => s.id === id);
    const defaults = meta
      ? getStyleForStory(meta.genre, meta.writingStyle)
      : { length: 4, dialogue: 2, surprise: 3, emotion: 4 };
    setSliderLength(defaults.length);
    setSliderDialogue(defaults.dialogue);
    setSliderSurprise(defaults.surprise ?? 3);
    setSliderEmotion(defaults.emotion ?? 4);
    // Clear any existing polling before starting new story
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setView("story");
    window.location.hash = "story/" + (meta?.slug || id);

    await loadStoryData(id, true);

    // Only start polling if we're still on this story
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadStoryData(id, false), 5000);
  }, [loadStoryData, storiesIndex]);

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = async () => {
      const hash = window.location.hash;
      if (hash === "#about") { setView("about"); return; }
      const slugMatch = hash.match(/^#story\/(.+)$/);
      if (slugMatch) {
        const slug = slugMatch[1];
        const numId = parseInt(slug, 10);
        // Use storiesIndex if available, otherwise load fresh
        const idx = storiesIndex.length > 0 ? storiesIndex : await loadStoriesIndex();
        const found = !isNaN(numId) && idx.some((s) => s.id === numId)
          ? idx.find((s) => s.id === numId)
          : findStoryBySlug(idx, slug);
        if (found) { openStory(found.id); return; }
      }
      if (pollRef.current) clearInterval(pollRef.current);
      window.scrollTo(0, 0);
      setView("home");
      setActiveStoryId(null);
      setShowStoryMenu(false);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [openStory, storiesIndex]);

  // Clean up polling when leaving story view
  useEffect(() => {
    if (view !== "story" && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [view]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Track which chapter is currently visible on scroll
  useEffect(() => {
    if (view !== "story") return;
    const onScroll = () => {
      const chapters = [...new Set(story.map((e) => e.chapter || 1))].sort((a, b) => a - b);
      let current = 0;
      for (const ch of chapters) {
        const el = document.getElementById(`chapter-${ch}`);
        if (el && el.getBoundingClientRect().top <= 80) current = ch;
      }
      setVisibleChapter(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [view, story]);

  // Check if popover fits to the right of content
  useEffect(() => {
    const check = () => {
      if (contentRef.current) {
        const right = contentRef.current.getBoundingClientRect().right;
        setNarrowViewport(right + 304 > window.innerWidth);
      } else {
        setNarrowViewport(window.innerWidth < 960);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [view]);

  const prevStoryLenRef = useRef(0);
  useEffect(() => {
    if (view === "story" && story.length > prevStoryLenRef.current && prevStoryLenRef.current > 0 && storyEndRef.current) {
      storyEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    prevStoryLenRef.current = story.length;
  }, [story, view]);

  const handleSubmit = async () => {
    if (!answer.trim() || phase !== "input") return;
    setPhase("generating");
    setError(null);

    const userAnswer = answer.trim();

    try {
      const result = await generateStoryPassage(
        story, currentPrompt, userAnswer,
        getActiveStyleSettings(), currentChapter, getGenreVoiceCtx()
      );
      setGeneratedText(result.text);
      setGenerationSource(result.source);
      setPhase("reveal");
    } catch (e) {
      console.error("All generation failed:", e);
      setError("Something went wrong. Please try again.");
      setPhase("input");
    }
  };

  const quickAddAnswerRef = useRef(null);

  const handleQuickAdd = async () => {
    if (!answer.trim() || phase !== "input") return;
    setPhase("generating");
    setError(null);
    const userAnswer = answer.trim();
    quickAddAnswerRef.current = userAnswer;
    try {
      const result = await generateStoryPassage(
        story, currentPrompt, userAnswer,
        getActiveStyleSettings(), currentChapter, getGenreVoiceCtx()
      );
      setGeneratedText(result.text);
      setGenerationSource(result.source);
      setPhase("streaming");
      // Scroll to bottom after a tick so the streaming entry is rendered
      setTimeout(() => storyEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      console.error("All generation failed:", e);
      setError("Something went wrong. Please try again.");
      setPhase("input");
    }
  };

  const handleStreamingComplete = useCallback(async () => {
    if (phase !== "streaming") return;
    setPhase("adding");
    await handleConfirmWith(generatedText, quickAddAnswerRef.current || answer.trim());
  }, [phase, generatedText, answer]);

  const handleConfirm = async () => {
    setPhase("adding");
    await handleConfirmWith(generatedText, answer.trim());
  };

  const handleConfirmWith = async (text, originalAnswer) => {
    const newCount = contributorCount + 1;
    const now = new Date();
    const timeStr = now.toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
    const location = await fetchLocation();

    const newEntry = {
      text: text,
      originalAnswer: originalAnswer,
      prompt: currentPrompt,
      author: newCount,
      location: location,
      time: timeStr,
      ts: Date.now(),
      chapter: currentChapter,
    };

    try {
      // Re-read fresh from storage to avoid overwriting concurrent contributions
      const freshResult = await window.storage.get(storyKey(activeStoryId, "data-v1"), true);
      const freshStory = freshResult ? JSON.parse(freshResult.value) : story;
      const updatedStory = [...freshStory, newEntry];
      let nextChapter = currentChapter;
      let isNewChapter = false;
      let updatedTitles = chapterTitles;
      const chapterEnded = await shouldEndChapter(updatedStory, currentChapter);
      if (chapterEnded) {
        nextChapter = currentChapter + 1;
        isNewChapter = true;
        const title = await generateChapterTitle(updatedStory, currentChapter);
        if (title) {
          updatedTitles = { ...chapterTitles, [currentChapter]: title };
          await window.storage.set(storyKey(activeStoryId, "titles-v1"), JSON.stringify(updatedTitles), true);
        }
      }

      const nextPrompt = await generatePrompt(updatedStory, nextChapter, isNewChapter, getGenreVoiceCtx());
      await window.storage.set(storyKey(activeStoryId, "data-v1"), JSON.stringify(updatedStory), true);
      await window.storage.set(storyKey(activeStoryId, "prompt-v1"), nextPrompt, true);
      await window.storage.set(storyKey(activeStoryId, "count-v1"), String(newCount), true);
      await window.storage.set(storyKey(activeStoryId, "chapter-v1"), String(nextChapter), true);

      // Update stories index metadata
      const existingMeta = storiesIndex.find((s) => s.id === activeStoryId);
      const derivedTitle = existingMeta?.title || updatedTitles[1] || (updatedStory[0] ? updatedStory[0].text.split(/[.!?]/)[0].slice(0, 50) : "");
      const updatedIndex = storiesIndex.map((s) =>
        s.id === activeStoryId
          ? { ...s, title: derivedTitle, passageCount: updatedStory.length, updatedAt: new Date().toISOString() }
          : s
      );
      await saveStoriesIndex(updatedIndex);
      setStoriesIndex(updatedIndex);

      setStory(updatedStory);
      setCurrentPrompt(nextPrompt);
      setContributorCount(newCount);
      setCurrentChapter(nextChapter);
      setChapterTitles(updatedTitles);
      setAnswer("");
      setGeneratedText("");
      setGenerationSource("");
      // Reset sliders to story defaults
      const defaults = activeStoryMeta
        ? getStyleForStory(activeStoryMeta.genre, activeStoryMeta.writingStyle)
        : { length: 4, dialogue: 2, surprise: 3, emotion: 4 };
      setSliderLength(defaults.length);
      setSliderDialogue(defaults.dialogue);
      setSliderSurprise(defaults.surprise ?? 3);
      setSliderEmotion(defaults.emotion ?? 4);
      setShowSliders(false);
      setPhase("input");
    } catch (e) {
      console.error("Storage error:", e);
      setError("Failed to save. Please try again.");
      setPhase("reveal");
    }
  };

  const handleRewrite = async () => {
    setPhase("generating");
    setError(null);
    try {
      const result = await generateStoryPassage(
        story, currentPrompt, answer.trim(),
        getActiveStyleSettings(), currentChapter, getGenreVoiceCtx()
      );
      setGeneratedText(result.text);
      setGenerationSource(result.source);
      setPhase("reveal");
    } catch (e) {
      setError("Rewrite failed.");
      setPhase("reveal");
    }
  };

  const handleReset = async () => {
    if (!activeStoryId) return;
    await deleteStoryData(activeStoryId);

    // Remove from index
    const updatedIndex = storiesIndex.filter((s) => s.id !== activeStoryId);
    await saveStoriesIndex(updatedIndex);
    setStoriesIndex(updatedIndex);

    // Go home
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setView("home");
    setActiveStoryId(null);
  };

  const handleDeleteStory = async (id) => {
    await deleteStoryData(id);

    const updatedIndex = storiesIndex.filter((s) => s.id !== id);
    await saveStoriesIndex(updatedIndex);
    setStoriesIndex(updatedIndex);
  };

  const handleCreateStory = async (meta) => {
    // Generate opener BEFORE saving to index — prevents zombie entries on failure
    const opener = await generateStoryOpener(meta);

    // Reset local state
    setActiveStoryId(meta.id);
    setStory([]);
    setCurrentPrompt("");
    setAnswer("");
    setGeneratedText("");
    setGenerationSource("");
    setContributorCount(0);
    setCurrentChapter(1);
    setChapterTitles({});
    setError(null);

    if (opener) {
      const now = new Date();
      const timeStr = now.toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      });
      const location = await fetchLocation();
      const firstEntry = {
        text: opener.paragraph,
        originalAnswer: "",
        prompt: "",
        author: 1,
        location,
        time: timeStr,
        ts: Date.now(),
        chapter: 1,
      };
      const newStory = [firstEntry];
      const slug = slugify(opener.title) || String(meta.id);
      const savedMeta = { ...meta, title: opener.title, slug, passageCount: 1, updatedAt: new Date().toISOString() };

      // Save everything at once — index + story data
      const updatedIndex = [...storiesIndex, savedMeta];
      await saveStoriesIndex(updatedIndex);
      setStoriesIndex(updatedIndex);
      await window.storage.set(storyKey(meta.id, "data-v1"), JSON.stringify(newStory), true);
      await window.storage.set(storyKey(meta.id, "count-v1"), "1", true);
      await window.storage.set(storyKey(meta.id, "chapter-v1"), "1", true);

      setStory(newStory);
      setContributorCount(1);

      // Generate the first prompt for user input
      const ctx = getStoryContext(meta);
      const prompt = await generatePrompt(newStory, 1, false, ctx);
      setCurrentPrompt(prompt);
      await window.storage.set(storyKey(meta.id, "prompt-v1"), prompt, true);

      history.replaceState(null, "", "#story/" + slug);
    } else {
      // Opener failed — still save to index so user isn't stuck, but with no story data
      const updatedIndex = [...storiesIndex, meta];
      await saveStoriesIndex(updatedIndex);
      setStoriesIndex(updatedIndex);

      const ctx = getStoryContext(meta);
      const prompt = await generatePrompt([], 1, false, ctx);
      setCurrentPrompt(prompt);
      await window.storage.set(storyKey(meta.id, "prompt-v1"), prompt, true);
      history.replaceState(null, "", "#story/" + meta.id);
    }

    // Everything is ready — navigate directly to the story
    setPhase("input");
    setView("story");

    // Start polling
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadStoryData(meta.id, false), 5000);
  };

  const goHome = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    window.scrollTo(0, 0);
    setView("home");
    setActiveStoryId(null);
    setShowStoryMenu(false);
    window.location.hash = "";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Faustina:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0f0e0c; overflow-x: hidden; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        textarea:focus { outline: none; }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
        .story-scroll::-webkit-scrollbar { width: 4px; }
        .story-scroll::-webkit-scrollbar-track { background: transparent; }
        .story-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        .passage-slider { -webkit-appearance: none; appearance: none; height: 2px; background: rgba(255,255,255,0.1); border-radius: 1px; outline: none; }
        .passage-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 10px; height: 10px; border-radius: 50%; background: #e8ddd0; cursor: pointer; }
        .passage-slider::-moz-range-track { height: 2px; background: rgba(255,255,255,0.1); border-radius: 1px; border: none; }
        .passage-slider::-moz-range-thumb { width: 10px; height: 10px; border-radius: 50%; background: #e8ddd0; cursor: pointer; border: none; }
        .drop-cap::first-letter { float: left; font-size: 3.7em; line-height: 0.75; padding-right: 6px; padding-top: 4px; font-weight: 400; }
        .story-hscroll::-webkit-scrollbar { display: none; }
        @media (max-width: 600px) {
          .about-ascii { font-size: 7px !important; }
        }
      `}</style>

      {/* Mobile: fixed top bar with back, chapter title, menu */}
      {view === "story" && narrowViewport && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          zIndex: 10,
          background: "#0e0d0b",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px",
          height: "48px",
        }}>
                <button
                  onClick={goHome}
                  style={{
                    background: "none", border: "none",
                    fontFamily: MONO, fontSize: "12px",
                    color: "rgba(255,255,255,0.4)", cursor: "pointer",
                    padding: "8px 0",
                  }}
                >
                  <GoArrowLeft size={16} />
                </button>
                <div style={{ flex: 1, padding: "0 12px", position: "relative" }}>
                  {(() => {
                    const chapters = [...new Set(story.map((e) => e.chapter || 1))].sort((a, b) => a - b);
                    const hasMultiple = chapters.length > 1;
                    return (
                      <>
                        <button
                          onClick={() => hasMultiple && setShowChapterDropdown(!showChapterDropdown)}
                          style={{
                            background: "none", border: "none",
                            fontFamily: MONO, fontSize: "11px",
                            color: "rgba(255,255,255,0.4)",
                            letterSpacing: "0.3px",
                            textAlign: "center",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            width: "100%",
                            cursor: hasMultiple ? "pointer" : "default",
                            padding: 0,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                          }}
                        >
                          <span>
                            {visibleChapter === 0
                              ? (hasMultiple ? "Select a chapter" : "")
                              : chapterTitles[visibleChapter]
                              ? `Ch. ${visibleChapter} — ${chapterTitles[visibleChapter]}`
                              : `Chapter ${visibleChapter}`}
                          </span>
                          {hasMultiple && <GoChevronDown size={12} />}
                        </button>
                        {showChapterDropdown && (
                          <>
                            <div
                              onClick={() => setShowChapterDropdown(false)}
                              style={{ position: "fixed", inset: 0, zIndex: -1 }}
                            />
                            <div style={{
                              position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                              marginTop: "8px",
                              background: "#1a1917",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "6px",
                              padding: "4px 0",
                              minWidth: "200px",
                              maxHeight: "60vh",
                              overflowY: "auto",
                              zIndex: 20,
                            }}>
                              {chapters.map((ch) => {
                                const isActive = ch === visibleChapter;
                                return (
                                  <button
                                    key={ch}
                                    onClick={() => {
                                      setShowChapterDropdown(false);
                                      document.getElementById(`chapter-${ch}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }}
                                    style={{
                                      display: "block", width: "100%",
                                      background: isActive ? "rgba(255,255,255,0.06)" : "none",
                                      border: "none", padding: "10px 16px",
                                      fontFamily: MONO, fontSize: "12px",
                                      color: isActive ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)",
                                      cursor: "pointer", textAlign: "left",
                                      letterSpacing: "0.3px",
                                    }}
                                  >
                                    <span style={{ marginRight: "8px" }}>{ch}.</span>
                                    {ch === currentChapter ? "In progress" : (chapterTitles[ch] || `Chapter ${ch}`)}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => { setShowStoryMenu(!showStoryMenu); setConfirmDeleteMenu(false); setLinkCopied(false); }}
                    style={{
                      background: "none", border: "none",
                      color: "rgba(255,255,255,0.4)", cursor: "pointer",
                      padding: "8px 0",
                      display: "flex", alignItems: "center",
                    }}
                  >
                    <GoKebabHorizontal size={16} />
                  </button>
                  {showStoryMenu && (
                    <>
                      <div
                        onClick={() => { setShowStoryMenu(false); setConfirmDeleteMenu(false); setLinkCopied(false); }}
                        style={{ position: "fixed", inset: 0, zIndex: -1 }}
                      />
                      <div style={{
                        position: "absolute", top: "100%", right: 0,
                        marginTop: "4px",
                        background: "#1a1917",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "6px",
                        padding: "4px 0",
                        minWidth: "160px",
                      }}>
                        <button
                          onClick={() => {
                            const activeMeta = storiesIndex.find((s) => s.id === activeStoryId);
                            const url = window.location.origin + "/api/story/" + (activeMeta?.slug || activeStoryId);
                            navigator.clipboard.writeText(url);
                            setLinkCopied(true);
                            setTimeout(() => { setLinkCopied(false); setShowStoryMenu(false); }, 2000);
                          }}
                          style={{
                            display: "block", width: "100%",
                            background: "none", border: "none",
                            fontFamily: MONO, fontSize: "12px",
                            color: linkCopied ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.5)",
                            cursor: "pointer", padding: "8px 14px",
                            textAlign: "left",
                          }}
                        >
                          {linkCopied ? "Copied!" : "Copy Link"}
                        </button>
                        <button
                          onClick={() => {
                            if (confirmDeleteMenu) {
                              setShowStoryMenu(false);
                              setConfirmDeleteMenu(false);
                              handleReset();
                            } else {
                              setConfirmDeleteMenu(true);
                            }
                          }}
                          style={{
                            display: "block", width: "100%",
                            background: "none", border: "none",
                            fontFamily: MONO, fontSize: "12px",
                            color: confirmDeleteMenu ? "#c97a7a" : "rgba(255,255,255,0.5)",
                            cursor: "pointer", padding: "8px 14px",
                            textAlign: "left",
                          }}
                        >
                          {confirmDeleteMenu ? "Confirm delete?" : "Delete"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

      <div style={{
        minHeight: "100vh",
        background: "#0f0e0c",
        position: "relative",
      }}>
        {/* ── Home View ── */}
        {view === "home" && (
          <HomeScreen
            stories={storiesIndex}
            onSelectStory={openStory}
            onNewStory={() => { window.scrollTo(0, 0); setView("new"); }}
            onAbout={() => { window.scrollTo(0, 0); window.location.hash = "about"; setView("about"); }}
          />
        )}

        {/* ── New Story View ── */}
        {view === "new" && (
          <NewStoryScreen
            onCancel={() => setView("home")}
            onCreate={handleCreateStory}
            narrow={narrowViewport}
          />
        )}

        {/* ── About View ── */}
        {view === "about" && (
          <AboutScreen onBack={() => { window.location.hash = ""; setView("home"); }} narrow={narrowViewport} />
        )}

        {/* ── Story View ── */}
        {view === "story" && (
          <>
            {/* Desktop: fixed left sidebar with back button + chapter nav */}
            {!narrowViewport && (
              <>
                <div style={{
                  position: "fixed", left: "24px", top: "24px",
                  zIndex: 5,
                  display: "flex", flexDirection: "column", gap: "20px",
                }}>
                  <button
                    onClick={goHome}
                    style={{
                      background: "none", border: "none",
                      fontFamily: MONO, fontSize: "12px",
                      color: visibleChapter === 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      padding: 0, textAlign: "left",
                      display: "flex", alignItems: "center", gap: "8px",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = visibleChapter === 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)"}
                  >
                    <GoArrowLeft size={14} style={{ flexShrink: 0, width: "16px" }} />
                    <span>{activeStoryMeta?.title || "Home"}</span>
                  </button>
                  {(() => {
                    const chapters = [...new Set(story.map((e) => e.chapter || 1))].sort((a, b) => a - b);
                    if (chapters.length <= 1) return null;
                    return (
                      <nav style={{
                        fontFamily: MONO, fontSize: "12px",
                        display: "flex", flexDirection: "column", gap: "8px",
                      }}>
                        {chapters.map((ch) => {
                          const isActive = ch === visibleChapter;
                          return (
                            <button
                              key={ch}
                              onClick={() => document.getElementById(`chapter-${ch}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                              style={{
                                background: "none", border: "none", padding: 0,
                                fontFamily: MONO, fontSize: "12px",
                                color: isActive ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)",
                                cursor: "pointer", textAlign: "left",
                                letterSpacing: "0.5px",
                                display: "flex", alignItems: "baseline", gap: "8px",
                                transition: "color 0.2s",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
                              onMouseLeave={(e) => e.currentTarget.style.color = isActive ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)"}
                            >
                              <span style={{ width: "16px", textAlign: "center", flexShrink: 0 }}>{ch}</span>
                              <span>{ch === currentChapter ? "In progress" : (chapterTitles[ch] || "")}</span>
                            </button>
                          );
                        })}
                      </nav>
                    );
                  })()}
                </div>

                {/* Desktop: fixed top-right three-dot menu */}
                <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 5 }}>
                  <button
                    onClick={() => { setShowStoryMenu(!showStoryMenu); setConfirmDeleteMenu(false); setLinkCopied(false); }}
                    style={{
                      background: "none", border: "none",
                      color: "rgba(255,255,255,0.3)", cursor: "pointer",
                      padding: "4px 8px",
                      display: "flex", alignItems: "center",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
                  >
                    <GoKebabHorizontal size={16} />
                  </button>
                  {showStoryMenu && (
                    <>
                      <div
                        onClick={() => { setShowStoryMenu(false); setConfirmDeleteMenu(false); setLinkCopied(false); }}
                        style={{ position: "fixed", inset: 0, zIndex: -1 }}
                      />
                      <div style={{
                        position: "absolute", top: "100%", right: 0,
                        marginTop: "4px",
                        background: "#1a1917",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "6px",
                        padding: "4px 0",
                        minWidth: "160px",
                      }}>
                        <button
                          onClick={() => {
                            const activeMeta = storiesIndex.find((s) => s.id === activeStoryId);
                            const url = window.location.origin + "/api/story/" + (activeMeta?.slug || activeStoryId);
                            navigator.clipboard.writeText(url);
                            setLinkCopied(true);
                            setTimeout(() => { setLinkCopied(false); setShowStoryMenu(false); }, 2000);
                          }}
                          style={{
                            display: "block", width: "100%",
                            background: "none", border: "none",
                            fontFamily: MONO, fontSize: "12px",
                            color: linkCopied ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.5)",
                            cursor: "pointer", padding: "8px 14px",
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                        >
                          {linkCopied ? "Copied!" : "Copy Link"}
                        </button>
                        <button
                          onClick={() => {
                            if (confirmDeleteMenu) {
                              setShowStoryMenu(false);
                              setConfirmDeleteMenu(false);
                              handleReset();
                            } else {
                              setConfirmDeleteMenu(true);
                            }
                          }}
                          style={{
                            display: "block", width: "100%",
                            background: "none", border: "none",
                            fontFamily: MONO, fontSize: "12px",
                            color: confirmDeleteMenu ? "#c97a7a" : "rgba(255,255,255,0.5)",
                            cursor: "pointer", padding: "8px 14px",
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                        >
                          {confirmDeleteMenu ? "Confirm delete?" : "Delete"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            <div ref={contentRef} style={{ maxWidth: "600px", margin: "0 auto", padding: narrowViewport ? "48px 24px 40px" : "60px 24px 40px", overflow: "visible" }}>

              {/* ── Spacer ── */}
              <div style={{ marginBottom: narrowViewport ? "24px" : "48px" }} />

              {/* ── Story Title ── */}
              {activeStoryMeta?.title && (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  ...(narrowViewport ? {
                    height: "90vh",
                    marginTop: "-48px",
                  } : {
                    minHeight: "80vh",
                  }),
                }}>
                  <h1 style={{
                    fontFamily: SERIF, fontSize: "42px", fontWeight: 700,
                    color: "#e8ddd0", lineHeight: 1.2,
                    padding: "40px 0",
                    marginBottom: 0,
                    textAlign: "center",
                    textWrap: "balance",
                  }}>
                    {activeStoryMeta.title}
                  </h1>
                  <p style={{
                    fontFamily: SERIF, fontSize: "15px", fontStyle: "italic",
                    color: "rgba(255,255,255,0.25)",
                    textAlign: "center", marginTop: narrowViewport ? "0px" : "12px",
                  }}>
                    {story.length === 0 ? "Loading..." : (
                      <>
                        {story.length} contribution{story.length !== 1 ? "s" : ""}
                        {activeStoryMeta.updatedAt && (
                          <> · Last updated: {new Date(activeStoryMeta.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>
                        )}
                      </>
                    )}
                  </p>
                </div>
              )}


              {/* ── Story ── */}
              {story.length > 0 && (
                <div style={{ marginBottom: "48px", position: "relative" }}>
                  <div
                    className="story-scroll"
                    style={{
                      display: "flex", flexDirection: "column", gap: "24px",
                    }}
                  >
                    {story.map((entry, i) => {
                      const showChapterHeading = i === 0 || entry.chapter !== story[i - 1].chapter;
                      const showPopover = pinnedEntry && (pinnedEntry.ts === entry.ts) && !narrowViewport;
                      return (
                        <div key={entry.ts || i}>
                          {showChapterHeading && (
                            <div id={`chapter-${entry.chapter || 1}`} style={{
                              textAlign: "center",
                              marginTop: i === 0 ? 0 : "72px",
                              marginBottom: chapterTitles[entry.chapter || 1] ? "72px" : "16px",
                              scrollMarginTop: "64px",
                            }}>
                              <div style={{
                                fontFamily: MONO, fontSize: "12px",
                                color: "rgba(255,255,255,0.25)",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                              }}>
                                Chapter {entry.chapter || 1}
                              </div>
                              {chapterTitles[entry.chapter || 1] && (
                                <div style={{
                                  fontFamily: SERIF, fontSize: "28px",
                                  color: "#e8ddd0",
                                  fontWeight: 700,
                                  marginTop: "8px",
                                }}>
                                  {chapterTitles[entry.chapter || 1]}
                                </div>
                              )}
                            </div>
                          )}
                          <div style={{
                            position: "relative",
                            opacity: pinnedEntry && pinnedEntry.ts !== entry.ts ? 0.5 : 1,
                            transition: "opacity 0.2s",
                          }}>
                            <StoryLine
                              entry={entry}
                              narrow={narrowViewport}
                              isChapterStart={showChapterHeading}
                              onHover={(e) => {
                                if (pinnedEntry) setPinnedEntry(e);
                                setHoveredEntry(e);
                              }}
                              onLeave={() => {
                                if (!pinnedEntry) setHoveredEntry(null);
                              }}
                              onShowDialog={setDialogEntry}
                              onPinPopover={(e) => setPinnedEntry(e)}
                              hideIcon={!!pinnedEntry && !narrowViewport}
                            />
                            {showPopover && (
                              <div style={{
                                position: "absolute",
                                left: "100%",
                                top: 0,
                                paddingLeft: "24px",
                                width: "304px",
                              }}>
                                <div style={{
                                  position: "sticky",
                                  top: "24px",
                                }}>
                                  <StoryPopover entry={pinnedEntry} onClose={() => setPinnedEntry(null)} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {phase === "streaming" && generatedText && (
                      <div style={{ position: "relative" }}>
                        <TypewriterReveal
                          text={generatedText}
                          narrow={narrowViewport}
                          onComplete={handleStreamingComplete}
                        />
                      </div>
                    )}
                    <div ref={storyEndRef} />
                  </div>
                </div>
              )}

              {/* ── Prompt + Interaction Container ── */}
              {phase !== "streaming" && <div style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: "8px",
                padding: "24px",
              }}>
                {(phase === "input" || phase === "generating") && (
                  <div>
                    <p style={{
                      fontFamily: TYPEWRITER, fontSize: "16px",
                      color: "rgba(255,255,255,0.4)", lineHeight: 1.7,
                      marginBottom: "16px",
                    }}>
                      {currentPrompt}
                    </p>
                    <textarea
                      value={answer}
                      onChange={(e) => { setAnswer(e.target.value); setError(null); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
                      }}
                      placeholder="Write your answer..."
                      rows={3}
                      disabled={phase === "generating"}
                      style={{
                        width: "100%", background: "transparent",
                        border: "none",
                        padding: "0 0 12px", fontFamily: TYPEWRITER,
                        fontSize: "16px", lineHeight: 1.7,
                        color: phase === "generating" ? "rgba(255,255,255,0.3)" : "#e8ddd0",
                        resize: "none", minHeight: "80px",
                      }}
                    />
                    {error && (
                      <p style={{
                        marginTop: "8px", fontFamily: MONO,
                        fontSize: "12px", color: "#c97a7a",
                      }}>{error}</p>
                    )}
                    {showSliders && phase === "input" && (
                      <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px",
                        padding: "12px 0 0",
                      }}>
                        {[
                          { label: "Length", value: sliderLength, set: setSliderLength, labels: ["Brief", "Short", "Moderate", "Medium", "Standard", "Full", "Extended", "Long", "Very Long", "Epic"] },
                          { label: "Dialogue", value: sliderDialogue, set: setSliderDialogue, labels: ["None", "Minimal", "Sparse", "Light", "Moderate", "Balanced", "Frequent", "Rich", "Heavy", "All Talk"] },
                          { label: "Surprise", value: sliderSurprise, set: setSliderSurprise, labels: ["Steady", "Calm", "Gentle", "Mild", "Moderate", "Notable", "Bold", "Dramatic", "Shocking", "Wild"] },
                          { label: "Emotion", value: sliderEmotion, set: setSliderEmotion, labels: ["Stoic", "Reserved", "Subtle", "Restrained", "Moderate", "Open", "Warm", "Vivid", "Intense", "Raw"] },
                        ].map(({ label, value, set, labels }) => (
                          <div key={label}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                              <span style={{ fontFamily: MONO, fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                {label}
                              </span>
                              <span style={{ fontFamily: MONO, fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>
                                {labels[value]}
                              </span>
                            </div>
                            <input
                              type="range" min={0} max={9} step={1} value={value}
                              onChange={(e) => set(Number(e.target.value))}
                              className="passage-slider"
                              style={{
                                width: "100%", cursor: "pointer",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "20px 0 0",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {phase !== "generating" && (
                          <button
                            onClick={() => setShowSliders((v) => !v)}
                            style={{
                              background: "none", border: "none",
                              color: showSliders ? "#e8ddd0" : "rgba(255,255,255,0.25)",
                              cursor: "pointer", padding: 0,
                              display: "flex", alignItems: "center",
                            }}
                            title="Passage style sliders"
                          >
                            <BsSliders2Vertical size={14} />
                          </button>
                        )}
                        {phase !== "generating" && (
                          <button
                            onClick={async () => {
                              if (geoEnabled) {
                                localStorage.removeItem("falcor_geo_enabled");
                                setGeoEnabled(false);
                                setGeoLabel("");
                              } else {
                                const loc = await requestBrowserLocation();
                                if (loc) {
                                  localStorage.setItem("falcor_geo_enabled", "true");
                                  setGeoEnabled(true);
                                  setGeoLabel(loc);
                                } else {
                                  setGeoEnabled(false);
                                  setGeoLabel("");
                                }
                              }
                            }}
                            style={{
                              background: "none", border: "none",
                              color: geoEnabled ? "#ffffff" : "rgba(255,255,255,0.25)",
                              cursor: "pointer", padding: 0,
                              display: "flex", alignItems: "center",
                            }}
                            title={geoEnabled ? "Using precise location" : "Enable precise location"}
                          >
                            <GoLocation size={14} />
                            {geoEnabled && geoLabel && (
                              <span style={{ fontFamily: MONO, fontSize: "10px", marginLeft: "5px", color: "rgba(255,255,255,0.4)" }}>
                                {geoLabel}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                      {phase === "generating" ? (
                        <span style={{
                          fontFamily: MONO, fontSize: "13px",
                          color: "#999",
                        }}>
                          Writing...
                        </span>
                      ) : (
                        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                          <button
                            onClick={handleSubmit}
                            disabled={!answer.trim()}
                            style={{
                              background: "none", border: "none",
                              fontFamily: MONO, fontSize: "13px",
                              color: answer.trim() ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)",
                              cursor: answer.trim() ? "pointer" : "default",
                              padding: 0,
                            }}
                          >
                            PREVIEW
                          </button>
                          <button
                            onClick={handleQuickAdd}
                            disabled={!answer.trim()}
                            style={{
                              background: answer.trim() ? "#e8ddd0" : "rgba(255,255,255,0.08)",
                              border: "none",
                              borderRadius: "20px",
                              fontFamily: MONO, fontSize: "12px",
                              color: answer.trim() ? "#0e0d0b" : "rgba(255,255,255,0.2)",
                              cursor: answer.trim() ? "pointer" : "default",
                              padding: "6px 16px",
                              transition: "all 0.15s",
                            }}
                          >
                            ADD
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(phase === "reveal" || phase === "adding") && (
                  <div style={{ minHeight: "180px", display: "flex", flexDirection: "column" }}>
                    <div style={{ marginBottom: "8px" }}>
                      <button
                        onClick={() => { setPhase("input"); setGeneratedText(""); }}
                        style={{
                          background: "none", border: "none",
                          fontFamily: MONO, fontSize: "13px",
                          color: "#999", cursor: "pointer", padding: 0,
                        }}
                      >
                        <GoArrowLeft size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />BACK
                      </button>
                    </div>
                    <div style={{ marginBottom: "24px", flex: 1 }}>
                      <TypewriterReveal text={generatedText} narrow={narrowViewport} />
                    </div>
                    {generationSource === "local" && (
                      <p style={{
                        fontFamily: MONO, fontSize: "11px",
                        color: "rgba(255,255,255,0.25)", marginBottom: "16px",
                      }}>
                        AI unavailable — used local fallback
                      </p>
                    )}

                    <div style={{ display: "flex", gap: "20px", justifyContent: "flex-end" }}>
                      {phase === "adding" ? (
                        <span style={{
                          fontFamily: MONO, fontSize: "13px",
                          color: "#999",
                        }}>
                          Adding...
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={handleRewrite}
                            style={{
                              background: "none", border: "none",
                              fontFamily: MONO, fontSize: "13px",
                              color: "#999", cursor: "pointer", padding: 0,
                            }}
                          >
                            REWRITE
                          </button>
                          <button
                            onClick={handleConfirm}
                            style={{
                              background: "none", border: "none",
                              fontFamily: MONO, fontSize: "13px",
                              color: "#e8ddd0", cursor: "pointer", padding: 0,
                            }}
                          >
                            ADD
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

              </div>}

            </div>
            {/* ── Popover Dialog (narrow viewport) ── */}
            {dialogEntry && (
              <div
                onClick={() => setDialogEntry(null)}
                style={{
                  position: "fixed", inset: 0,
                  background: "rgba(0,0,0,0.6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 100,
                }}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <StoryPopover entry={dialogEntry} onClose={() => setDialogEntry(null)} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
