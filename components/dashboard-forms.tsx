"use client";

import { useActionState, useState } from "react";
import {
  createProjectAction,
  deleteAccountAction,
  generateReportAction,
  importScanAction,
  transitionAction,
  updateAccountAction,
  updateSettingsAction,
  type DashState,
} from "@/app/(dash)/actions";
import { logoutAction } from "@/app/actions";

const inputCls =
  "w-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]";
const buttonCls =
  "bg-[var(--accent)] px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-ink)] transition-colors hover:brightness-110 disabled:opacity-60";

function Msg({ state }: { state: DashState }) {
  if (state.error) {
    return (
      <p role="alert" className="border border-[var(--bad)] bg-[var(--bad)]/10 px-3 py-2 text-sm text-[var(--bad)]">
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p role="status" className="border border-[var(--good)] bg-[var(--good)]/10 px-3 py-2 text-sm text-[var(--good)]">
        {state.ok}{" "}
        {state.link ? (
          <a href={state.link} className="font-semibold underline" style={{ color: "var(--accent)" }}>
            Open report
          </a>
        ) : null}
      </p>
    );
  }
  return null;
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
        Sign out
      </button>
    </form>
  );
}

export function CreateProjectForm() {
  const [state, action, pending] = useActionState<DashState, FormData>(createProjectAction, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-4 sm:items-end">
      <div className="sm:col-span-4">
        <Msg state={state} />
      </div>
      <label className="grid gap-1 text-sm sm:col-span-2">
        Project name
        <input name="name" required maxLength={120} className={inputCls} placeholder="Client app" />
      </label>
      <label className="grid gap-1 text-sm">
        Client (optional)
        <input name="clientName" maxLength={120} className={inputCls} placeholder="Acme Ltd" />
      </label>
      <label className="grid gap-1 text-sm">
        Stack (optional)
        <input name="stack" maxLength={120} className={inputCls} placeholder="Next.js + Python" />
      </label>
      <div className="sm:col-span-4">
        <button type="submit" disabled={pending} className={buttonCls} style={{ background: "var(--accent)" }}>
          {pending ? "Creating..." : "Add project"}
        </button>
      </div>
    </form>
  );
}

export function ImportForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState<DashState, FormData>(importScanAction, {});
  const [json, setJson] = useState("");
  return (
    <form action={action} className="grid gap-3">
      <Msg state={state} />
      <input type="hidden" name="projectId" value={projectId} />
      <label className="grid gap-1 text-sm">
        Label (optional)
        <input name="label" maxLength={200} className={inputCls} placeholder="monthly audit, Oct 2026" />
      </label>
      <label className="grid gap-1 text-sm">
        Scanner JSON (npm audit --json or osv-scanner --json)
        <textarea
          name="scannerJson"
          required
          rows={12}
          spellCheck={false}
          className={`${inputCls} font-mono text-xs`}
          placeholder='{ "auditReportVersion": 2, ... }'
          value={json}
          onChange={(e) => setJson(e.target.value)}
        />
      </label>
      <label className="grid gap-1 text-xs text-[var(--faint)]">
        ...or load a file (stays in your browser until you submit)
        <input
          type="file"
          accept=".json,application/json"
          className="text-xs"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 2_500_000) {
              alert("File larger than 2.5 MB - paste a trimmed audit instead.");
              e.target.value = "";
              return;
            }
            setJson(await file.text());
          }}
        />
      </label>
      <button type="submit" disabled={pending} className={buttonCls} style={{ background: "var(--accent)" }}>
        {pending ? "Importing..." : "Import scan"}
      </button>
    </form>
  );
}

function TransitionForm({
  findingId,
  projectId,
  toStatus,
  fields,
  submitLabel,
}: {
  findingId: string;
  projectId: string;
  toStatus: string;
  fields?: React.ReactNode;
  submitLabel: string;
}) {
  const [state, action, pending] = useActionState<DashState, FormData>(transitionAction, {});
  return (
    <form action={action} className="grid gap-2 border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <input type="hidden" name="findingId" value={findingId} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="toStatus" value={toStatus} />
      {fields}
      <Msg state={state} />
      <button type="submit" disabled={pending} className={buttonCls} style={{ background: "var(--accent)" }}>
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

const smallInput = `${inputCls} text-xs`;

export function TransitionForms({
  findingId,
  projectId,
  status,
}: {
  findingId: string;
  projectId: string;
  status: string;
}) {
  return (
    <div className="grid gap-4">
      {(status === "open" || status === "in_progress") && (
        <TransitionForm
          findingId={findingId}
          projectId={projectId}
          toStatus={status === "open" ? "in_progress" : "open"}
          submitLabel={status === "open" ? "Start work" : "Back to open"}
        />
      )}
      {(status === "open" || status === "in_progress") && (
        <>
          <TransitionForm
            findingId={findingId}
            projectId={projectId}
            toStatus="fixed"
            submitLabel="Mark fixed (record evidence)"
            fields={
              <>
                <label className="grid gap-1 text-xs">
                  Fix reference (PR / commit / release link)
                  <input name="fixUrl" type="url" className={smallInput} placeholder="https://github.com/..." />
                </label>
                <label className="grid gap-1 text-xs">
                  What changed (required if no link)
                  <textarea name="fixNote" rows={2} maxLength={2000} className={smallInput} />
                </label>
                <label className="grid gap-1 text-xs">
                  Fixed in version (optional)
                  <input name="fixedInVersion" maxLength={100} className={smallInput} placeholder="1.2.3" />
                </label>
              </>
            }
          />
          <TransitionForm
            findingId={findingId}
            projectId={projectId}
            toStatus="false_positive"
            submitLabel="Flag as false positive"
            fields={
              <label className="grid gap-1 text-xs">
                Reason (required - your client can read this)
                <textarea name="reason" rows={2} maxLength={2000} required className={smallInput} />
              </label>
            }
          />
          <TransitionForm
            findingId={findingId}
            projectId={projectId}
            toStatus="accepted"
            submitLabel="Accept risk"
            fields={
              <label className="grid gap-1 text-xs">
                Reason (required - your client can read this)
                <textarea name="reason" rows={2} maxLength={2000} required className={smallInput} />
              </label>
            }
          />
        </>
      )}
      {status === "fixed" && (
        <>
          <TransitionForm
            findingId={findingId}
            projectId={projectId}
            toStatus="verified"
            submitLabel="Mark verified (attach passing run)"
            fields={
              <>
                <label className="grid gap-1 text-xs">
                  Verification type
                  <select name="verifyType" className={smallInput} defaultValue="tests">
                    <option value="tests">Test run</option>
                    <option value="build">Build</option>
                    <option value="deploy_check">Deploy check</option>
                    <option value="manual">Manual check</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs">
                  Run link (CI log, test report)
                  <input name="verifyUrl" type="url" className={smallInput} placeholder="https://..." />
                </label>
                <label className="grid gap-1 text-xs">
                  What was checked (required if no link)
                  <textarea name="verifyNote" rows={2} maxLength={2000} className={smallInput} />
                </label>
              </>
            }
          />
          <TransitionForm
            findingId={findingId}
            projectId={projectId}
            toStatus="open"
            submitLabel="Reopen"
          />
        </>
      )}
      {status === "verified" && (
        <TransitionForm findingId={findingId} projectId={projectId} toStatus="open" submitLabel="Reopen" />
      )}
      {(status === "false_positive" || status === "accepted") && (
        <TransitionForm
          findingId={findingId}
          projectId={projectId}
          toStatus="open"
          submitLabel="Re-triage as open"
        />
      )}
    </div>
  );
}

export function GenerateReportForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState<DashState, FormData>(generateReportAction, {});
  return (
    <form action={action} className="grid gap-3">
      <Msg state={state} />
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Title (optional)
          <input name="title" maxLength={200} className={inputCls} placeholder="Security maintenance report" />
        </label>
        <label className="grid gap-1 text-sm">
          Period label (optional)
          <input name="periodLabel" maxLength={80} className={inputCls} placeholder="October 2026" />
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        Note to client (optional)
        <textarea name="agencyNote" rows={3} maxLength={1000} className={inputCls} />
      </label>
      <button type="submit" disabled={pending} className={buttonCls} style={{ background: "var(--accent)" }}>
        {pending ? "Generating..." : "Generate client report"}
      </button>
    </form>
  );
}

export function SettingsForm({
  projectId,
  clientName,
  stack,
  notes,
  slaCriticalDays,
  slaHighDays,
  slaMediumDays,
}: {
  projectId: string;
  clientName: string;
  stack: string;
  notes: string;
  slaCriticalDays: number;
  slaHighDays: number;
  slaMediumDays: number;
}) {
  const [state, action, pending] = useActionState<DashState, FormData>(updateSettingsAction, {});
  return (
    <form action={action} className="grid gap-3">
      <Msg state={state} />
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Client name
          <input name="clientName" defaultValue={clientName} maxLength={120} className={inputCls} />
        </label>
        <label className="grid gap-1 text-sm">
          Stack
          <input name="stack" defaultValue={stack} maxLength={120} className={inputCls} />
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        Internal notes (never shown in client reports)
        <textarea name="notes" defaultValue={notes} rows={3} maxLength={2000} className={inputCls} />
      </label>
      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="mb-1 text-sm">Remediation SLA (days, 0 = none)</legend>
        <label className="grid gap-1 text-sm">
          Critical
          <input name="slaCriticalDays" type="number" min={0} max={365} defaultValue={slaCriticalDays} className={inputCls} />
        </label>
        <label className="grid gap-1 text-sm">
          High
          <input name="slaHighDays" type="number" min={0} max={365} defaultValue={slaHighDays} className={inputCls} />
        </label>
        <label className="grid gap-1 text-sm">
          Medium
          <input name="slaMediumDays" type="number" min={0} max={365} defaultValue={slaMediumDays} className={inputCls} />
        </label>
      </fieldset>
      <button type="submit" disabled={pending} className={buttonCls} style={{ background: "var(--accent)" }}>
        {pending ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}

export function AccountForm({
  name,
  agencyName,
  contactEmail,
  accentColor,
}: {
  name: string;
  agencyName: string;
  contactEmail: string;
  accentColor: string;
}) {
  const [state, action, pending] = useActionState<DashState, FormData>(updateAccountAction, {});
  return (
    <form action={action} className="grid gap-3">
      <Msg state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Your name
          <input name="name" defaultValue={name} required maxLength={120} className={inputCls} />
        </label>
        <label className="grid gap-1 text-sm">
          Agency name (appears on reports)
          <input name="agencyName" defaultValue={agencyName} maxLength={120} className={inputCls} />
        </label>
        <label className="grid gap-1 text-sm">
          Contact email on reports (optional)
          <input name="contactEmail" type="email" defaultValue={contactEmail} maxLength={254} className={inputCls} />
        </label>
        <label className="grid gap-1 text-sm">
          Accent color
          <input name="accentColor" defaultValue={accentColor} className={inputCls} placeholder="#2563eb" />
        </label>
      </div>
      <button type="submit" disabled={pending} className={buttonCls} style={{ background: "var(--accent)" }}>
        {pending ? "Saving..." : "Save account"}
      </button>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<DashState, FormData>(deleteAccountAction, {});
  return (
    <form action={action} className="grid gap-3">
      <Msg state={state} />
      <label className="grid gap-1 text-sm">
        Type DELETE to permanently remove your account, projects, findings and reports
        <input name="confirm" className={inputCls} placeholder="DELETE" autoComplete="off" />
      </label>
      <button type="submit" disabled={pending} className="border border-[var(--bad)] px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bad)] hover:bg-[var(--bad)]/10 disabled:opacity-60">
        {pending ? "Deleting..." : "Delete my account"}
      </button>
    </form>
  );
}
