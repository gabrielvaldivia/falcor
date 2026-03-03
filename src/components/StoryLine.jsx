import { useState, useRef } from "react";
import { GoInfo } from "react-icons/go";
import { splitIntoParagraphs, splitIntoStanzas } from "../utils/text.js";

export default function StoryLine({ entry, onHover, onLeave, narrow, onShowDialog, onPinPopover, hideIcon, isChapterStart, writingStyle, translatedText, lang }) {
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
        fontFamily: "'Faustina', serif", fontSize: "19px", fontWeight: 300, lineHeight: writingStyle === "rhyming" ? 1.4 : 1.8,
        color: "#e8ddd0", margin: 0,
        textRendering: "optimizeLegibility", fontOpticalSizing: "auto",
        fontFeatureSettings: '"kern", "liga", "calt"',
        hangingPunctuation: "first last",
        textWrap: narrow ? "auto" : "pretty",
        hyphens: narrow ? "auto" : "manual",
        overflowWrap: "break-word", maxWidth: "65ch",
        display: "flex", flexDirection: "column", gap: writingStyle === "rhyming" ? "24px" : "12px",
      }}>
        {writingStyle === "rhyming"
          ? splitIntoStanzas(entry[`text_${lang}`] || translatedText || entry.text).map((stanza, si) => (
              <div key={si} style={{ margin: 0 }}>
                {stanza.map((line, li) => (
                  <div key={li}>{line.charAt(0).toUpperCase() + line.slice(1)}</div>
                ))}
              </div>
            ))
          : splitIntoParagraphs(entry[`text_${lang}`] || translatedText || entry.text).map((para, i) => (
              <p key={i} className={isChapterStart && i === 0 ? "drop-cap" : undefined} style={{ margin: 0 }}>{para.charAt(0).toUpperCase() + para.slice(1)}</p>
            ))
        }
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
              color: "rgba(255,255,255,0.45)",
              transition: "opacity 0.15s, color 0.15s",
              opacity: hideIcon ? 0 : (hovered ? 1 : 0),
              pointerEvents: hideIcon ? "none" : (hovered ? "auto" : "none"),
              position: "sticky", top: "24px",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
          >
            <GoInfo size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
