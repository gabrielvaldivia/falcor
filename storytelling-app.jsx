import { useState, useEffect, useRef, useCallback } from "react";

const PROMPTS_POOL = [
  "What's something unusual you noticed today?",
  "A stranger appeared at the edge of town carrying what?",
  "The sky changed color suddenly because...",
  "Someone whispered a secret — what was it?",
  "An unexpected sound echoed through the streets...",
  "A door that was always locked finally opened, revealing...",
  "The old clock in the square struck thirteen and then...",
  "A letter arrived with no return address. It said...",
  "The river started flowing backwards because...",
  "Everyone stopped and stared at the horizon when...",
  "A child found something glowing in the garden...",
  "The last train of the night carried an unusual passenger...",
  "The map showed a place that shouldn't exist...",
  "All the birds suddenly flew in the same direction toward...",
  "A voice on the radio said something no one expected...",
  "The fog rolled in and with it came...",
  "Someone left a mysterious object on every doorstep...",
  "The old tree in the center of town began to...",
  "A melody drifted through the air that made people...",
  "The reflection in the water showed something different than...",
  "A crack appeared in the ground and from it emerged...",
  "The lighthouse beam revealed something moving in the dark...",
  "An ancient book fell open to a page that read...",
  "The market stall at the end of the row sold only...",
  "When the snow melted, it uncovered...",
];

function getNextPrompt(currentIndex, storyLength) {
  const base = (currentIndex + 1) % PROMPTS_POOL.length;
  const offset = storyLength % 7;
  return (base + offset) % PROMPTS_POOL.length;
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

async function callClaudeAPI(existingStory, prompt, userAnswer, styleSettings) {
  const storyContext =
    existingStory.length > 0
      ? existingStory
          .slice(-5)
          .map((e) => e.text)
          .join("\n\n")
      : "";

  const styleInstructions = getStyleInstructions(styleSettings);

  const systemPrompt = `You are a collaborative storyteller. You take a user's brief answer to a creative writing prompt and transform it into prose that continues an evolving collaborative story.

CRITICAL RULES:
- Write ONLY the story text. No preamble, no explanation, no quotes around it.
- Write in third person, past tense.
- Seamlessly continue from the existing story if provided.
- The output must be substantially different and richer than the user's raw input.

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

async function generateStoryPassage(existingStory, prompt, userAnswer, styleSettings) {
  try {
    const aiText = await callClaudeAPI(existingStory, prompt, userAnswer, styleSettings);
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
      fontFamily: "'Faustina', serif", fontSize: "16px",
      lineHeight: 1.8, color: "#e8ddd0", fontStyle: "italic", margin: 0,
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

function StoryLine({ entry }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: "relative" }}
    >
      <p style={{
        fontFamily: "'Faustina', serif", fontSize: "16px", lineHeight: 1.8,
        color: "#e8ddd0", margin: 0,
      }}>
        {entry.text}
      </p>
      {hovered && (
        <div style={{
          position: "absolute",
          left: "calc(100% + 16px)", top: 0, zIndex: 10,
          background: "#1a1917",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "6px",
          padding: "14px 16px",
          fontFamily: "'SF Mono', 'Menlo', 'Courier New', monospace",
          fontSize: "12px", color: "rgba(255,255,255,0.4)",
          lineHeight: 1.6,
          width: "320px",
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
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState("input");
  const [generatedText, setGeneratedText] = useState("");
  const [generationSource, setGenerationSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [contributorCount, setContributorCount] = useState(0);
  const [showStory, setShowStory] = useState(false);
  const [error, setError] = useState(null);
  const [tone, setTone] = useState(5);
  const [length, setLength] = useState(4);
  const [mood, setMood] = useState(5);
  const [dialogue, setDialogue] = useState(2);
  const [showSliders, setShowSliders] = useState(false);
  const storyEndRef = useRef(null);
  const pollRef = useRef(null);

  const loadState = useCallback(async () => {
    try {
      const storyResult = await window.storage.get("story-v3", true);
      const promptResult = await window.storage.get("prompt-v3", true);
      const countResult = await window.storage.get("count-v3", true);
      if (storyResult) setStory(JSON.parse(storyResult.value));
      if (promptResult) setCurrentPromptIndex(parseInt(promptResult.value, 10));
      if (countResult) setContributorCount(parseInt(countResult.value, 10));
    } catch (e) { /* first run */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadState();
    pollRef.current = setInterval(loadState, 5000);
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

    const prompt = PROMPTS_POOL[currentPromptIndex];
    const userAnswer = answer.trim();

    try {
      const result = await generateStoryPassage(story, prompt, userAnswer, { tone, length, mood, dialogue });
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
      prompt: PROMPTS_POOL[currentPromptIndex],
      author: newCount,
      location: location,
      time: timeStr,
      ts: Date.now(),
    };

    const updatedStory = [...story, newEntry];
    const nextPromptIdx = getNextPrompt(currentPromptIndex, updatedStory.length);

    try {
      await window.storage.set("story-v3", JSON.stringify(updatedStory), true);
      await window.storage.set("prompt-v3", String(nextPromptIdx), true);
      await window.storage.set("count-v3", String(newCount), true);

      setStory(updatedStory);
      setCurrentPromptIndex(nextPromptIdx);
      setContributorCount(newCount);
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
    const prompt = PROMPTS_POOL[currentPromptIndex];
    try {
      const result = await generateStoryPassage(story, prompt, answer.trim(), { tone, length, mood, dialogue });
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
      await window.storage.delete("prompt-v3", true);
      await window.storage.delete("count-v3", true);
    } catch (e) {}
    setStory([]);
    setCurrentPromptIndex(0);
    setContributorCount(0);
    setPhase("input");
    setAnswer("");
    setGeneratedText("");
    setError(null);
  };

  const currentPrompt = PROMPTS_POOL[currentPromptIndex];

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
        body { background: #0f0e0c; overflow-x: hidden; }
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
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "60px 24px 40px" }}>

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
            <div style={{ marginBottom: "48px" }}>
              <div
                className="story-scroll"
                style={{
                  display: "flex", flexDirection: "column", gap: "24px",
                }}
              >
                {story.map((entry, i) => (
                  <StoryLine key={entry.ts || i} entry={entry} />
                ))}
                <div ref={storyEndRef} />
              </div>
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
