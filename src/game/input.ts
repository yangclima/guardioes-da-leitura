import type { InputState } from "./core/physics";

type Action = "left" | "right" | "up" | "down" | "jump" | "power";

const KEYMAP: Record<string, Action> = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  Space: "jump",
  KeyX: "power",
  KeyJ: "power",
};

/** Merges keyboard and on-screen touch buttons into one input state. */
export class Input {
  private held = new Set<Action>();
  private touch = new Set<Action>();
  private jumpQueued = false;
  private prevJump = false;
  private powerQueued = false;
  onToggleDebug: (() => void) | null = null;
  onPause: (() => void) | null = null;

  private handleDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
    if (e.code === "KeyH") this.onToggleDebug?.();
    if (e.code === "Escape" || e.code === "KeyP") this.onPause?.();
    const action = KEYMAP[e.code];
    if (!action) return;
    e.preventDefault();
    if ((action === "jump" || action === "up") && !this.held.has(action)) this.jumpQueued = true;
    if (action === "power" && !this.held.has(action)) this.powerQueued = true;
    this.held.add(action);
  };

  private handleUp = (e: KeyboardEvent) => {
    const action = KEYMAP[e.code];
    if (action) this.held.delete(action);
  };

  private handleBlur = () => {
    this.held.clear();
    this.touch.clear();
  };

  attach(): void {
    window.addEventListener("keydown", this.handleDown);
    window.addEventListener("keyup", this.handleUp);
    window.addEventListener("blur", this.handleBlur);
  }

  detach(): void {
    window.removeEventListener("keydown", this.handleDown);
    window.removeEventListener("keyup", this.handleUp);
    window.removeEventListener("blur", this.handleBlur);
  }

  setTouch(action: Action, pressed: boolean): void {
    if (pressed) {
      if ((action === "jump" || action === "up") && !this.touch.has(action)) this.jumpQueued = true;
      if (action === "power" && !this.touch.has(action)) this.powerQueued = true;
      this.touch.add(action);
    } else {
      this.touch.delete(action);
    }
  }

  /** Reads the state for this frame and clears one-shot presses. */
  read(): InputState {
    const has = (a: Action) => this.held.has(a) || this.touch.has(a);
    const jump = has("jump") || has("up");
    const state: InputState = {
      left: has("left"),
      right: has("right"),
      up: has("up"),
      down: has("down"),
      jump,
      jumpPressed: this.jumpQueued || (jump && !this.prevJump),
      powerPressed: this.powerQueued,
    };
    this.jumpQueued = false;
    this.powerQueued = false;
    this.prevJump = jump;
    return state;
  }

  reset(): void {
    this.held.clear();
    this.touch.clear();
    this.jumpQueued = false;
    this.powerQueued = false;
    this.prevJump = false;
  }
}

export type { Action as InputAction };
