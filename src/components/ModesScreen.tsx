import React from "react";
import { type StandardMode } from "../types";
import GameGrid from "./GameGrid";
import EndModal from "./EndModal";
import StatsBar from "./StatsBar";
import SizeNavbar from "./SizeNavbar";
import { useSpecialMode } from "../hooks/useSpecialMode";
import IrregularGrid from "./IrregularGrid";
import { useIrregularMode } from "../hooks/useIrregularMode";

const MODE_CARDS: {
  id: StandardMode | "irregular";
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    id: "zen",
    label: "Zen",
    desc: "No hearts lost on mistakes. Relax and solve.",
    color: "#34d399",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
  },
  {
    id: "diagonal",
    label: "Diagonal",
    desc: "Two extra clues: the diagonal sums. Use them!",
    color: "#818cf8",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" />
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    ),
  },
  {
    id: "cage",
    label: "Cage",
    desc: "Cells are grouped into cages with target sums.",
    color: "#f59e0b",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        <line x1="10" y1="6.5" x2="14" y2="6.5" /><line x1="6.5" y1="10" x2="6.5" y2="14" />
      </svg>
    ),
  },
  {
    id: "zerosum",
    label: "Zero Sum",
    desc: "Every row and column must sum to exactly 0.",
    color: "#fb7185",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" /><line x1="8" y1="12" x2="16" y2="12" />
        <line x1="12" y1="8" x2="12" y2="16" />
      </svg>
    ),
  },
  {
    id: "irregular",
    label: "Irregular",
    desc: "The grid is not a square. Predefined or random shapes.",
    color: "#67e8f9",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 3 19 7 19 17 12 21 5 17 5 7" />
      </svg>
    ),
  },
];

type ActiveMode = StandardMode | "irregular";

const ModesScreen: React.FC = () => {
  const [activeMode, setActiveMode] = React.useState<ActiveMode | null>(null);

  const special = useSpecialMode();
  const irregular = useIrregularMode();

  if (!activeMode) {
    return (
      <div className="modes-screen">
        <div className="modes-title">Game Modes</div>
        <div className="modes-subtitle">Choose a variant to play</div>
        <div className="mode-cards">
          {MODE_CARDS.map(card => (
            <button
              key={card.id}
              className="mode-card"
              style={{ "--mode-color": card.color } as React.CSSProperties}
              onClick={() => {
                setActiveMode(card.id);
                if (card.id !== "irregular") special.setMode(card.id as StandardMode);
              }}
            >
              <span className="mode-card-icon" style={{ color: card.color }}>
                {card.icon}
              </span>
              <div className="mode-card-content">
                <span className="mode-card-label">{card.label}</span>
                <span className="mode-card-desc">{card.desc}</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mode-card-arrow">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activeMode === "irregular") {
    return (
      <IrregularModeWrapper
        state={irregular}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  return (
    <SpecialModeWrapper
      state={special}
      mode={activeMode as StandardMode}
      onBack={() => setActiveMode(null)}
    />
  );
};

// ─── Special Mode Wrapper ─────────────────────────────────────────────────────

interface SpecialProps {
  state: ReturnType<typeof useSpecialMode>;
  mode: StandardMode;
  onBack: () => void;
}

const SpecialModeWrapper: React.FC<SpecialProps> = ({ state, mode, onBack }) => {
  const isZen = mode === "zen";

  return (
    <div className="mode-play-screen">
      {/* Back + title */}
      <div className="mode-play-header">
        <button className="mode-back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Modes
        </button>
        <span className="mode-play-title">
          {MODE_CARDS.find(m => m.id === mode)?.label}
        </span>
        <button className="new-game-btn" onClick={state.resetGame}>New</button>
      </div>

      {/* Size nav — same component as standard mode */}
      <SizeNavbar sizeIndex={state.sizeIndex} onSelectSize={state.setSizeIndex} />

      {/* Stats bar — same component as standard mode, ∞ hearts shown for zen */}
      <StatsBar
        hearts={isZen ? 999 : state.hearts}
        progress={state.progress}
        time={state.time}
        zenMode={isZen}
      />

      {/* Diagonal clues */}
      {mode === "diagonal" && state.puzzle.diagMain !== undefined && (
        <div className="diag-clues">
          <span className="diag-clue">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="4" y1="4" x2="20" y2="20" />
            </svg>
            Main diagonal: <strong>{state.puzzle.diagMain}</strong>
          </span>
          <span className="diag-clue">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="20" y1="4" x2="4" y2="20" />
            </svg>
            Anti-diagonal: <strong>{state.puzzle.diagAnti}</strong>
          </span>
        </div>
      )}

      {/* Cage legend */}
      {mode === "cage" && (
        <div className="cage-legend">Dashed outlines = cage groups. Select the right cells to hit each cage target.</div>
      )}

      {/* Zero-sum note */}
      {mode === "zerosum" && (
        <div className="cage-legend">Every row and column must sum to 0. Clues all show 0.</div>
      )}

      <main className="game-area">
        <GameGrid
          puzzle={state.puzzle}
          playerB={state.playerB}
          wrongCells={state.wrongCells}
          blinkingCells={state.blinkingCells}
          onCellClick={state.handleCellClick}
          longPressHandlers={state.longPressHandlers}
          showCageOutlines={mode === "cage"}
          highlightDiagonals={mode === "diagonal"}
          zerosumMode={mode === "zerosum"}
        />
      </main>

      <div className="hints">
        <span>Left click → Fill</span>
        <span className="hint-sep">·</span>
        <span>Right click / Long press → Erase</span>
      </div>

      {state.gameOver && (
        <EndModal
          showCelebration={state.showCelebration}
          hearts={isZen ? 3 : state.hearts}
          time={state.time}
          progress={state.progress}
          onReset={() => state.resetGame()}
        />
      )}
    </div>
  );
};

// ─── Irregular Mode Wrapper ───────────────────────────────────────────────────

interface IrregProps {
  state: ReturnType<typeof useIrregularMode>;
  onBack: () => void;
}

const IrregularModeWrapper: React.FC<IrregProps> = ({ state, onBack }) => {
  const progress = Math.round((state.completedCount / Math.max(state.totalCount, 1)) * 100);

  return (
    <div className="mode-play-screen">
      <div className="mode-play-header">
        <button className="mode-back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Modes
        </button>
        <span className="mode-play-title">Irregular</span>
        <button className="new-game-btn" onClick={state.resetGame}>New</button>
      </div>

      {/* Stats bar — same component as all other modes */}
      <StatsBar
        hearts={state.hearts}
        progress={progress}
        time={state.totalCount}
        cellCountMode
      />

      <main className="game-area">
        <IrregularGrid
          puzzle={state.puzzle}
          playerCells={state.playerCells}
          wrongCells={state.wrongCells}
          blinkingCells={state.blinkingCells}
          onCellClick={state.handleCellClick}
          longPressHandlers={state.longPressHandlers}
        />
      </main>

      <div className="hints">
        <span>Left click → Fill</span>
        <span className="hint-sep">·</span>
        <span>Right click / Long press → Erase</span>
      </div>

      {state.gameOver && (
        <EndModal
          showCelebration={state.showCelebration}
          hearts={state.hearts}
          time={0}
          progress={progress}
          onReset={() => state.resetGame()}
        />
      )}
    </div>
  );
};

export default ModesScreen;