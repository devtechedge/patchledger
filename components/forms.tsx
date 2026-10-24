"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  loginAction,
  requestResetAction,
  resetPasswordAction,
  signupAction,
  waitlistAction,
  type AuthState,
  type NeutralState,
} from "@/app/actions";

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

function NeutralBox({ state, message }: { state: NeutralState; message: string }) {
  if (state.error) {
    return (
      <p role="alert" className="border border-[var(--bad)] bg-[var(--bad)]/10 px-3 py-2 text-sm text-[var(--bad)]">
        {state.error}
      </p>
    );
  }
  if (state.done) {
    return (
      <p role="status" className="border border-[var(--good)] bg-[var(--good)]/10 px-3 py-2 text-sm text-[var(--good)]">
        {message}
      </p>
    );
  }
  return null;
}

export function RequestResetForm() {
  const [state, action, pending] = useActionState<NeutralState, FormData>(requestResetAction, {});
  return (
    <form action={action} className="grid gap-4">
      <NeutralBox
        state={state}
        message="If that address has an account, a reset link is on its way. Check your inbox in a minute or two."
      />
      {!state.done && (
        <>
          <label className="grid gap-1.5 text-sm">
            <span className="microlabel">Email</span>
            <input name="email" type="email" required maxLength={254} className={inputCls} autoComplete="email" />
          </label>
          <button type="submit" disabled={pending} className={buttonCls}>
            {pending ? "Sending..." : "Send reset link"}
          </button>
        </>
      )}
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<NeutralState, FormData>(resetPasswordAction, {});
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      <NeutralBox state={state} message="Password updated. All other sessions were signed out." />
      {state.done ? (
        <Link href="/login" className="text-center font-semibold text-[var(--accent)] hover:underline">
          Sign in with your new password
        </Link>
      ) : (
        <>
          <label className="grid gap-1.5 text-sm">
            <span className="microlabel">New password</span>
            <input name="password" type="password" required minLength={10} maxLength={200} className={inputCls} autoComplete="new-password" />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="microlabel">Confirm new password</span>
            <input name="confirm" type="password" required minLength={10} maxLength={200} className={inputCls} autoComplete="new-password" />
          </label>
          <button type="submit" disabled={pending} className={buttonCls}>
            {pending ? "Updating..." : "Update password"}
          </button>
        </>
      )}
    </form>
  );
}

export function WaitlistForm() {
  const [state, action, pending] = useActionState<NeutralState, FormData>(waitlistAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="source" value="landing" />
      <label className="sr-only" htmlFor="waitlist-email">Email</label>
      <input
        id="waitlist-email"
        name="email"
        type="email"
        required
        maxLength={254}
        placeholder="you@agency.com"
        className="min-w-0 flex-1 border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="border border-[var(--accent)] px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] disabled:opacity-60"
      >
        {pending ? "..." : state.done ? "On the list" : "Get pilot access"}
      </button>
      {state.error ? (
        <p role="alert" className="w-full border border-[var(--bad)] bg-[var(--bad)]/10 px-3 py-2 text-sm text-[var(--bad)]">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
