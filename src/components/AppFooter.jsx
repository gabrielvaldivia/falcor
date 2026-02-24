import { MONO } from "../constants/fonts.js";

export default function AppFooter({ t, lang, setLang, onAbout, style: extraStyle }) {
  const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  return (
    <footer style={{
      padding: isTouch ? "12px 24px 24px" : "24px 24px 0",
      ...extraStyle,
      display: "flex", flexDirection: isTouch ? "column" : "row", alignItems: "center", justifyContent: "center", gap: isTouch ? "8px" : "16px",
      fontFamily: MONO, fontSize: "11px",
      color: "rgba(255,255,255,0.45)",
    }}>
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <span>
          {t("built_by")}{" "}
          <a
            href="https://gabrielvaldivia.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
          >
            Gabriel Valdivia
          </a>
        </span>
        <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
        {onAbout && (
          <>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onAbout(); }}
              style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
            >
              {t("about")}
            </a>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
          </>
        )}
        <span style={{ display: "flex", gap: "4px" }}>
          <span
            onClick={() => setLang("en")}
            style={{ cursor: "pointer", color: lang === "en" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)", fontWeight: lang === "en" ? 600 : 400 }}
          >EN</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
          <span
            onClick={() => setLang("es")}
            style={{ cursor: "pointer", color: lang === "es" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)", fontWeight: lang === "es" ? 600 : 400 }}
          >ES</span>
        </span>
      </div>
      {!isTouch && <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>}
      <span>&copy; {t("copyright")} {new Date().getFullYear()}</span>
    </footer>
  );
}
