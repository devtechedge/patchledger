"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, currentAccount, destroySession } from "@/lib/auth";
import { isPasswordStrong } from "@/lib/password";
import { audit } from "@/lib/audit";
import { authenticate, createAccount } from "@/lib/services";
import { LIMITS, rateLimit } from "@/lib/rateLimit";
import { InputError, optionalString, requireString, validEmail } from "@/lib/validation";

export interface AuthState {
  error?: string;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown").slice(0, 60);
}

export async function signupAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  try {
    const ip = await clientIp();
    const rl = await rateLimit(`signup:${ip}`, "signup", LIMITS.signupPerIpPerDay, 86_400_000);
    if (!rl.allowed) {
      return { error: "Too many signups from this network today. Try again tomorrow." };
    }

    const name = requireString(formData.get("name"), "name", { label: "Your name", max: 120 });
    const agencyName = optionalString(formData.get("agencyName"), 120);
    const email = validEmail(requireString(formData.get("email"), "email", { label: "Email", max: 254 }));
    const password = requireString(formData.get("password"), "password", { label: "Password", max: 200 });
    if (!isPasswordStrong(password)) {
      return { error: "Password must be at least 10 characters and include a letter and a number." };
    }

    const account = await createAccount({ email, password, name, agencyName });
    await createSession(account.id);
    redirect("/dashboard");
  } catch (e) {
    if (e instanceof InputError) return { error: e.message };
    // redirect() throws; let it propagate
    throw e;
  }
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  try {
    const ip = await clientIp();
    const email = validEmail(requireString(formData.get("email"), "email", { label: "Email", max: 254 }));
    const password = requireString(formData.get("password"), "password", { label: "Password", max: 200 });

    const rlEmail = await rateLimit(`login:${email}`, "login", LIMITS.loginPerEmailPerHour, 3_600_000);
    const rlIp = await rateLimit(`login:${ip}`, "login", LIMITS.loginPerIpPerHour, 3_600_000);
    if (!rlEmail.allowed || !rlIp.allowed) {
      return { error: "Too many attempts. Wait a few minutes and try again." };
    }

    const account = await authenticate(email, password);
    if (!account) {
      // rate limits above already throttle brute force; no row is written for
      // unknown emails so the audit log cannot be used to enumerate accounts
      return { error: "Email or password is incorrect." };
    }
    await audit(account.id, "login", { meta: { ip } });
    await createSession(account.id);
    redirect("/dashboard");
  } catch (e) {
    if (e instanceof InputError) return { error: e.message };
    throw e;
  }
}

export async function logoutAction(): Promise<void> {
  const account = await currentAccount();
  if (account) {
    await audit(account.id, "logout");
  }
  await destroySession();
  redirect("/login");
}
