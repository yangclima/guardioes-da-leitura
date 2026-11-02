"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { InputAction } from "@/game/input";
import { haptic } from "./mobile";
import styles from "./touch.module.css";

type OnInput = (action: InputAction, pressed: boolean) => void;
type Dir = "left" | "right" | "up" | "down";

type Props = {
  flight: boolean;
  onInput: OnInput;
};

const EMPTY: ReadonlySet<Dir> = new Set();
/** Fraction of the pad radius where the thumb counts as "resting". */
const RUN_DEAD_ZONE = 0.14;
const FLY_DEAD_ZONE = 0.3;
/** 8 sectors of 45°, starting at "right" and going clockwise (screen y grows down). */
const SECTORS: Dir[][] = [["right"], ["right", "down"], ["down"], ["down", "left"], ["left"], ["left", "up"], ["up"], ["up", "right"]];

function directionsAt(e: PointerEvent<HTMLElement>, vertical: boolean): ReadonlySet<Dir> {
  const rect = e.currentTarget.getBoundingClientRect();
  const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
  const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
  if (!vertical) {
    if (Math.abs(dx) < RUN_DEAD_ZONE) return EMPTY;
    return new Set<Dir>([dx < 0 ? "left" : "right"]);
  }
  if (Math.hypot(dx, dy) < FLY_DEAD_ZONE) return EMPTY;
  const sector = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  return new Set(SECTORS[(sector + 8) % 8]);
}

/**
 * One thumb zone for movement: the finger can slide between directions without
 * lifting (run = left/right pill, flight = 8-way pad).
 */
function DirectionPad({ vertical, onInput }: { vertical: boolean; onInput: OnInput }) {
  const pointerRef = useRef<number | null>(null);
  const dirsRef = useRef<ReadonlySet<Dir>>(EMPTY);
  const [dirs, setDirs] = useState<ReadonlySet<Dir>>(EMPTY);

  const apply = (next: ReadonlySet<Dir>) => {
    const prev = dirsRef.current;
    let isNewPress = false;
    for (const d of prev) if (!next.has(d)) onInput(d, false);
    for (const d of next) {
      if (prev.has(d)) continue;
      onInput(d, true);
      isNewPress = true;
    }
    if (isNewPress) haptic();
    dirsRef.current = next;
    setDirs(next);
  };

  useEffect(() => {
    const store = dirsRef;
    return () => {
      for (const d of store.current) onInput(d, false);
    };
  }, [onInput]);

  const down = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (pointerRef.current !== null) return;
    pointerRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    apply(directionsAt(e, vertical));
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== pointerRef.current) return;
    apply(directionsAt(e, vertical));
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== pointerRef.current) return;
    pointerRef.current = null;
    apply(EMPTY);
  };

  const arrow = (d: Dir, symbol: string) => (
    <span className={`${styles.padArrow} ${styles[`arrow_${d}`]} ${dirs.has(d) ? styles.padArrowOn : ""}`} aria-hidden="true">
      {symbol}
    </span>
  );

  return (
    <div
      className={vertical ? `${styles.dpad} ${styles.dpadFly}` : styles.dpad}
      role="group"
      aria-label={vertical ? "Direção: deslize o dedo para voar" : "Direção: deslize o dedo para andar"}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onLostPointerCapture={up}
      onContextMenu={(e) => e.preventDefault()}
    >
      {arrow("left", "◀")}
      {arrow("right", "▶")}
      {vertical && arrow("up", "▲")}
      {vertical && arrow("down", "▼")}
    </div>
  );
}

function ActionButton({ action, label, symbol, onInput, primary }: { action: InputAction; label: string; symbol: string; onInput: OnInput; primary?: boolean }) {
  const [isPressed, setIsPressed] = useState(false);
  const press = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsPressed(true);
    haptic();
    onInput(action, true);
  };
  const release = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsPressed(false);
    onInput(action, false);
  };
  const classes = [styles.action, primary ? styles.actionPrimary : styles.actionSecondary, isPressed ? styles.actionOn : ""].join(" ");
  return (
    <button
      type="button"
      aria-label={label}
      className={classes}
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

/** On-screen controls for phones and tablets: movement on the left thumb, actions on the right. */
export function TouchControls({ flight, onInput }: Props) {
  return (
    <div className={styles.touch}>
      <DirectionPad key={flight ? "fly" : "run"} vertical={flight} onInput={onInput} />
      <div className={styles.actions}>
        {flight ? (
          <ActionButton action="power" label="Lançar poder" symbol="✦" onInput={onInput} primary />
        ) : (
          <>
            <ActionButton action="power" label="Lançar poder" symbol="✦" onInput={onInput} />
            <ActionButton action="jump" label="Pular" symbol="⤒" onInput={onInput} primary />
          </>
        )}
      </div>
    </div>
  );
}
