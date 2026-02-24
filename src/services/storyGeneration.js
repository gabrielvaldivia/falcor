import { callClaude } from "./api.js";
import { GENRES, ALL_VOICES, ALL_THEMES, ALL_PROTAGONISTS, ALL_TENSIONS } from "../constants/genres.js";
import { TRANSLATIONS } from "../constants/translations.js";
import { getStyleForStory } from "../utils/storyContext.js";

export async function generatePrompt(existingStory, chapter = 1, isNewChapter = false, genreVoiceCtx = "", plotPace = 5, lang = "en") {
  const storyContext = existingStory.length > 0
    ? existingStory.slice(-3).map((e) => e.text).join("\n\n")
    : "";

  const plotPaceInstruction = plotPace <= 2
    ? `\nIMPORTANT: Generate a question that invites the user to describe atmosphere, a sensory detail, or an emotion. Do NOT ask about events or what happens next. Examples: "What did the room smell like?", "What sound kept repeating?", "How did the air feel?"\n`
    : plotPace >= 7
    ? `\nIMPORTANT: Generate a question that drives the plot forward dramatically. Ask about actions, decisions, confrontations, or turning points. Examples: "What did they decide to do?", "Who appeared at the door?", "What secret was revealed?"\n`
    : "";

  const systemPrompt = `Generate a single question that a person can answer in a few words. It must be a question ending with "?" that invites a short, imaginative response. NOT a story sentence. NOT a statement. It should feel like a question a friend asks you.
${genreVoiceCtx ? `\nContext: ${genreVoiceCtx}\nThe question should fit naturally within this genre and voice.\n` : ""}${plotPaceInstruction}
Good examples:
- "What did the stranger have in their pocket?"
- "What was written on the note?"
- "What woke everyone up at 3am?"
- "What did it smell like inside?"

Bad examples (DO NOT do these):
- "The door creaked open revealing..." (this is a statement, not a question)
- "A mysterious light appeared in the sky." (this is a story sentence)
- "Continue the story about..." (this is an instruction)

Output ONLY the question. No quotes. Under 12 words.${lang === "es" ? "\n\nIMPORTANT: Generate the question in Spanish." : ""}`;

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
    // Validate: must be a short question, not an AI refusal or explanation
    if (text && text.length > 5 && text.length < 150 && text.includes("?") && !text.toLowerCase().includes("i need more context") && !text.toLowerCase().includes("could you please provide")) return text;
  } catch (err) {
    console.warn("Prompt generation failed:", err.message);
  }

  const fb = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const fallbacks = [fb.fallback_1, fb.fallback_2, fb.fallback_3, fb.fallback_4, fb.fallback_5];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

export function getStyleInstructions(settings) {
  const { tone, length, mood, dialogue, surprise = 3, emotion = 4, plot = 5 } = settings;

  const toneDesc = tone <= 3
    ? `minimalist and spare (${tone}/9) — short declarative sentences, very few adjectives`
    : tone <= 6
    ? `balanced literary prose (${tone}/9) — moderate detail and description`
    : `lush and ornate (${tone}/9) — richly descriptive with layered sensory detail and elaborate phrasing`;

  const sentenceCount = Math.round(1 + ((length ?? 4) / 9) * 5);
  const lengthDesc = `approximately ${sentenceCount} sentence${sentenceCount !== 1 ? "s" : ""}`;

  const paceDesc = plot <= 2
    ? "DO NOT advance the plot. Focus entirely on atmosphere, sensory detail, and describing what the user mentions. Linger in the moment. No new events, no plot movement."
    : plot <= 5
    ? "Gently advance the plot. Blend the user's answer with atmosphere and description. Small narrative steps."
    : `Push the plot forward significantly (${plot}/9). Use the user's answer to drive major story beats, introduce new events, and move the narrative forward decisively.`;

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
- Emotion: ${emotionDesc}
- Plot pace: ${paceDesc}`;
}

export async function shouldEndChapter(story, currentChapter) {
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

export async function generateChapterTitle(story, chapter, lang = "en") {
  const chapterText = story
    .filter((e) => e.chapter === chapter)
    .map((e) => e.text)
    .join("\n\n");

  try {
    const title = await callClaude(
      `You are a literary editor. Given the text of a story chapter, produce a short, evocative chapter title. Output ONLY the title — no quotes, no "Chapter N:", no punctuation unless it's part of the title. 1-5 words.

TITLE RULES — CRITICAL:
- NEVER use the pattern "The [Adjective] [Noun]" (e.g. "The Silent Garden", "The Broken Promise")
- NEVER start with "The" unless it's genuinely the best choice
- Use fragments, actions, images, single words, or short phrases pulled from the chapter's most striking moment
- Good: "Salt Water", "Run", "What Grew Back", "Foxfire", "Among the Wreckage"
- Bad: "The Dark Discovery", "The Hidden Secret", "The Final Confrontation"${lang === "es" ? "\nWrite the title in Spanish." : ""}`,
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

export async function callClaudeAPI(existingStory, prompt, userAnswer, styleSettings, chapter = 1, genreVoiceCtx = "", lang = "en", usedNames = []) {
  const storyContext =
    existingStory.length > 0
      ? (() => {
          const recent = existingStory.slice(-8);
          const first = existingStory[0];
          const passages = recent.includes(first) ? recent : [first, ...recent];
          return passages.map((e) => e.text).join("\n\n");
        })()
      : "";

  const styleInstructions = getStyleInstructions(styleSettings);

  const nameAvoidance = usedNames.length > 0
    ? `\n- NEVER reuse these protagonist/character names from other stories: ${usedNames.join(", ")}. Invent completely different names.`
    : "";

  const systemPrompt = `You are a collaborative storyteller writing Chapter ${chapter} of an evolving collaborative story. You take a user's brief answer to a creative writing prompt and transform it into prose that continues the story.
${genreVoiceCtx ? `\n${genreVoiceCtx}\n` : ""}
CRITICAL RULES:
- Write ONLY the story text. No preamble, no explanation, no quotes around it.
- Write in third person, past tense.
- Seamlessly continue from the existing story if provided.
- The output must be substantially different and richer than the user's raw input.
- Build toward a satisfying narrative arc within this chapter.${nameAvoidance}

YOU MUST STRICTLY FOLLOW THESE STYLE SETTINGS — they are the most important constraint:
${styleInstructions}

These style settings override any other instinct you have. If the style says "spare", write bare-bones prose. If it says "ornate", write elaborate prose. If it says "1 sentence", write exactly 1 sentence. If dialogue is "none", include zero dialogue. Follow the settings literally.${lang === "es" ? "\n\nIMPORTANT: Write the entire story passage in Spanish." : ""}`;

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

export async function generateStoryOpener(meta, lang = "en", usedNames = []) {
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
  if (meta.customInstructions) {
    extraContext += `\nCustom instructions from the author: ${meta.customInstructions}`;
  }

  try {
    const text = await callClaude(
      `You are a novelist. Given a genre and writing voice, generate the title and opening paragraph of an original story.

Genre: ${genreObj.label} — themes: ${genreObj.prompt}
Voice: ${voiceObj.label} — ${voiceObj.description.toLowerCase()}${extraContext}

Style constraints:
${styleInstructions}

Respond in EXACTLY this format (no extra text):
TITLE: <a creative, unexpected title>
PARAGRAPH: <the opening paragraph>

TITLE RULES — CRITICAL:
- NEVER use the pattern "The [Adjective] [Noun]" (e.g. "The Silent Garden", "The Forgotten Path")
- NEVER start with "The" unless it's genuinely the best choice
- Draw inspiration from literary fiction titles: fragments of dialogue, single evocative words, contradictions, place names, character names, actions, questions, or poetic phrases
- Good examples: "Salt and Ruin", "Where the Dog Star Rests", "Kindling", "A Mouth Full of Stars", "Loomings", "No Country for Old Men", "Beloved", "If on a Winter's Night", "Catch-22"
- Bad examples: "The Whispering Shadows", "The Hidden Truth", "The Lost Horizon", "The Forgotten Memory"
- 1-6 words. Be bold. Be specific. Be surprising.

The opening paragraph must read like page one of a published novel — establish a character, setting, or atmosphere. Ground the reader in a specific scene. Follow the style constraints literally.${usedNames.length > 0 ? `\n\nCRITICAL: Do NOT reuse any of these character names from other stories: ${usedNames.join(", ")}. Invent completely different, original names.` : ""}${lang === "es" ? "\n\nIMPORTANT: Write both the title and paragraph in Spanish." : ""}`,
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

export async function retitleStory(storyData, genre, writingStyle, lang = "en") {
  const genreObj = GENRES.find((g) => g.id === genre);
  const voiceObj = ALL_VOICES.find((v) => v.id === writingStyle);
  const context = genreObj ? `Genre: ${genreObj.label}` : "";
  const voiceCtx = voiceObj ? `Voice: ${voiceObj.label}` : "";

  const excerpt = storyData.slice(0, 5).map((e) => e[`text_${lang}`] || e.text).join("\n\n");

  try {
    const title = await callClaude(
      `You are a literary editor retitling a story. Given the opening passages, genre, and voice, produce a fresh, creative title.

${context}${voiceCtx ? "\n" + voiceCtx : ""}

TITLE RULES — CRITICAL:
- NEVER use the pattern "The [Adjective] [Noun]" (e.g. "The Silent Garden", "The Forgotten Path")
- NEVER start with "The" unless it's genuinely the best choice
- Draw from: fragments of dialogue, single evocative words, contradictions, place names, character actions, images, questions, or poetic phrases
- Good examples: "Salt and Ruin", "Kindling", "A Mouth Full of Stars", "Loomings", "Beloved", "Catch-22", "Blood Meridian"
- Bad examples: "The Whispering Shadows", "The Hidden Truth", "The Lost Horizon"
- 1-6 words. Be bold. Be specific. Be surprising.
- Output ONLY the title. No quotes, no explanation.
- IMPORTANT: The passages may be written in any language. Regardless, you MUST write the title in ${lang === "es" ? "Spanish" : "English"}.${lang === "es" ? "" : " If the text is in Spanish or another language, still produce an English title."}`,
      `Here are the opening passages:\n\n${excerpt}\n\nWhat should this story be titled?`,
      40
    );
    const cleaned = title.replace(/^["']|["']$/g, "").trim();
    return cleaned && cleaned.length > 0 ? cleaned : null;
  } catch (err) {
    console.warn("Retitling failed:", err.message);
    return null;
  }
}

export async function extractCharacterNames(storyTexts) {
  if (storyTexts.length === 0) return [];
  try {
    const excerpts = storyTexts.map((t, i) => `Story ${i + 1}: ${t}`).join("\n\n");
    const result = await callClaude(
      `Extract all character names (first names only) from these story excerpts. Output ONLY a comma-separated list of names. If no names are found, output "none".`,
      excerpts,
      200
    );
    if (!result || result.toLowerCase().includes("none")) return [];
    return result.split(",").map((n) => n.trim()).filter((n) => n.length > 1 && n.length < 30);
  } catch {
    return [];
  }
}

export const SCENE_OPENERS = [
  "It was the kind of moment that made the air feel heavier.",
  "The town had seen many strange things, but nothing quite like this.",
  "No one could say exactly when it started, only that it did.",
  "The evening light shifted, casting long shadows across the cobblestones.",
  "A hush fell over the square, thick as morning fog.",
  "Time seemed to slow, the way it does before something changes forever.",
  "The wind carried with it a scent no one could name.",
  "Something stirred at the edge of perception, just beyond understanding.",
];

export const CONTINUATIONS = [
  "The townsfolk exchanged uneasy glances, sensing that the world had tilted slightly on its axis.",
  "It lingered in the air like a half-remembered dream, impossible to shake.",
  "No one spoke of it aloud, but everyone felt the shift in their bones.",
  "The silence that followed was louder than any sound the town had ever known.",
  "Even the stray cats paused in the alleyways, ears pricked toward something unseen.",
  "It was as if the town itself had drawn a breath and was holding it still.",
  "Those who witnessed it would carry the memory like a stone in their pocket, smooth and heavy.",
  "By the time anyone thought to question it, the moment had already slipped into the fabric of the town's long history.",
];

export function expandLocally(existingStory, userAnswer) {
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

export async function generateStoryPassage(existingStory, prompt, userAnswer, styleSettings, chapter = 1, genreVoiceCtx = "", lang = "en", usedNames = []) {
  try {
    const aiText = await callClaudeAPI(existingStory, prompt, userAnswer, styleSettings, chapter, genreVoiceCtx, lang, usedNames);
    return { text: aiText, source: "ai" };
  } catch (err) {
    console.warn("AI generation failed, using local expansion:", err.message);
  }
  const localText = expandLocally(existingStory, userAnswer);
  return { text: localText, source: "local" };
}
