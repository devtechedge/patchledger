/**
 * Outbound email interface. The console transport is the only one wired:
 * choosing a real provider (and its region/compliance settings) is an open
 * decision recorded in docs/NEXT_ACTIONS.md. Password-reset links are logged
 * server-side only until then.
 */
export interface Mailer {
  send(to: string, subject: string, body: string): Promise<void>;
}

function consoleMailer(): Mailer {
  return {
    async send(to, subject, body) {
      console.log(`[mailer:console] to=${to} subject="${subject}"\n${body}`);
    },
  };
}

export const mailer: Mailer = consoleMailer();
