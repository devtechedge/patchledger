# Discovery Interview Script (10 minutes)

Goal: test the three UNVERIFIED assumptions from VALIDATION_LOG.md before selling anything. Do not pitch before question 6.

1. How do you handle dependency updates and vulnerability alerts for client projects today? (listen for: Dependabot on/off, who triages, how often)
2. When a big supply-chain incident hits (Shai-Hulud, the Axios hijack), what happens on your side? Do clients email you? What do you send back?
3. Have any clients sent security questionnaires, required remediation SLAs in contracts, or asked for SOC 2 evidence? What did you do?
4. When you do maintenance work monthly, how do you show the client it happened? (docs? screenshots? nothing?)
5. What has been the most painful client conversation about security or maintenance? [story time - shut up and listen]
6. (only if pain is real) We built PatchLedger: you paste npm audit / osv-scanner JSON, it tracks every advisory with fix evidence and verified test runs, and generates a branded monthly report with SLA status you can send the client. Here's a sample: [link]. Would that have helped in the story you just told?
7. If it saved you one client-facing scramble per quarter, what would that be worth monthly? [price test: react to $19 / $49 / $99]
8. Would you pilot it free for a month on one real client project? [if yes: get the project + follow-up date]

Code the answers: price / trust / already-covered / no-client-pressure / workflow-fit. Log in EXPERIMENTS.md same day.

## Outreach message skeleton (personalize the bracketed parts; one specific observation per message, never bulk-sent)

Subject: [client-name]'s security questions - how you handle them

Hi [name] - saw [specific thing: agency's client work / their r/devsecops comment / job post]. Quick question from building in this space: when enterprise clients send security questionnaires or a dependency CVE makes the news, what do you send back? We kept hearing "screenshots and a Google Doc", so we built a tool that turns npm audit / osv-scanner output into a tracked fix log (with actual test-run evidence) and a branded monthly report: [sample link]. If that resonates, I'd value 10 minutes of your reality check - and if not, tell me why and I'll stop building the wrong thing.

Rules: no false claims, no invented traction, no "I noticed you use X" fabrications, unsubscribe-by-reply stated in the first follow-up at the latest.
