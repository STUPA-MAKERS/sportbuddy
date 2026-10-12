import { moderationStatus } from './requests.service';

describe('moderationStatus', () => {
  const base = { hidden: false, active: true, pendingReview: false };

  it('is hidden before anything else', () => {
    expect(moderationStatus({ ...base, hidden: true, active: false }, 4)).toBe('hidden');
  });

  it('is unverified until the email is confirmed', () => {
    expect(moderationStatus({ ...base, active: false }, 1)).toBe('unverified');
  });

  it('needs review with open reports or a pending release', () => {
    expect(moderationStatus(base, 1)).toBe('review');
    expect(moderationStatus({ ...base, pendingReview: true }, 0)).toBe('review');
  });

  it('is online otherwise', () => {
    expect(moderationStatus(base, 0)).toBe('online');
  });
});
