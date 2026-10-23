export interface PlanDef {
  key: string;
  label: string;
  priceUsd: number;
  projects: number;
  blurb: string;
}

export const PLANS: Record<string, PlanDef> = {
  starter: {
    key: "starter",
    label: "Starter",
    priceUsd: 19,
    projects: 3,
    blurb: "3 client projects, unlimited imports, shareable reports.",
  },
  studio: {
    key: "studio",
    label: "Studio",
    priceUsd: 49,
    projects: 15,
    blurb: "15 client projects, custom branding, SLA tracking.",
  },
  agency: {
    key: "agency",
    label: "Agency",
    priceUsd: 99,
    projects: 50,
    blurb: "50 client projects, priority support, evidence exports.",
  },
  demo: {
    key: "demo",
    label: "Demo",
    priceUsd: 0,
    projects: 3,
    blurb: "Read-mostly demo workspace.",
  },
};

export function planFor(key: string | undefined | null): PlanDef {
  return PLANS[key ?? "starter"] ?? PLANS.starter;
}
