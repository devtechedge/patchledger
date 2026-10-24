import Link from "next/link";
import { notFound } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { NotFoundError, getProject, listReports } from "@/lib/services";
import { revokeReportAction } from "@/app/(dash)/actions";
import { GenerateReportForm } from "@/components/dashboard-forms";
import { Empty, Panel } from "@/components/ui";

export const metadata = { title: "Reports - PatchLedger" };

export default async function ReportsPage({ params }: PageProps<"/p/[id]/reports">) {
  const { id } = await params;
  const account = (await currentAccount())!;
  let project;
  try {
    project = await getProject(account.id, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  const reports = await listReports(account.id, project.id);

  return (
    <div className="grid gap-8">
      <div>
        <Link href={`/p/${project.id}`} className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
          &larr; {project.name}
        </Link>
        <p className="microlabel">Client reports</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{project.name} / reports</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
          Reports freeze the current state at generation time; shared links keep showing exactly
          what was generated. Revoking a link makes it 404 immediately.
        </p>
      </div>

      <Panel title="Generate a report">
        <GenerateReportForm projectId={project.id} />
      </Panel>

      <Panel title="Published and revoked reports">
        {reports.length === 0 ? (
          <Empty>No reports yet. Generate the first one above.</Empty>
        ) : (
          <ul className="grid gap-2">
            {reports.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-xs text-[var(--faint)]">
                    {r.periodLabel} - generated {r.createdAt.toISOString().slice(0, 10)} -{" "}
                    {r.status}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {r.status === "published" ? (
                    <>
                      <Link
                        href={`/r/${r.publicId}`}
                        className="font-semibold underline"
                        style={{ color: "var(--accent)" }}
                      >
                        Open share link
                      </Link>
                      <form action={revokeReportAction}>
                        <input type="hidden" name="reportId" value={r.id} />
                        <button type="submit" className="text-xs text-red-700 hover:underline">
                          Revoke
                        </button>
                      </form>
                    </>
                  ) : (
                    <span className="text-xs text-[var(--faint)]">revoked</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
