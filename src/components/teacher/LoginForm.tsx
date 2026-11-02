"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/apiClient";
import styles from "../site.module.css";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSending(true);
    setError("");
    try {
      await api("/api/auth/login", { method: "POST", json: { password } });
      router.replace("/professor/painel");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.stack}>
      <label className="field">
        <span>Senha</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required autoFocus />
      </label>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={isSending}>
        {isSending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
