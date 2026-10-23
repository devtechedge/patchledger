# Idea Scorecard - security-maintenance hypothesis session

Research executed 2026-10-24 via three parallel agents (buyer pain; competitor pricing; alternatives scan), all URLs checked or dated 2026-10-24 unless noted. Items marked UNVERIFIED could not be confirmed and are not used as decision evidence. This session's starting hypothesis was "PatchProof" (security-maintenance SaaS); the name is TAKEN (active github.com/asseral1012/patchproof fix-verification project Oct 2026; live patchproof.co.uk "Proof-of-Repair"; Devpost entry; SSRN paper). DepProof (depproof.com) and FixProof (fixproof.dev) are also live products. Renamed to PatchLedger (no software product found; only a Task Bounty agent profile and a Chinese math paper).

Scoring: 1-5 per dimension, same rubric as the CareProof scorecard. Pain = documented urgency. WTP = evidence people pay for this today. Recur = how often the need returns. Reach = solo-founder access to buyers without ads. Diff = room to differentiate from named incumbents. Retn = natural stickiness. Marg = cost to serve vs price. Speed = solo build time to real MVP. Excluded up front: website care reports (CareProof, built), n8n handover packs (HandoffKit, built), generic AI wrappers, consumer apps, marketplaces, ad-dependent apps, high-liability security advice, paid-data-API dependence.

| # | Idea | Pain | WTP | Recur | Reach | Diff | Retn | Marg | Speed | Total /40 |
|---|------|------|-----|-------|-------|------|------|------|-------|-----------|
| 1 | PatchLedger: evidence-backed dependency-maintenance tracking + client reports (CHOSEN) | 4 | 3 | 5 | 4 | 4 | 4 | 5 | 4 | 33 |
| 2 | Security questionnaire answering (answer-library + AI draft) for tiny vendors | 5 | 3 | 5 | 4 | 2 | 4 | 3 | 3 | 29 |
| 3 | Pen-test remediation + re-test evidence packs for agencies | 3 | 3 | 2 | 4 | 4 | 2 | 5 | 4 | 27 |
| 4 | Cheap trust center / client assurance portal | 3 | 2 | 4 | 3 | 2 | 4 | 5 | 4 | 27 |
| 5 | SBOM / license deliverable generator | 3 | 2 | 2 | 3 | 3 | 2 | 4 | 3 | 22 |
| 6 | Client-facing SLA attainment reporting | 3 | 2 | 5 | 3 | 2 | 4 | 5 | 4 | 28* |
| 7 | Incident postmortem / outage report generator | 3 | 2 | 2 | 3 | 2 | 2 | 4 | 4 | 22 |
| 8 | Secrets/leak monitoring for client repos | 3 | 2 | 4 | 3 | 2 | 4 | 3 | 3 | 24 |
| 9 | GitHub org security posture monthly reports | 2 | 2 | 4 | 3 | 2 | 3 | 5 | 4 | 25 |
| 10 | Compliance-lite SOC 2 evidence collection | 4 | 3 | 3 | 3 | 2 | 4 | 3 | 2 | 24 |

* Idea 6 scored higher than expected but Hyperping bundles SLA reporting from $74/mo with monitoring included; standalone wedge is thin - folded into PatchLedger's SLA feature.

## Evidence per idea

### 1. PatchLedger (CHOSEN - modified PatchProof hypothesis)
- Pain: flow-down pressure documented (questionnaire threads r/cybersecurity Jun 2024 + ~early 2026, r/SaaS "SOC 2 cost us a $40k deal" 2026-03-13, r/grc 2026-06-09; MSAs with 30-day remediation SLAs: RSI Security, Basis Theory; CISA BOD 19-02 15/30-day baselines; insurer CAQs ask patch process - Trend Micro template). Alert fatigue chronic (HN "Turn Dependabot off" ~2026-02, 647 pts; r/devsecops 2026-06-02 alerts-vs-SLA; r/devops 2025-12-01 microservices noise; GitHub blog 2025-04 admits noise). Counter: many teams disengage ("just never update dependencies"; "Dependabot is good enough" - Safeguard.sh 2026) and SMB-client agencies are rarely asked (CMIT, Klavyus). So pain is real but concentrated in enterprise/regulated-serving agencies.
- WTP: Patchstack ~$69/mo agency tier for WordPress vuln/patch client reports proves the exact artifact class sells (patchstack.com/pricing, checked 2026-10-24; GoDaddy bundles it, 2026-04). Dev-side: Snyk Team $25/dev/mo, Socket $25/seat, Aikido ~EUR 300/mo flat, GHAS $49/committer - small teams pay under protest. Counter: nobody found paying for the tracker layer itself in dev tooling; free ceiling (Dependabot/Renovate/Trivy/OSV-Scanner confirmed free 2026-10-24).
- Recur: monthly retainers + continuous incidents (polyfill 2024-06, Shai-Hulud 2025-09 + 2.0 2025-11, Axios hijack 2026-03, TanStack 2026-05, Red Hat npm 2026-06, ChainDrop 2026-08).
- Reach: r/devsecops, r/agency, r/SaaS, Indie Hackers, direct outreach to agency owners; no ads needed.
- Diff: client-facing proof reports absent from the ENTIRE dev scanner category (checked 2026-10-24: Snyk, GHAS, Socket, Aikido (internal PDF only), Semgrep, Mend, Endor, Corgea, GitGuardian); enterprise VM remediation trackers $24k+/yr median (Vendr/Nucleus) and infra-centric; DefectDojo free but self-hosted, generic, no client reports.
- Retn: monthly report to client creates visible gap if stopped; history accumulates.
- Marg: deterministic parsing, zero AI, zero paid data.
- Speed: solo buildable (this session: MVP built and tested).
- Risks/counterevidence: (a) demand for the evidence artifact in dev tooling is borrowed from adjacent verticals, not yet proven first-person - the weakest link, listed as the #1 interview question; (b) Aikido/Patchstack could add white-label reports quickly; (c) Pixee already sells MSSP white-label remediation (enterprise-quoted); (d) SMB agencies may never be asked.

### 2. Security questionnaire answering (backup #1)
- Pain loudest of all (r/smallbusiness 2026-02-10 "hidden time sink"; r/SaaS 2026-03; r/grc 2026-06; Indie Hackers 2026-04 "we were doing security work; we just couldn't prove it").
- Pricing void: Conveyor free tier excludes automation, enterprise custom (G2 up to ~$9.6k); SafeBase ~$20k/yr (Drata-acquired 2025-02); Vanta ~$7.5-12k/yr. No verified self-serve tier under $100/mo.
- BUT: fast re-crowding (AutorFP, Skysher, Responsive, Bugzero - Bugzero pricing page JS-gated UNVERIFIED), LLM-per-questionnaire cost risk violates margin constraints unless answer-library-first, and AI-drafted answers to security questionnaires carry misrepresentation liability. Diff 2, Marg 3.

### 3. Pen-test remediation packs (backup #2)
- Compliance sources: a fix "counts for nothing without a retest report" (ComplyJet); freelancers sell report+remediation+retest as standard (r/Pentesting ~late 2025). Incumbents serve pentest FIRMS (PlexTrac ~$8-41k/yr Vendr; Dradis $100/user/mo), not the tested agency.
- Weakness: annual/episodic per client; standalone retention poor. Better as a PatchLedger intake mode later (import pen-test findings JSON).

### 4. Trust center
- Real frustration ("drata and vanta get pricey fast" r/cybersecurity ~late 2025) but Conveyor's free trust-center tier anchors price near zero; several small entrants exist. Feature of #2, not a company.

### 5. SBOM/license deliverables
- Regulatory pull is real (EU CRA reporting live 2026-09-11, full 2027-12; IRS Pub 4812 Rev 12-25 expects SBOMs; Mettler-Toledo FOSS terms require supplier SBOMs) but free CLI generators (Syft/Trivy, r/devsecops ~late 2025) + enterprise SCA (FOSSA/Scantist quote-only) squeeze the middle; agency WTP unproven.

### 6. SLA attainment reports
- Hyperping includes SLA reports from Pro $74/mo (page dated 2026-09-16); demand-side threads are buyer/MSP-side. Folded into PatchLedger as SLA tracking.

### 7. Postmortem generators
- Pain real (r/sre 2025-10 "4 hours writing a postmortem") but incident.io ($19-25/user/mo), Rootly, Datadog own the buyer; episodic demand kills standalone subscriptions.

### 8. Secrets/leak monitoring
- GitGuardian free tier covers 25 devs (checked 2026-10-24); paying buyers are enterprise ($40-120k/yr, Vendr). Agencies-not-paying evidence absent.

### 9. GitHub posture reports
- Free ceiling (Allstar, OpenSSF Scorecard, GitHub native overview). Feature, not product.

### 10. Compliance-lite SOC 2
- Drata Foundation ~$7.5k/yr, Vanta ~$7.5-12k/yr, audits $10k+; Comp AI free self-host closes the cheap slot. Trust barrier + long cycles from a solo founder: poor wedge.

## Top-3 detail

### Idea 1: PatchLedger (chosen)
- ICP: 2-30 person dev agencies in US/UK/EU serving enterprise/regulated clients on maintenance retainers; boutique SaaS selling up-market.
- Workaround today: Dependabot alerts ignored or hand-merged; proof-of-work = manual docs/screenshots; Patchstack in WordPress-land.
- Trigger: questionnaire / MSA SLA / incident email / pen-test delivery / SOC 2 flow-down.
- Competitors: free scanners (Dependabot, Renovate, Trivy, OSV-Scanner), paid scanners (Snyk $25/dev, Socket $25/seat, Aikido ~EUR 300/mo flat, GHAS $49/committer), enterprise VM (Nucleus ~$24k+/yr), adjacent proof tools (ManageWP $1/site, Patchstack $69/mo, Pulsetic $9+).
- Wedge: the missing evidence + proof layer between free noisy scanners and enterprise VM, at agency prices, with honest limitations (not a scanner, not an audit).
- Price: Starter $19/mo (3 projects), Studio $49 (15), Agency $99 (50). Annual = 10x monthly.
- Bottom-up $2k MRR path (targets, not a forecast): 8 Agency ($792) + 14 Studio ($686) + 27 Starter ($513) = $1,991/mo. Sequence: 3 paid pilots from direct outreach (weeks 1-2), 10 paying by end of month 2, 49 by month 5 assuming ~3.5% lead-to-paid and low early churn. Every number to be validated, none is evidence.

### Idea 2 backup profile
- ICP: B2B SaaS founders + small vendors selling to enterprises; wedge: answer-library + human-approved AI drafts at $49-99/mo flat; risks: crowding within 12 months, AI cost per customer, misrepresentation liability. Revisit if PatchLedger validation fails.

### Idea 3 backup profile
- Same buyer/GTM as PatchLedger; import pen-test findings, track fix + retest evidence, client deliverable; price per-engagement ($49-99) or bundled. Build as PatchLedger feature rather than standalone.

## Research source log (all checked 2026-10-24)

Pain/flow-down: reddit 1q49z8u, 1ruf7ns (2026-03), 1u1rlmi (2026-06), 1kobhc2 (2025-05), 1pkdnrr (2025-12), 12dy345 (2023), 1f27pa0 (2024); indiehackers 48c3a91c5f (2026-04), 36b7639952; HN 47094192 (~2026-02); r/devsecops 1tuvzcw (2026-06); r/devops 1pam23g (2025-12); github.com/dependabot-core#14675; github.blog prioritization 2025-04; rsisecurity.com/store/master-service-agreement; basistheory.com/resources/master-services-agreement; nucleussec.com SLA blog 2024-01; cisa.gov BOD-19-02; trendmicro.com cyber-insurance CAQ PDF; safe.security vendor questionnaire template; mt.com FOSS-STCP; irs.gov p4812; digital-strategy.ec.europa.eu CRA reporting; joinamply.com maintenance cost guide 2026-08; patchstack.com/for-agencies + /pricing; godaddy.com Patchstack news 2026-04.
Incidents: HN 45260741 (2025-09); unit42 2025-09; cisa alert 2025-09; posthog.com post-mortem 2025-11; openai.com TanStack response 2026-05 (403 on fetch, snippet only - UNVERIFIED detail); arcticwolf Axios 2026-03; redhat RHSB-2026-006 2026-06; microsoft ChainDrop 2026-08; sonatype polyfill 2024-06.
Competitor pricing (official pages): snyk.io/plans; github.com/security/plans + changelog 2025-03; aikido.dev/pricing; socket.dev/pricing; mend.io/pricing + /renovate; endorlabs.com/pricing; semgrep.dev/pricing; trivy.dev; github.com/google/osv-scanner; renovatebot docs; patchstack.com/pricing; corgea.com/pricing; dryrun.security (no public pricing); gitguardian.com/pricing; pixee.ai/pricing; nucleussec pricing + Vendr medians; vendr.com marketplace entries.
Client-report gap: managewp.com/features/client-report; pulsetic.com white-label; ohdear.app; connectsecure.com/for-msps; threatmate.com; vicarius.io patch-verification; defectdojo.com blog; g2.com Aikido reviews (403, snippet).
Alternatives: conveyor.com/pricing; g2.com SafeBase; bugzero.io (JS-gated UNVERIFIED); drata.com SOC 2 cost; vanta.com/pricing; trycomp.ai + github.com/trycompai/comp; hyperping.com/pricing (page dated 2026-09-16); incident.io postmortem guide 2026-02; plextrac.com/pricing; 1up.ai, underdefense.com, getsecureslate.com blog roundups; reddit 1n8uykz, 1ib8fml (2025-02), 1ntxc8j (2025-10), 1whudbj (2026-09), 1wdrv6s (2026-09), 1qky5fq (~2025); openssf.org CRA blog 2025-10-22.
Name collisions: github.com/asseral1012/patchproof; patchproof.co.uk; devpost.com/software/patchproof; depproof.com; fixproof.dev.
