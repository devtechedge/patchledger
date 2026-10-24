"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAccount, destroySession } from "@/lib/auth";
import { LIMITS, rateLimit } from "@/lib/rateLimit";
import {
  createProject,
  createReport,
  importScan,
  revokeReport,
  transitionFinding,
  updateAccount,
  updateProjectSettings,
  deleteAccount,
  type FindingStatus,
} from "@/lib/services";
import {
  InputError,
  optionalString,
  parseJsonInput,
  requireString,
  validHexColor,
  validSlaDays,
  validUrlOrNull,
} from "@/lib/validation";

export interface DashState {
  error?: string;
  ok?: string;
  link?: string;
}

async function requireAccount() {
  const account = await currentAccount();
  if (!account) redirect("/login");
  return account;
}

export async function createProjectAction(
  _prev: DashState,
  formData: FormData
): Promise<DashState> {
  try {
    const account = await requireAccount();
    const name = requireString(formData.get("name"), "name", { label: "Project name", max: 120 });
    const id = await createProject(account.id, {
      name,
      clientName: optionalString(formData.get("clientName"), 120),
      stack: optionalString(formData.get("stack"), 120),
    });
    redirect(`/p/${id.id}`);
  } catch (e) {
    if (e instanceof InputError) return { error: e.message };
    throw e;
  }
}

export async function importScanAction(
  _prev: DashState,
  formData: FormData
): Promise<DashState> {
  try {
    const account = await requireAccount();
    const projectId = requireString(formData.get("projectId"), "projectId");
    const label = optionalString(formData.get("label"), 200);
    const rl = await rateLimit(`import:${account.id}`, "import", LIMITS.importPerAccountPerHour, 3_600_000);
    if (!rl.allowed) {
      return { error: "Import rate limit reached (20/hour). Try again shortly." };
    }
    const raw = parseJsonInput(formData.get("scannerJson"));
    const outcome = await importScan(account.id, projectId, raw, label);
    revalidatePath(`/p/${projectId}`, "page");
    const parts = [
      `${outcome.total} findings from ${outcome.source}`,
      `${outcome.created} new`,
      `${outcome.updated} refreshed`,
    ];
    if (outcome.reopened) parts.push(`${outcome.reopened} reopened`);
    if (outcome.autoFixed) parts.push(`${outcome.autoFixed} auto-closed (no longer reported)`);
    return { ok: `Imported: ${parts.join(", ")}.` };
  } catch (e) {
    if (e instanceof InputError) return { error: e.message };
    throw e;
  }
}

export async function transitionAction(
  _prev: DashState,
  formData: FormData
): Promise<DashState> {
  try {
    const account = await requireAccount();
    const findingId = requireString(formData.get("findingId"), "findingId");
    const projectId = requireString(formData.get("projectId"), "projectId");
    const toStatus = requireString(formData.get("toStatus"), "toStatus") as FindingStatus;
    await transitionFinding(account.id, findingId, {
      toStatus,
      reason: optionalString(formData.get("reason"), 2000),
      fixUrl: validUrlOrNull(formData.get("fixUrl")),
      fixNote: optionalString(formData.get("fixNote"), 2000) || null,
      fixedInVersion: optionalString(formData.get("fixedInVersion"), 100) || null,
      verifyType: optionalString(formData.get("verifyType"), 40) || null,
      verifyUrl: validUrlOrNull(formData.get("verifyUrl")),
      verifyNote: optionalString(formData.get("verifyNote"), 2000) || null,
    });
    // the finding page and project list render status server-side
    revalidatePath(`/p/${projectId}`, "page");
    revalidatePath(`/p/${projectId}/f/${findingId}`, "page");
    return { ok: `Status updated to "${toStatus}".` };
  } catch (e) {
    if (e instanceof InputError) return { error: e.message };
    throw e;
  }
}

export async function generateReportAction(
  _prev: DashState,
  formData: FormData
): Promise<DashState> {
  try {
    const account = await requireAccount();
    const projectId = requireString(formData.get("projectId"), "projectId");
    const rl = await rateLimit(`report:${account.id}`, "report", LIMITS.reportPerAccountPerHour, 3_600_000);
    if (!rl.allowed) {
      return { error: "Report rate limit reached (15/hour). Try again shortly." };
    }
    const report = await createReport(account.id, projectId, {
      title: optionalString(formData.get("title"), 200),
      periodLabel: optionalString(formData.get("periodLabel"), 80),
      agencyNote: optionalString(formData.get("agencyNote"), 1000),
    });
    revalidatePath(`/p/${projectId}/reports`, "page");
    return { ok: "Report generated.", link: `/r/${report.publicId}` };
  } catch (e) {
    if (e instanceof InputError) return { error: e.message };
    throw e;
  }
}

export async function revokeReportAction(formData: FormData): Promise<void> {
  const account = await requireAccount();
  const reportId = requireString(formData.get("reportId"), "reportId");
  const projectId = await revokeReport(account.id, reportId);
  revalidatePath(`/p/${projectId}/reports`, "page");
}

export async function updateSettingsAction(
  _prev: DashState,
  formData: FormData
): Promise<DashState> {
  try {
    const account = await requireAccount();
    const projectId = requireString(formData.get("projectId"), "projectId");
    await updateProjectSettings(account.id, projectId, {
      clientName: optionalString(formData.get("clientName"), 120),
      stack: optionalString(formData.get("stack"), 120),
      notes: optionalString(formData.get("notes"), 2000),
      slaCriticalDays: validSlaDays(formData.get("slaCriticalDays")),
      slaHighDays: validSlaDays(formData.get("slaHighDays")),
      slaMediumDays: validSlaDays(formData.get("slaMediumDays")),
    });
    revalidatePath(`/p/${projectId}`, "page");
    revalidatePath(`/p/${projectId}/settings`, "page");
    return { ok: "Settings saved." };
  } catch (e) {
    if (e instanceof InputError) return { error: e.message };
    throw e;
  }
}

export async function updateAccountAction(
  _prev: DashState,
  formData: FormData
): Promise<DashState> {
  try {
    const account = await requireAccount();
    await updateAccount(account.id, {
      name: requireString(formData.get("name"), "name", { label: "Your name", max: 120 }),
      agencyName: optionalString(formData.get("agencyName"), 120),
      contactEmail: optionalString(formData.get("contactEmail"), 254) || null,
      accentColor: validHexColor(formData.get("accentColor")),
    });
    revalidatePath("/account", "page");
    return { ok: "Account updated." };
  } catch (e) {
    if (e instanceof InputError) return { error: e.message };
    throw e;
  }
}

export async function deleteAccountAction(
  _prev: DashState,
  formData: FormData
): Promise<DashState> {
  try {
    const account = await requireAccount();
    const confirm = requireString(formData.get("confirm"), "confirm", { label: "Confirmation" });
    if (confirm !== "DELETE") {
      return { error: 'Type DELETE exactly to confirm account deletion.' };
    }
    await deleteAccount(account.id);
  } catch (e) {
    if (e instanceof InputError) return { error: e.message };
    throw e;
  }
  await destroySession();
  redirect("/");
}
