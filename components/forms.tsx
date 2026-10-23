"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, signupAction, type AuthState } from "@/app/actions";

const inputCls =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";
const buttonCls =
  "w-full rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-60";

function ErrorBox({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
      {error}
    </p>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signupAction, {});
  return (
    <form action={action} className="grid gap-3">
      <ErrorBox error={state.error} />
      <label className="grid gap-1 text-sm">
        Your name
        <input name="name" required maxLength={120} className={inputCls} autoComplete="name" />
      </label>
      <label className="grid gap-1 text-sm">
        Agency or studio name (optional)
        <input name="agencyName" maxLength={120} className={inputCls} autoComplete="organization" />
      </label>
      <label className="grid gap-1 text-sm">
        Email
        <input name="email" type="email" required maxLength={254} className={inputCls} autoComplete="email" />
      </label>
      <label className="grid gap-1 text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={10}
          maxLength={200}
          className={inputCls}
          autoComplete="new-password"
        />
        <span className="text-xs text-[var(--faint)]">At least 10 characters, with a letter and a number.</span>
      </label>
      <button type="submit" disabled={pending} className={buttonCls} style={{ background: "var(--accent)" }}>
        {pending ? "Creating..." : "Create account"}
      </button>
      <p className="text-center text-sm text-[var(--muted)]">
        Already have an account? <Link href="/login" className="font-semibold" style={{ color: "var(--accent)" }}>Sign in</Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, {});
  return (
    <form action={action} className="grid gap-3">
      <ErrorBox error={state.error} />
      <label className="grid gap-1 text-sm">
        Email
        <input name="email" type="email" required maxLength={254} className={inputCls} autoComplete="email" />
      </label>
      <label className="grid gap-1 text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          maxLength={200}
          className={inputCls}
          autoComplete="current-password"
        />
      </label>
      <button type="submit" disabled={pending} className={buttonCls} style={{ background: "var(--accent)" }}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
