import Link from "next/link";
import { notFound } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { NotFoundError, getProject } from "@/lib/services";
import { ImportForm } from "@/components/dashboard-forms";
import { Panel } from "@/components/ui";

export const metadata = { title: "Import scan - PatchLedger" };

export default async function ImportPage({ params }: PageProps<"/p/[id]/import">) {
  const { id } = await params;
  const account = (await currentAccount())!;
  let project;
  try {
    project = await getProject(account.id, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  return (
    <div className="grid max-w-2xl gap-6">
      <div>
        <Link href={`/p/${project.id}`} className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
          &larr; {project.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Import scanner output</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Run one of these in your project and paste the JSON. PatchLedger never needs repo access:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs">
{`npm audit --json > audit.json
# or, multi-ecosystem:
osv-scanner --json > osv.json`}
        </pre>
      </div>
      <Panel title="Paste output">
        <ImportForm projectId={project.id} />
      </Panel>
      <p className="text-xs text-[var(--faint)]">
        Re-importing the same source later updates findings: reappearing advisories reopen, and
        advisories the same scanner no longer reports auto-close as fixed (never verified - that
        always requires an attached test/build run).
      </p>
    </div>
  );
}
