import { MONO } from "../constants/fonts.js";

export default function StoryPopover({ entry, onClose, t }) {
  if (!entry) return null;
  return (
    <div style={{
      zIndex: 10,
      background: "#1a1917",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "6px",
      padding: "14px 16px",
      fontFamily: MONO,
      fontSize: "12px", color: "rgba(255,255,255,0.5)",
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
            cursor: "pointer", color: "rgba(255,255,255,0.45)",
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
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t ? t("popover_location") : "Location"}</div>
          <div style={{ color: "rgba(255,255,255,0.5)" }}>{entry.location}</div>
        </div>
      )}
      {entry.time && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t ? t("popover_date") : "Date"}</div>
          <div style={{ color: "rgba(255,255,255,0.5)" }}>{entry.time}</div>
        </div>
      )}
      {entry.prompt && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t ? t("popover_prompt") : "Prompt"}</div>
          <div style={{ color: "rgba(255,255,255,0.5)" }}>{entry.prompt}</div>
        </div>
      )}
      {entry.originalAnswer && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t ? t("popover_answer") : "Answer"}</div>
          <div style={{ color: "rgba(255,255,255,0.5)" }}>{entry.originalAnswer}</div>
        </div>
      )}
    </div>
  );
}
