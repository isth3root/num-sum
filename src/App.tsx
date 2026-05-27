import React, { useState } from "react";
import { useGame } from "./hooks/useGame";
import { useTheme } from "./hooks/useTheme";
import { useAppView } from "./hooks/useAppView";
import GameGrid from "./components/GameGrid";
import StatsBar from "./components/StatsBar";
import SizeNavbar from "./components/SizeNavbar";
import ThemePicker from "./components/ThemePicker";
import EndModal from "./components/EndModal";
import AppTabs from "./components/AppTabs";
import DailyScreen from "./components/DailyScreen";
import ModesScreen from "./components/ModesScreen";
import HintBar from "./components/HintBar";

const App: React.FC = () => {
  const game = useGame();
  const { themeId, setThemeId } = useTheme();
  const { view, setView } = useAppView();

  const [showFillCounts, setShowFillCounts] = useState(false);
  const canUseNegative = game.sizeConfig.allowNegative;
  // Fill counts and hints only for 7×7, 9×9, 11×11 (indices 2, 3, 4)
  const supportsHints = game.sizeIndex >= 2;

  return (
    <div className="app-root">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-left">
          <span className="app-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>NumGrid</span>
          </span>
        </div>
        <div className="header-right">
          {view === "standard" && canUseNegative && (
            <button
              className={`neg-toggle ${game.negativeEnabled ? "neg-toggle-on" : ""}`}
              onClick={() => game.setNegativeEnabled(!game.negativeEnabled)}
              title={game.negativeEnabled ? "Negative numbers ON" : "Negative numbers OFF"}
            >
              <span className="neg-toggle-symbol">±</span>
              <span className="neg-toggle-label">
                {game.negativeEnabled ? "Neg On" : "Neg Off"}
              </span>
            </button>
          )}
          {view === "standard" && (
            <button className="new-game-btn" onClick={() => game.resetGame()}>
              New Game
            </button>
          )}
          <ThemePicker themeId={themeId} onSelect={setThemeId} />
        </div>
      </header>

      {/* ── Tab Navigation ── */}
      <AppTabs view={view} onSelect={setView} />

      {/* ── Standard View ── */}
      {view === "standard" && (
        <>
          <SizeNavbar
            sizeIndex={game.sizeIndex}
            difficulty={game.difficulty}
            onSelectSize={game.setSizeIndex}
            onSelectDifficulty={game.setDifficulty}
          />

          <StatsBar
            hearts={game.hearts}
            progress={game.progress}
            time={game.time}
          />

          {/* Hint bar — only for medium/big/large, below the puzzle */}

          <main className="game-area">
            <GameGrid
              puzzle={game.puzzle}
              playerB={game.playerB}
              wrongCells={game.wrongCells}
              blinkingCells={game.blinkingCells}
              onCellClick={game.handleCellClick}
              longPressHandlers={game.longPressHandlers}
              liveRowSums={game.liveRowSums}
              liveColSums={game.liveColSums}
              showFillCounts={supportsHints && showFillCounts}
              hintRevealMode={game.hintRevealMode}
            />
          </main>

          {supportsHints && (
            <div className="hint-section">
              <div className="hint-section-label">Hints</div>
              <HintBar
                showFillCounts={showFillCounts}
                onToggleFillCounts={() => setShowFillCounts(v => !v)}
                hintUsed={game.hintUsed}
                hintRevealMode={game.hintRevealMode}
                onActivateHintReveal={game.activateHintReveal}
                onCancelHintReveal={game.cancelHintReveal}
                supportsHints={supportsHints}
              />
            </div>
          )}

          <div className="hints">
            <span>Left click → Fill</span>
            <span className="hint-sep">·</span>
            <span>Right click / Long press → Erase</span>
          </div>

          {game.gameOver && (
            <EndModal
              showCelebration={game.showCelebration}
              hearts={game.hearts}
              time={game.time}
              progress={game.progress}
              sizeLabel={game.sizeConfig.tag}
              difficulty={game.difficulty}
              onReset={() => game.resetGame()}
            />
          )}
        </>
      )}

      {view === "daily" && <DailyScreen />}
      {view === "modes" && <ModesScreen />}
    </div>
  );
};

export default App;