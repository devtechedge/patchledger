import Link from "next/link";
import { notFound } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { NotFoundError, getProject } from "@/lib/services";
import { SettingsForm } from "@/components/dashboard-forms";
import { Panel } from "@/components/ui";

export const metadata = { title: "Project settings - PatchLedger" };

export default async function SettingsPage({ params }: PageProps<"/p/[id]/settings">) {
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
        <p className="microlabel">Settings</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{project.name}</h1>
      </div>
      <Panel title="Client, stack and SLA targets">
        <SettingsForm
          projectId={project.id}
          clientName={project.clientName}
          stack={project.stack}
          notes={project.notes}
          slaCriticalDays={project.slaCriticalDays}
          slaHighDays={project.slaHighDays}
          slaMediumDays={project.slaMediumDays}
        />
      </Panel>
    </div>
  );
}
