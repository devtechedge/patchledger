"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, signupAction, type AuthState } from "@/app/actions";

const inputCls =
  "w-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]";
const buttonCls =
  "w-full bg-[var(--accent)] px-3 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-ink)] transition-colors hover:brightness-110 disabled:opacity-60";

function ErrorBox({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p role="alert" className="border border-[var(--bad)] bg-[var(--bad)]/10 px-3 py-2 text-sm text-[var(--bad)]">
      {error}
    </p>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signupAction, {});
  return (
    <form action={action} className="grid gap-4">
      <ErrorBox error={state.error} />
      <label className="grid gap-1.5 text-sm">
        <span className="microlabel">Your name</span>
        <input name="name" required maxLength={120} className={inputCls} autoComplete="name" />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="microlabel">Agency or studio (optional)</span>
        <input name="agencyName" maxLength={120} className={inputCls} autoComplete="organization" />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="microlabel">Email</span>
        <input name="email" type="email" required maxLength={254} className={inputCls} autoComplete="email" />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="microlabel">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={10}
          maxLength={200}
          className={inputCls}
          autoComplete="new-password"
        />
        <span className="font-mono text-xs text-[var(--faint)]">10+ characters, one letter, one number.</span>
      </label>
      <button type="submit" disabled={pending} className={buttonCls}>
        {pending ? "Creating..." : "Create account"}
      </button>
      <p className="text-center text-sm text-[var(--muted)]">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-[var(--accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, {});
  return (
    <form action={action} className="grid gap-4">
      <ErrorBox error={state.error} />
      <label className="grid gap-1.5 text-sm">
        <span className="microlabel">Email</span>
        <input name="email" type="email" required maxLength={254} className={inputCls} autoComplete="email" />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="microlabel">Password</span>
        <input
          name="password"
          type="password"
          required
          maxLength={200}
          className={inputCls}
          autoComplete="current-password"
        />
      </label>
      <button type="submit" disabled={pending} className={buttonCls}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
