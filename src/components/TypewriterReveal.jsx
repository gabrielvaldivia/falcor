import { useState, useEffect, useRef } from "react";
import { splitIntoParagraphs, splitIntoStanzas } from "../utils/text.js";

export default function TypewriterReveal({ text, narrow, onComplete, writingStyle }) {
  const [charCount, setCharCount] = useState(0);
  const idx = useRef(0);
  const paragraphs = useRef([]);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const isRhyming = writingStyle === "rhyming";

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
        if (onCompleteRef.current) onCompleteRef.current();
      }
    }, 18);
    return () => clearInterval(interval);
  }, [text]);

  const visibleText = text.slice(0, charCount);
  const isTyping = charCount < text.length;

  const cursor = isTyping && (
    <span style={{
      display: "inline-block", width: "2px", height: "18px",
      background: "#999", marginLeft: "2px",
      verticalAlign: "text-bottom", animation: "pulse 1s infinite",
    }} />
  );

  const baseStyle = {
    fontFamily: "'Faustina', serif", fontSize: "19px", fontWeight: 300,
    lineHeight: isRhyming ? 1.4 : 1.8, color: "#e8ddd0", fontStyle: "normal", margin: 0,
    textRendering: "optimizeLegibility", fontOpticalSizing: "auto",
    fontFeatureSettings: '"kern", "liga", "calt"',
    hangingPunctuation: "first last",
    textWrap: narrow ? "auto" : "pretty",
    hyphens: narrow ? "auto" : "manual",
    overflowWrap: "break-word", maxWidth: "65ch",
    display: "flex", flexDirection: "column", gap: isRhyming ? "24px" : "12px",
  };

  if (isRhyming) {
    const stanzas = splitIntoStanzas(visibleText);
    return (
      <div style={baseStyle}>
        {stanzas.map((stanza, si) => (
          <div key={si} style={{ margin: 0 }}>
            {stanza.map((line, li) => (
              <div key={li}>
                {line.charAt(0).toUpperCase() + line.slice(1)}
                {si === stanzas.length - 1 && li === stanza.length - 1 && cursor}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  const fullParagraphs = paragraphs.current;
  const visibleParagraphs = [];
  let remaining = charCount;
  for (const para of fullParagraphs) {
    if (remaining <= 0) break;
    const shown = para.slice(0, remaining);
    visibleParagraphs.push(shown);
    remaining -= para.length;
  }

  return (
    <div style={baseStyle}>
      {visibleParagraphs.map((para, i) => (
        <p key={i} style={{ margin: 0 }}>
          {para}
          {i === visibleParagraphs.length - 1 && cursor}
        </p>
      ))}
    </div>
  );
}
