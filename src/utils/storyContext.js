import { GENRES, ALL_VOICES, ALL_THEMES, ALL_PROTAGONISTS, ALL_TENSIONS, getVoicesForGenre } from "../constants/genres.js";

export function getStoryContext(meta) {
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
  if (meta.customInstructions) {
    ctx += ` Author's custom instructions: ${meta.customInstructions}`;
  }
  return ctx;
}

export function getStyleForStory(genre, voice) {
  const g = GENRES.find((x) => x.id === genre) || GENRES[0];
  const v = ALL_VOICES.find((x) => x.id === voice) || getVoicesForGenre(genre)[0];
  return {
    tone: v.tone,
    length: v.length,
    mood: g.mood,
    dialogue: g.dialogue || v.dialogue || 2,
  };
}
