import React, { useState, useRef, useEffect } from "react";
import { sizeConfigs } from "../data/sizes";
import { type Difficulty } from "../types";

interface SizeNavbarProps {
  sizeIndex: number;
  onSelectSize: (index: number) => void;
  difficulty?: Difficulty;
  onSelectDifficulty?: (d: Difficulty) => void;
}

const DIFF_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const DIFF_COLORS: Record<Difficulty, string> = {
  easy: "var(--accent-2)",
  medium: "#f59e0b",
  hard: "#ef4444",
};

const SizeNavbar: React.FC<SizeNavbarProps> = ({ sizeIndex, onSelectSize, difficulty, onSelectDifficulty }) => {
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setDropdownPos(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSizeBtnClick = (i: number) => {
    if (i === sizeIndex && difficulty && onSelectDifficulty) {
      if (openDropdown === i) {
        setOpenDropdown(null);
        setDropdownPos(null);
      } else {
        const btn = btnRefs.current[i];
        if (btn) {
          const rect = btn.getBoundingClientRect();
          setDropdownPos({ top: rect.bottom + 4, left: rect.left + rect.width / 2 });
        }
        setOpenDropdown(i);
      }
    } else {
      onSelectSize(i);
      setOpenDropdown(null);
      setDropdownPos(null);
    }
  };

  return (
    <div ref={navRef} style={{ position: "relative" }}>
      <nav className="size-navbar">
        {sizeConfigs.map((cfg, i) => (
          <button
            key={cfg.n}
            ref={el => { btnRefs.current[i] = el; }}
            className={`size-btn ${i === sizeIndex ? "size-btn-active" : ""}`}
            onClick={() => handleSizeBtnClick(i)}
          >
            <span className="size-tag">{cfg.tag}</span>
            <span className="size-label">{cfg.label}</span>
          </button>
        ))}
      </nav>

      {/* Dropdown rendered via portal-style fixed positioning — sits above StatsBar, no layout shift */}
      {openDropdown !== null && dropdownPos && difficulty && onSelectDifficulty && (
        <div style={{
          position: "fixed",
          top: dropdownPos.top,
          left: dropdownPos.left,
          transform: "translateX(-50%)",
          background: "var(--bg)",
          border: "1px solid var(--border-accent)",
          borderRadius: 8,
          padding: "4px",
          zIndex: 200,
          minWidth: 120,
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          backdropFilter: "none",
          opacity: 1,
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", padding: "3px 8px 5px", fontFamily: "Sora, sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Difficulty
          </div>
          {(["easy", "medium", "hard"] as Difficulty[]).map(d => (
            <button
              key={d}
              onClick={() => { onSelectDifficulty(d); setOpenDropdown(null); setDropdownPos(null); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                width: "100%",
                padding: "6px 10px",
                background: d === difficulty ? "var(--surface-hover)" : "transparent",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: "Sora, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                textAlign: "left",
                transition: "background 0.1s",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: DIFF_COLORS[d], flexShrink: 0 }} />
              <span style={{ color: DIFF_COLORS[d] }}>{DIFF_LABELS[d]}</span>
              {d === difficulty && (
                <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 10 }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SizeNavbar;