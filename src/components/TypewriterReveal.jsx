import { useState, useEffect, useRef } from "react";
import { splitIntoParagraphs } from "../utils/text.js";

export default function TypewriterReveal({ text, narrow, onComplete }) {
  const [charCount, setCharCount] = useState(0);
  const idx = useRef(0);
  const paragraphs = useRef([]);

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
      fontFamily: "'Faustina', serif", fontSize: "19px", fontWeight: 300,
      lineHeight: 1.8, color: "#e8ddd0", fontStyle: "normal", margin: 0,
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
