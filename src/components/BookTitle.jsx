import { useState, useRef, useLayoutEffect } from "react";

export default function BookTitle({ children, style, ...rest }) {
  const ref = useRef(null);
  const [fontSize, setFontSize] = useState(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const base = parseFloat(style.fontSize);
    const minSize = Math.round(base * 0.55);
    let size = base;
    el.style.overflowWrap = "normal";
    el.style.wordBreak = "normal";
    el.style.fontSize = `${size}px`;
    while (el.scrollWidth > el.clientWidth + 1 && size > minSize) {
      size -= 1;
      el.style.fontSize = `${size}px`;
    }
    el.style.overflowWrap = "";
    el.style.wordBreak = "";
    setFontSize(size);
  }, [children, style.fontSize, style.fontFamily]);

  return (
    <div ref={ref} style={{ ...style, fontSize: fontSize != null ? `${fontSize}px` : style.fontSize }} {...rest}>
      {children}
    </div>
  );
}
