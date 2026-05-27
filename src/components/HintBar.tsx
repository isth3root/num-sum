import React from "react";

interface HintBarProps {
  showFillCounts: boolean;
  onToggleFillCounts: () => void;
  hintUsed: boolean;
  hintRevealMode: boolean;
  onActivateHintReveal: () => void;
  onCancelHintReveal: () => void;
  supportsHints: boolean; // only 7x7, 9x9, 11x11
}

const HintBar: React.FC<HintBarProps> = ({
  showFillCounts,
  onToggleFillCounts,
  hintUsed,
  hintRevealMode,
  onActivateHintReveal,
  onCancelHintReveal,
  supportsHints,
}) => {
  if (!supportsHints) return null;

  return (
    <div className="hint-bar">
      {/* Fill-count toggle */}
      <button
        className={`hint-btn ${showFillCounts ? "hint-btn-active" : ""}`}
        onClick={onToggleFillCounts}
        title="Show how many cells per row/column should be selected"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        <span>Count Hints</span>
        {showFillCounts && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: "var(--accent-2)",
            background: "var(--surface-hover)", borderRadius: 4, padding: "1px 4px",
          }}>ON</span>
        )}
      </button>

      {/* Reveal-cell hint */}
      {hintRevealMode ? (
        <button className="hint-btn hint-btn-reveal-active" onClick={onCancelHintReveal}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>Click a cell…</span>
        </button>
      ) : (
        <button
          className={`hint-btn ${hintUsed ? "hint-btn-disabled" : ""}`}
          onClick={hintUsed ? undefined : onActivateHintReveal}
          title={hintUsed ? "Hint already used" : "Reveal one cell (1 per game)"}
          disabled={hintUsed}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          <span>{hintUsed ? "Hint used" : "Reveal Cell"}</span>
          {!hintUsed && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: "var(--text-muted)",
              background: "var(--surface-hover)", borderRadius: 4, padding: "1px 4px",
            }}>1×</span>
          )}
        </button>
      )}
    </div>
  );
};

export default HintBar;