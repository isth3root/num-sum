import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatTime } from "../utils/puzzle";

const TOTAL_HEARTS = 3;

interface StatsBarProps {
  hearts: number;
  progress: number;
  time: number;
  zenMode?: boolean;      // show ∞ instead of hearts
  cellCountMode?: boolean; // show "N cells" instead of time
}

const StatsBar: React.FC<StatsBarProps> = ({
  hearts,
  progress,
  time,
  zenMode = false,
  cellCountMode = false,
}) => {
  return (
    <div className="stats-bar">
      {/* Hearts — or ∞ for zen */}
      <div className="hearts-container">
        {zenMode ? (
          <span style={{
            fontSize: 20, fontWeight: 700, color: "var(--heart)",
            fontFamily: "'JetBrains Mono', monospace", lineHeight: 1,
          }}>∞</span>
        ) : (
          <AnimatePresence mode="popLayout">
            {Array.from({ length: TOTAL_HEARTS }).map((_, i) => {
              const active = i < hearts;
              return (
                <motion.svg
                  key={i}
                  width="16" height="16" viewBox="0 0 24 24"
                  fill={active ? "var(--heart)" : "none"}
                  stroke={active ? "var(--heart)" : "var(--text-muted)"}
                  strokeWidth="2"
                  className={`heart-icon ${active ? "heart-active" : "heart-empty"}`}
                  initial={{ scale: 1, opacity: 1 }}
                  animate={active
                    ? { scale: 1, opacity: 1 }
                    : { scale: 0.5, opacity: 0.35 }
                  }
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </motion.svg>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Progress bar */}
      <div className="progress-container">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="progress-label">{progress}%</span>
      </div>

      {/* Timer — or cell count */}
      <div className="timer">
        {cellCountMode ? `${time}c` : formatTime(time)}
      </div>
    </div>
  );
};

export default StatsBar;