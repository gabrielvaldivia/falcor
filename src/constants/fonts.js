export const MONO = "'SF Pro Mono', 'SF Mono', 'Menlo', 'Courier New', monospace";
export const TYPEWRITER = "'Courier New', 'Courier', monospace";
export const SERIF = "'Faustina', serif";

export const GENRE_FONTS = {
  drama: [
    { family: "'Playfair Display', serif" },
    { family: "'Libre Baskerville', serif" },
    { family: "'Cormorant Garamond', serif" },
    { family: "'Castoro Titling', serif", scale: 0.8 },
    { family: "'Gloock', serif" },
  ],
  scifi: [
    { family: "'Tektur', sans-serif" },
    { family: "'Bruno Ace SC', sans-serif" },
    { family: "'Syne Mono', monospace" },
    { family: "'Space Mono', monospace" },
    { family: "'Jersey 20', sans-serif", scale: 1.2 },
  ],
  mystery: [
    { family: "'Anton', sans-serif" },
    { family: "'Archivo Black', sans-serif" },
    { family: "'Special Elite', cursive" },
  ],
  bedtime: [
    { family: "'Borel', cursive" },
    { family: "'Walter Turncoat', cursive" },
    { family: "'Galindo', cursive" },
  ],
  horror: [
    { family: "'UnifrakturMaguntia', cursive" },
    { family: "'Amarante', serif", scale: 1.2 },
    { family: "'Faculty Glyphic', serif" },
    { family: "'New Rocker', cursive" },
  ],
  fantasy: [
    { family: "'Cormorant Unicase', serif", weight: 600 },
    { family: "'Alegreya SC', serif" },
    { family: "'Cinzel Decorative', cursive" },
    { family: "'Uncial Antiqua', serif" },
  ],
};

export function hashStr(str) {
  let h = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return h;
}

export function genreFont(genreId, index = 0) {
  const fonts = GENRE_FONTS[genreId];
  if (!fonts) return { family: SERIF, weight: 600 };
  return fonts[((index % fonts.length) + fonts.length) % fonts.length];
}

export function storyFontForId(genreId, storyId, fontIndexMap) {
  const idx = fontIndexMap ? (fontIndexMap[storyId] ?? 0) : 0;
  return genreFont(genreId, idx);
}

export function buildFontIndexMap(stories) {
  const byGenre = {};
  const sorted = [...stories].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const map = {};
  for (const s of sorted) {
    byGenre[s.genre] = (byGenre[s.genre] || 0);
    map[s.id] = byGenre[s.genre];
    byGenre[s.genre]++;
  }
  return map;
}

export const GENRE_HUE_RANGE = {
  fantasy:  [240, 320],
  drama:    [20, 50],
  mystery:  [40, 70],
  scifi:    [140, 220],
  bedtime:  [290, 340],
  horror:   [70, 110],
};

export function bookColor(genreId, storyId) {
  const rangeOrObj = GENRE_HUE_RANGE[genreId];
  if (!rangeOrObj) return { bg: "rgba(255,255,255,0.03)", text: "#e8ddd0", border: "rgba(255,255,255,0.06)" };
  const hash = hashStr(storyId);
  const t = (((hash % 1000) + 1000) % 1000) / 1000;
  const range = Array.isArray(rangeOrObj) ? rangeOrObj : rangeOrObj.hue;
  const chroma = Array.isArray(rangeOrObj) ? 0.04 : (rangeOrObj.chroma ?? 0.04);
  const hue = range[0] + t * (range[1] - range[0]);
  const lRange = (!Array.isArray(rangeOrObj) && rangeOrObj.lightness) || null;
  const bgL = lRange ? (lRange[0] + t * (lRange[1] - lRange[0])).toFixed(3) : "0.25";
  const textL = lRange ? (parseFloat(bgL) + 0.6).toFixed(3) : "0.85";
  const borderL = lRange ? (parseFloat(bgL) + 0.1).toFixed(3) : "0.35";
  return {
    bg: `oklch(${bgL} ${chroma} ${hue.toFixed(1)})`,
    text: `oklch(${textL} ${chroma} ${hue.toFixed(1)})`,
    border: `oklch(${borderL} ${chroma} ${hue.toFixed(1)})`,
  };
}
