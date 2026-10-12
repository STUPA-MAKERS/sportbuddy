export const KNOWLEDGE_LEVELS = ['Anfänger', 'Fortgeschritten', 'Profi'] as const;

export const GENDER_OPTIONS = ['Männlich', 'Weiblich', 'Divers'] as const;

/** Reasons a visitor can pick when reporting a request. */
export const REPORT_REASONS = [
  'Keine Sportanfrage',
  'Werbung oder Spam',
  'Unangemessen',
  'Sonstiges',
] as const;

/** Reasons a moderator can pick when hiding a request. */
export const HIDE_REASONS = [
  'Keine Sportanfrage',
  'Werbung',
  'Unangemessen',
  'Doppelt',
  'Sonstiges',
] as const;
