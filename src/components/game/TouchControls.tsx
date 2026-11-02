"use client";

import type { PointerEvent } from "react";
import type { InputAction } from "@/game/input";
import styles from "./game.module.css";

type Props = {
  flight: boolean;
  onInput: (action: InputAction, pressed: boolean) => void;
};

function Pad({ action, label, symbol, onInput, wide }: { action: InputAction; label: string; symbol: string; onInput: Props["onInput"]; wide?: boolean }) {
  const press = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    onInput(action, true);
  };
  const release = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onInput(action, false);
  };
  return (
    <button
      type="button"
      aria-label={label}
      className={wide ? `${styles.pad} ${styles.padWide}` : styles.pad}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
    >
      {symbol}
    </button>
  );
}

/** On-screen buttons for phones and tablets. */
export function TouchControls({ flight, onInput }: Props) {
  return (
    <div className={styles.touch}>
      <div className={styles.touchGroup}>
        <Pad action="left" label="Esquerda" symbol="◀" onInput={onInput} />
        <Pad action="right" label="Direita" symbol="▶" onInput={onInput} />
      </div>
      <div className={styles.touchGroup}>
        {flight ? (
          <>
            <Pad action="up" label="Subir" symbol="▲" onInput={onInput} />
            <Pad action="down" label="Descer" symbol="▼" onInput={onInput} />
            <Pad action="power" label="Lançar poder" symbol="✦" onInput={onInput} wide />
          </>
        ) : (
          <>
            <Pad action="jump" label="Pular" symbol="⤒" onInput={onInput} wide />
            <Pad action="power" label="Lançar poder" symbol="✦" onInput={onInput} />
          </>
        )}
      </div>
    </div>
  );
}
