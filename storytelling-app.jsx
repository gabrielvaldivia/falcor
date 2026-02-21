import { useState, useEffect, useRef, useCallback } from "react";

async function generatePrompt(existingStory, chapter = 1, isNewChapter = false) {
  const storyContext = existingStory.length > 0
    ? existingStory.slice(-3).map((e) => e.text).join("\n\n")
    : "";

  const systemPrompt = `Generate a single question that a person can answer in a few words. It must be a question ending with "?" that invites a short, imaginative response. NOT a story sentence. NOT a statement. It should feel like a question a friend asks you.

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
    userMessage = "Generate an opening question to start a collaborative story.";
  } else if (isNewChapter) {
    userMessage = `STORY SO FAR (last passages):\n"""${storyContext}"""\n\nYou are starting Chapter ${chapter} of the story. Generate an opening question for this new chapter that shifts the setting, introduces a new thread, or jumps forward in time. It should feel like a fresh start while still connected to the world established so far.`;
  } else {
    userMessage = `STORY SO FAR (last passages):\n"""${storyContext}"""\n\nGenerate a short question about what happens next in Chapter ${chapter}, based on the story so far.`;
  }

  try {
    const resp = await fetch("/api/anthropic/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 100,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!resp.ok) throw new Error(`API ${resp.status}`);
    const data = await resp.json();
    const text = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (text && text.length > 5) return text;
  } catch (err) {
    console.warn("Prompt generation failed:", err.message);
  }

  // Fallback
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
  const { tone, length, mood, dialogue } = settings;

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

  return `- Style: ${toneDesc}
- Length: ${lengthDesc}
- Mood: ${moodDesc}
- Dialogue: ${dialogueDesc}`;
}

async function shouldEndChapter(story, currentChapter) {
  const chapterPassages = story.filter((e) => e.chapter === currentChapter);
  if (chapterPassages.length < 4) return false;

  const chapterText = chapterPassages.map((e) => e.text).join("\n\n");

  try {
    const resp = await fetch("/api/anthropic/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 10,
        system: `You are a narrative structure analyst. Given the passages of a story chapter, determine if the chapter's narrative arc feels complete — has it built tension and reached a natural resolution or resting point? Consider: has there been a setup, development, and some form of payoff or shift? Chapters typically run 5-8 passages but can be shorter if the arc resolves early. Respond with ONLY "yes" or "no".`,
        messages: [{ role: "user", content: `Here are the passages of Chapter ${currentChapter}:\n\n${chapterText}\n\nIs this chapter's narrative arc complete?` }],
      }),
    });

    if (!resp.ok) return false;
    const data = await resp.json();
    const answer = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim()
      .toLowerCase();
    return answer.startsWith("yes");
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
    const resp = await fetch("/api/anthropic/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 30,
        system: `You are a literary editor. Given the text of a story chapter, produce a short, evocative chapter title. Output ONLY the title — no quotes, no "Chapter N:", no punctuation unless it's part of the title. 2-5 words.`,
        messages: [{ role: "user", content: `Here is Chapter ${chapter}:\n\n${chapterText}\n\nWhat should this chapter be titled?` }],
      }),
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    const title = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim()
      .replace(/^["']|["']$/g, "");
    return title && title.length > 0 ? title : null;
  } catch (err) {
    console.warn("Chapter title generation failed:", err.message);
    return null;
  }
}

async function callClaudeAPI(existingStory, prompt, userAnswer, styleSettings, chapter = 1) {
  const storyContext =
    existingStory.length > 0
      ? existingStory
          .slice(-5)
          .map((e) => e.text)
          .join("\n\n")
      : "";

  const styleInstructions = getStyleInstructions(styleSettings);

  const systemPrompt = `You are a collaborative storyteller writing Chapter ${chapter} of an evolving collaborative story. You take a user's brief answer to a creative writing prompt and transform it into prose that continues the story.

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
      : `This is the FIRST passage of a brand new collaborative story.\n\nPROMPT SHOWN TO USER: "${prompt}"\nUSER'S ANSWER: "${userAnswer}"\n\nTransform their answer into the opening passage following the style settings exactly. Output ONLY the story text.`;

  const requestBody = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  };
  const resp = await fetch("/api/anthropic/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!resp.ok) {
    const errBody = await resp.text().catch(() => "unknown");
    throw new Error(`API ${resp.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await resp.json();

  if (!data.content || !Array.isArray(data.content)) {
    throw new Error("Unexpected API response shape: " + JSON.stringify(data).slice(0, 300));
  }

  const text = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (!text || text.length < 10) {
    throw new Error("API returned empty or too-short text");
  }

  // Safety check: if AI just echoed the input back, reject it
  if (text.toLowerCase() === userAnswer.toLowerCase().trim()) {
    throw new Error("AI echoed input verbatim");
  }

  return text;
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
  try {
    const resp = await fetch("https://ipapi.co/json/");
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.city && data.country_name) {
      return data.city + ", " + data.country_name;
    }
    if (data.country_name) return data.country_name;
    return null;
  } catch {
    return null;
  }
}

async function generateStoryPassage(existingStory, prompt, userAnswer, styleSettings, chapter = 1) {
  try {
    const aiText = await callClaudeAPI(existingStory, prompt, userAnswer, styleSettings, chapter);
    return { text: aiText, source: "ai" };
  } catch (err) {
    console.warn("AI generation failed, using local expansion:", err.message);
  }
  const localText = expandLocally(existingStory, userAnswer);
  return { text: localText, source: "local" };
}

/* ────────────────────────────────────────────
   Typewriter Reveal
   ──────────────────────────────────────────── */

function TypewriterReveal({ text }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      idx.current++;
      if (idx.current <= text.length) {
        setDisplayed(text.slice(0, idx.current));
      } else {
        clearInterval(interval);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <p style={{
      fontFamily: "'Faustina', serif", fontSize: "19px", fontWeight: 300,
      lineHeight: 1.8, color: "#e8ddd0", fontStyle: "italic", margin: 0,
      textRendering: "optimizeLegibility", fontOpticalSizing: "auto",
      fontFeatureSettings: '"kern", "liga", "calt"',
      hangingPunctuation: "first last", textWrap: "pretty",
      overflowWrap: "break-word", maxWidth: "65ch",
    }}>
      {displayed}
      {displayed.length < text.length && (
        <span style={{
          display: "inline-block", width: "2px", height: "18px",
          background: "#999", marginLeft: "2px",
          verticalAlign: "text-bottom", animation: "pulse 1s infinite",
        }} />
      )}
    </p>
  );
}

/* ────────────────────────────────────────────
   Story Entry (minimal)
   ──────────────────────────────────────────── */

function StoryLine({ entry, onHover, onLeave }) {
  const ref = useRef(null);
  return (
    <div
      ref={ref}
      onMouseEnter={() => {
        const rect = ref.current.getBoundingClientRect();
        onHover(entry, rect.top);
      }}
      onMouseLeave={onLeave}
    >
      <p style={{
        fontFamily: "'Faustina', serif", fontSize: "19px", fontWeight: 300, lineHeight: 1.8,
        color: "#e8ddd0", margin: 0,
        textRendering: "optimizeLegibility", fontOpticalSizing: "auto",
        fontFeatureSettings: '"kern", "liga", "calt"',
        hangingPunctuation: "first last", textWrap: "pretty",
        overflowWrap: "break-word", maxWidth: "65ch",
      }}>
        {entry.text}
      </p>
    </div>
  );
}

function StoryPopover({ entry }) {
  if (!entry) return null;
  return (
    <div style={{
      zIndex: 10,
      background: "#1a1917",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "6px",
      padding: "14px 16px",
      fontFamily: "'SF Mono', 'Menlo', 'Courier New', monospace",
      fontSize: "12px", color: "rgba(255,255,255,0.4)",
      lineHeight: 1.6,
      width: "280px",
      display: "flex", flexDirection: "column", gap: "8px",
    }}>
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
   Main App
   ──────────────────────────────────────────── */

const MONO = "'SF Mono', 'Menlo', 'Courier New', monospace";
const TYPEWRITER = "'Courier New', 'Courier', monospace";
const SERIF = "'Faustina', serif";

export default function CollaborativeStoryApp() {
  const [story, setStory] = useState([]);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState("input");
  const [generatedText, setGeneratedText] = useState("");
  const [generationSource, setGenerationSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [contributorCount, setContributorCount] = useState(0);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [chapterTitles, setChapterTitles] = useState({});
  const [showStory, setShowStory] = useState(false);
  const [error, setError] = useState(null);
  const [tone, setTone] = useState(5);
  const [length, setLength] = useState(4);
  const [mood, setMood] = useState(5);
  const [dialogue, setDialogue] = useState(2);
  const [showSliders, setShowSliders] = useState(false);
  const [hoveredEntry, setHoveredEntry] = useState(null);
  const [popoverTop, setPopoverTop] = useState(0);
  const storyEndRef = useRef(null);
  const contentRef = useRef(null);
  const pollRef = useRef(null);

  const loadState = useCallback(async (isInitial) => {
    try {
      const storyResult = await window.storage.get("story-v3", true);
      const countResult = await window.storage.get("count-v3", true);
      const chapterResult = await window.storage.get("chapter-v1", true);
      const titlesResult = await window.storage.get("chapter-titles-v1", true);
      const loadedStory = storyResult ? JSON.parse(storyResult.value) : [];
      const loadedChapter = chapterResult ? parseInt(chapterResult.value, 10) : 1;
      const loadedTitles = titlesResult ? JSON.parse(titlesResult.value) : {};
      if (storyResult) setStory(loadedStory);
      if (countResult) setContributorCount(parseInt(countResult.value, 10));
      setCurrentChapter(loadedChapter);
      setChapterTitles(loadedTitles);
      if (isInitial) {
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
          await window.storage.set("chapter-titles-v1", JSON.stringify(backfilled), true);
        }
        const prompt = await generatePrompt(loadedStory, loadedChapter);
        setCurrentPrompt(prompt);
        await window.storage.set("prompt-v4", prompt, true);
      }
    } catch (e) { /* first run */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadState(true);
    pollRef.current = setInterval(() => loadState(false), 5000);
    return () => clearInterval(pollRef.current);
  }, [loadState]);

  useEffect(() => {
    if (showStory && storyEndRef.current) {
      storyEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [story, showStory]);

  const handleSubmit = async () => {
    if (!answer.trim() || phase !== "input") return;
    setPhase("generating");
    setError(null);

    const userAnswer = answer.trim();

    try {
      const result = await generateStoryPassage(story, currentPrompt, userAnswer, { tone, length, mood, dialogue }, currentChapter);
      setGeneratedText(result.text);
      setGenerationSource(result.source);
      setPhase("reveal");
    } catch (e) {
      console.error("All generation failed:", e);
      setError("Something went wrong. Please try again.");
      setPhase("input");
    }
  };

  const handleConfirm = async () => {
    const newCount = contributorCount + 1;
    const now = new Date();
    const timeStr = now.toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
    const location = await fetchLocation();

    const newEntry = {
      text: generatedText,
      originalAnswer: answer.trim(),
      prompt: currentPrompt,
      author: newCount,
      location: location,
      time: timeStr,
      ts: Date.now(),
      chapter: currentChapter,
    };

    const updatedStory = [...story, newEntry];

    try {
      // Check if the current chapter should end
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
          await window.storage.set("chapter-titles-v1", JSON.stringify(updatedTitles), true);
        }
      }

      const nextPrompt = await generatePrompt(updatedStory, nextChapter, isNewChapter);
      await window.storage.set("story-v3", JSON.stringify(updatedStory), true);
      await window.storage.set("prompt-v4", nextPrompt, true);
      await window.storage.set("count-v3", String(newCount), true);
      await window.storage.set("chapter-v1", String(nextChapter), true);

      setStory(updatedStory);
      setCurrentPrompt(nextPrompt);
      setContributorCount(newCount);
      setCurrentChapter(nextChapter);
      setChapterTitles(updatedTitles);
      setAnswer("");
      setGeneratedText("");
      setGenerationSource("");
      setPhase("done");
      setTimeout(() => setPhase("input"), 2000);
    } catch (e) {
      console.error("Storage error:", e);
    }
  };

  const handleRewrite = async () => {
    setPhase("generating");
    setError(null);
    try {
      const result = await generateStoryPassage(story, currentPrompt, answer.trim(), { tone, length, mood, dialogue }, currentChapter);
      setGeneratedText(result.text);
      setGenerationSource(result.source);
      setPhase("reveal");
    } catch (e) {
      setError("Rewrite failed.");
      setPhase("reveal");
    }
  };

  const handleReset = async () => {
    try {
      await window.storage.delete("story-v3", true);
      await window.storage.delete("prompt-v4", true);
      await window.storage.delete("count-v3", true);
      await window.storage.delete("chapter-v1", true);
      await window.storage.delete("chapter-titles-v1", true);
    } catch (e) {}
    const freshPrompt = await generatePrompt([]);
    setStory([]);
    setCurrentPrompt(freshPrompt);
    setContributorCount(0);
    setCurrentChapter(1);
    setChapterTitles({});
    setPhase("input");
    setAnswer("");
    setGeneratedText("");
    setError(null);
    try { await window.storage.set("prompt-v4", freshPrompt, true); } catch (e) {}
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0f0e0c",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: MONO, color: "#999",
      }}>
        <p style={{ fontSize: "13px" }}>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Faustina:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0f0e0c; overflow-x: hidden; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        textarea:focus { outline: none; }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
        input[type="range"] { -webkit-appearance: none; appearance: none; background: rgba(255,255,255,0.08); height: 2px; border-radius: 1px; outline: none; width: 100%; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.4); cursor: pointer; }
        input[type="range"]::-moz-range-thumb { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.4); cursor: pointer; border: none; }
        .story-scroll::-webkit-scrollbar { width: 4px; }
        .story-scroll::-webkit-scrollbar-track { background: transparent; }
        .story-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#0f0e0c",
        position: "relative",
      }}>
        {(() => {
          const chapters = [...new Set(story.map((e) => e.chapter || 1))].sort((a, b) => a - b);
          if (chapters.length <= 1) return null;
          return (
            <nav style={{
              position: "fixed", left: "24px", top: "60px",
              fontFamily: MONO, fontSize: "12px",
              display: "flex", flexDirection: "column", gap: "8px",
              zIndex: 5,
            }}>
              {chapters.map((ch) => (
                <button
                  key={ch}
                  onClick={() => document.getElementById(`chapter-${ch}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  style={{
                    background: "none", border: "none", padding: 0,
                    fontFamily: MONO, fontSize: "12px",
                    color: "rgba(255,255,255,0.25)",
                    cursor: "pointer", textAlign: "left",
                    letterSpacing: "0.5px",
                    display: "flex", alignItems: "baseline", gap: "8px",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.25)"}
                >
                  <span>{ch}</span>
                  <span>{ch === currentChapter ? "In progress" : (chapterTitles[ch] || "")}</span>
                </button>
              ))}
            </nav>
          );
        })()}
        <div ref={contentRef} style={{ maxWidth: "600px", margin: "0 auto", padding: "60px 24px 40px" }}>

          {/* ── Header ── */}
          <header style={{ marginBottom: "48px" }}>
            <h1 style={{
              fontFamily: MONO, fontSize: "14px", fontWeight: 400,
              color: "#999", letterSpacing: "0.5px",
            }}>
              Falcor
            </h1>
          </header>

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
                  return (
                    <div key={entry.ts || i}>
                      {showChapterHeading && (
                        <div id={`chapter-${entry.chapter || 1}`} style={{
                          textAlign: "center",
                          marginTop: i === 0 ? 0 : "72px",
                          marginBottom: chapterTitles[entry.chapter || 1] ? "72px" : "16px",
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
                      <StoryLine entry={entry} onHover={(e, top) => { setHoveredEntry(e); setPopoverTop(top); }} onLeave={() => setHoveredEntry(null)} />
                    </div>
                  );
                })}
                <div ref={storyEndRef} />
              </div>
              {hoveredEntry && (
                <div style={{
                  position: "fixed",
                  left: contentRef.current ? contentRef.current.getBoundingClientRect().right + 24 : 0,
                  top: Math.max(40, popoverTop),
                  pointerEvents: "none",
                }}>
                  <StoryPopover entry={hoveredEntry} />
                </div>
              )}
            </div>
          )}

          {/* ── Prompt + Interaction Container ── */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: "8px",
            padding: "24px",
          }}>
            {/* ── Input ── */}
            {phase === "input" && (
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
                  style={{
                    width: "100%", background: "transparent",
                    border: "none",
                    padding: "0 0 12px", fontFamily: TYPEWRITER,
                    fontSize: "16px", lineHeight: 1.7, color: "#e8ddd0",
                    resize: "none", minHeight: "80px",
                  }}
                />
                {error && (
                  <p style={{
                    marginTop: "8px", fontFamily: MONO,
                    fontSize: "12px", color: "#c97a7a",
                  }}>{error}</p>
                )}
                {showSliders && (
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    gap: "12px 24px", padding: "16px 0 8px",
                  }}>
                    {[
                      { label: "Tone", low: "Spare", high: "Ornate", value: tone, set: setTone },
                      { label: "Length", low: "Brief", high: "Long", value: length, set: setLength },
                      { label: "Mood", low: "Dark", high: "Whimsical", value: mood, set: setMood },
                      { label: "Dialogue", low: "None", high: "Heavy", value: dialogue, set: setDialogue },
                    ].map(({ label, low, high, value, set }) => (
                      <div key={label}>
                        <div style={{ marginBottom: "6px" }}>
                          <span style={{ fontFamily: MONO, fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{label}</span>
                        </div>
                        <input
                          type="range" min={0} max={9} step={1}
                          value={value}
                          onChange={(e) => set(Number(e.target.value))}
                        />
                        <div style={{
                          display: "flex", justifyContent: "space-between",
                          marginTop: "4px",
                        }}>
                          <span style={{ fontFamily: MONO, fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>{low}</span>
                          <span style={{ fontFamily: MONO, fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>{high}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 0 0",
                }}>
                  <button
                    onClick={() => setShowSliders(!showSliders)}
                    style={{
                      background: "none", border: "none",
                      cursor: "pointer", padding: 0,
                      color: showSliders ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
                      display: "flex", alignItems: "center",
                    }}
                    title="Writing style"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.75 5.75H11.25" />
                      <path d="M4.75 18.25H11.25" />
                      <path d="M4.75 12H7.25" />
                      <path d="M15 5.75H19.25" />
                      <path d="M15 18.25H19.25" />
                      <path d="M11 12H19.25" />
                      <path d="M14.75 4.75V7.25" />
                      <path d="M14.75 16.75V19.25" />
                      <path d="M10.75 10.75V13.25" />
                    </svg>
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!answer.trim()}
                    style={{
                      background: "none", border: "none",
                      fontFamily: MONO, fontSize: "13px",
                      color: answer.trim() ? "#e8ddd0" : "rgba(255,255,255,0.2)",
                      cursor: answer.trim() ? "pointer" : "default",
                      padding: 0,
                    }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}

            {phase === "generating" && (
              <p style={{
                fontFamily: MONO, fontSize: "13px",
                color: "#999",
              }}>
                Writing...
              </p>
            )}

            {phase === "reveal" && (
              <div>
                <div style={{ marginBottom: "24px" }}>
                  <TypewriterReveal text={generatedText} />
                </div>
                {generationSource === "local" && (
                  <p style={{
                    fontFamily: MONO, fontSize: "11px",
                    color: "rgba(255,255,255,0.25)", marginBottom: "16px",
                  }}>
                    AI unavailable — used local fallback
                  </p>
                )}

                <div style={{ display: "flex", gap: "20px" }}>
                  <button
                    onClick={handleConfirm}
                    style={{
                      background: "none", border: "none",
                      fontFamily: MONO, fontSize: "13px",
                      color: "#e8ddd0", cursor: "pointer", padding: 0,
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={handleRewrite}
                    style={{
                      background: "none", border: "none",
                      fontFamily: MONO, fontSize: "13px",
                      color: "#999", cursor: "pointer", padding: 0,
                    }}
                  >
                    Rewrite
                  </button>
                  <button
                    onClick={() => { setPhase("input"); setGeneratedText(""); }}
                    style={{
                      background: "none", border: "none",
                      fontFamily: MONO, fontSize: "13px",
                      color: "#999", cursor: "pointer", padding: 0,
                    }}
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {phase === "done" && (
              <p style={{
                fontFamily: MONO, fontSize: "13px",
                color: "#999",
              }}>
                Added.
              </p>
            )}
          </div>

          {/* ── Footer ── */}
          {story.length > 0 && (
            <footer style={{ marginTop: "48px" }}>
              <button
                onClick={handleReset}
                style={{
                  background: "none", border: "none",
                  fontFamily: MONO, fontSize: "12px",
                  color: "rgba(255,255,255,0.2)", cursor: "pointer",
                  padding: 0,
                }}
                onMouseEnter={(e) => e.target.style.color = "rgba(255,255,255,0.5)"}
                onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.2)"}
              >
                Reset
              </button>
            </footer>
          )}
        </div>
      </div>
    </>
  );
}
