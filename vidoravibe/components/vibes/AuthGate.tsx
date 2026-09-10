"use client";
import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { apiRequest } from "@/lib/api/client";

export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "signed-in" | "signed-out">("loading");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    const signedOut = () => { if (alive) setState("signed-out"); };
    window.addEventListener("vidoravibe:unauthorized", signedOut);
    apiRequest("/api/v1/auth/session").then(() => { if (alive) setState("signed-in"); }).catch(signedOut);
    return () => { alive = false; window.removeEventListener("vidoravibe:unauthorized", signedOut); };
  }, []);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiRequest<{ token: string }>("/api/v1/auth/login", {
        method: "POST", body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      localStorage.setItem("token", result.token);
      setState("signed-in");
    } catch (err) { setError(err instanceof Error ? err.message : "Sign-in failed."); }
    finally { setBusy(false); }
  }
  if (state === "loading") return <p className="p-12 text-center text-zinc-600" role="status">Checking your VidoraHub session…</p>;
  if (state === "signed-in") return <>{children}<div className="mx-auto max-w-6xl px-6 py-6"><button className="text-sm text-zinc-500 underline" onClick={() => { localStorage.removeItem("token"); setState("signed-out"); }}>Sign out of this browser</button></div></>;
  return <main className="mx-auto my-16 w-full max-w-md px-5"><form onSubmit={login} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
    <p className="text-xs font-bold uppercase tracking-widest text-teal-700">VidoraHub × VidoraVibe</p>
    <h1 className="text-3xl font-semibold">Your next great clip starts here.</h1>
    <p className="text-sm leading-6 text-zinc-600">Sign in with your existing VidoraHub account to create and manage your clips.</p>
    <label className="block text-sm font-medium">Email<input name="email" type="email" autoComplete="username" required className="mt-2 min-h-12 w-full rounded-lg border border-zinc-300 px-3" /></label>
    <label className="block text-sm font-medium">Password<input name="password" type="password" autoComplete="current-password" required className="mt-2 min-h-12 w-full rounded-lg border border-zinc-300 px-3" /></label>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    <button disabled={busy} className="min-h-12 w-full rounded-lg bg-teal-700 font-semibold text-white disabled:opacity-50">{busy ? "Signing in…" : "Continue with VidoraHub"}</button>
  </form></main>;
}
