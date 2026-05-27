import React from "react";
import { sizeConfigs } from "../data/sizes";

interface SizeNavbarProps {
  sizeIndex: number;
  onSelectSize: (index: number) => void;
}

const SizeNavbar: React.FC<SizeNavbarProps> = ({ sizeIndex, onSelectSize }) => {
  return (
    <nav className="size-navbar">
      {sizeConfigs.map((cfg, i) => (
        <button
          key={cfg.n}
          onClick={() => onSelectSize(i)}
          className={`size-btn ${i === sizeIndex ? "size-btn-active" : ""}`}
        >
          <span className="size-tag">{cfg.tag}</span>
          <span className="size-label">{cfg.label}</span>
          {cfg.allowNegative && (
            <span className="negative-badge">±</span>
          )}
        </button>
      ))}
    </nav>
  );
};

export default SizeNavbar;