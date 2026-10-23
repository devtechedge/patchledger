export const metadata = { title: "Terms - PatchLedger" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Terms of service</h1>
      <p className="mt-2 text-xs text-[var(--faint)]">
        Working document - legal review pending before any paid launch.
      </p>
      <div className="mt-6 grid gap-4 text-sm leading-6 text-[var(--muted)]">
        <p>
          PatchLedger is a record-keeping and reporting tool for software maintenance work. It is
          not a security scanner, not an audit, not a certification, and not professional security
          advice. Reports state the scanner, date and scope they were generated from, and nothing
          in the product is a warranty or guarantee of the security of any software.
        </p>
        <p>
          You are responsible for the accuracy of the data you import and the evidence you record.
          Shared links are unlisted but accessible to anyone who has the link; revoke them when
          they should no longer circulate.
        </p>
        <p>
          Cancellation and refunds: during the free pilot there is nothing to cancel or refund.
          When paid billing is enabled, plans are month-to-month, cancellable at any time with
          access until the end of the paid period, and a full refund is available within 14 days
          of a first payment on request.
        </p>
        <p>
          Acceptable use: do not paste data you are not permitted to process, and do not use
          PatchLedger outputs to misrepresent the security posture of any software to any party.
        </p>
      </div>
    </div>
  );
}
