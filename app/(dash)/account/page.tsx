import { currentAccount } from "@/lib/auth";
import { getAccountProfile, listAuditEvents } from "@/lib/services";
import { planFor } from "@/lib/plans";
import { AccountForm, DeleteAccountForm } from "@/components/dashboard-forms";
import { Panel } from "@/components/ui";

export const metadata = { title: "Account - PatchLedger" };

export default async function AccountPage() {
  const account = (await currentAccount())!;
  const profile = await getAccountProfile(account.id);
  const events = await listAuditEvents(account.id, 20);
  const plan = planFor(profile.plan);

  return (
    <div className="grid max-w-2xl gap-6">
      <div>
        <p className="microlabel">Account</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{profile.email}</h1>
        <p className="mt-1 font-mono text-xs text-[var(--faint)]">
          {plan.label} plan - {plan.projects} projects
        </p>
      </div>

      <Panel title="Branding used on reports">
        <AccountForm
          name={profile.name}
          agencyName={profile.agencyName}
          contactEmail={profile.contactEmail ?? ""}
          accentColor={profile.accentColor}
        />
      </Panel>

      <Panel title="Recent activity (audit trail)">
        {events.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nothing recorded yet.</p>
        ) : (
          <ul className="grid gap-1 text-xs text-[var(--muted)]">
            {events.map((e) => (
              <li key={e.id} className="flex justify-between gap-3">
                <span>{e.action.replace("_", " ")}</span>
                <span className="font-mono">{e.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Danger zone">
        <DeleteAccountForm />
      </Panel>
    </div>
  );
}
