import { useRef } from "react";
import { MONO } from "../constants/fonts.js";
import { storyFontForId, bookColor } from "../constants/fonts.js";
import BookTitle from "./BookTitle.jsx";

export default function StoryRow({ title, stories, onSelectStory, isTouch, genreId, fontIndexMap, t, lang, translatedTitles }) {
  const scrollRef = useRef(null);

  return (
    <div style={{ marginBottom: isTouch ? "32px" : "40px" }}>
      <h2 style={{
        fontFamily: MONO, fontSize: "12px", fontWeight: 400,
        color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px",
        textTransform: "uppercase", margin: 0,
        padding: isTouch ? "0 20px" : "0 32px",
      }}>
        {title}
      </h2>
      <div style={{ position: "relative", overflow: "clip visible" }}>
        <div style={{
          position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
          pointerEvents: "none", zIndex: 1,
          background: isTouch
            ? "linear-gradient(to right, #0f0e0c 0%, transparent 20px, transparent calc(100% - 20px), #0f0e0c 100%)"
            : "linear-gradient(to right, #0f0e0c 0%, transparent 32px, transparent calc(100% - 32px), #0f0e0c 100%)",
        }} />
        <div
          ref={scrollRef}
          className="story-hscroll"
          style={{
            display: "flex", gap: "20px",
            overflowX: "auto", WebkitOverflowScrolling: "touch",
            padding: isTouch ? "30px 20px" : "30px 32px",
            scrollbarWidth: "none", msOverflowStyle: "none",
          }}
        >
          {stories.map((s, si) => (
            <div
              key={s.id}
              onClick={(e) => {
                e.currentTarget.style.transform = "scale(1.08)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.35)";
                setTimeout(() => onSelectStory(s.id), 150);
              }}
              style={{
                background: bookColor(s.genre || genreId, s.id).bg,
                border: `1px solid ${bookColor(s.genre || genreId, s.id).border}`,
                borderRadius: "4px",
                padding: "16px 14px",
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
                  e.currentTarget.style.transform = `perspective(800px) scale(1.08) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
                  e.currentTarget.style.boxShadow = `${-x * 10}px ${y * 10}px 25px rgba(0,0,0,0.35)`;
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
                  e.currentTarget.style.borderColor = bookColor(s.genre || genreId, s.id).border;
                },
              } : {})}
            >
              <div style={{
                fontFamily: MONO, fontSize: "8px", color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "center",
              }}>
                {title}
              </div>
              <div style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", width: "100%", minWidth: 0,
              }}>
                <BookTitle style={{
                  fontFamily: storyFontForId(genreId, s.id, fontIndexMap).family, fontSize: `${Math.round(17 * (storyFontForId(genreId, s.id, fontIndexMap).scale || 1))}px`, fontWeight: storyFontForId(genreId, s.id, fontIndexMap).weight || 600,
                  color: "#fff", lineHeight: 1.3, padding: "0 2px", maxWidth: "100%",
                }}>
                  {s[`title_${lang}`] || translatedTitles[s.id] || s.title || t("untitled")}
                </BookTitle>
              </div>
              <span style={{
                fontFamily: MONO, fontSize: "10px",
                color: "rgba(255,255,255,0.45)",
                textAlign: "center",
              }}>
                {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
