import { ago, daysLeft, isThisWeek, plural } from './format';

describe('format', () => {
  const now = new Date(2026, 9, 12, 15, 0);

  it('says heute, gestern and days', () => {
    expect(ago(new Date(2026, 9, 12, 8, 0), now)).toBe('heute');
    expect(ago(new Date(2026, 9, 11, 23, 0), now)).toBe('gestern');
    expect(ago(new Date(2026, 9, 7, 10, 0), now)).toBe('5 T.');
    expect(ago(new Date(2026, 8, 20, 10, 0), now)).toBe('3 Wo.');
  });

  it('counts days left and never below zero', () => {
    expect(daysLeft(new Date(2026, 9, 14, 15, 0), now)).toBe(2);
    expect(daysLeft(new Date(2026, 9, 1), now)).toBe(0);
    expect(daysLeft(null, now)).toBeNull();
  });

  it('groups the last seven days as this week', () => {
    expect(isThisWeek(new Date(2026, 9, 6, 9, 0), now)).toBe(true);
    expect(isThisWeek(new Date(2026, 9, 5, 9, 0), now)).toBe(false);
  });

  it('pluralises', () => {
    expect(plural(1, 'Meldung', 'Meldungen')).toBe('1 Meldung');
    expect(plural(3, 'Meldung', 'Meldungen')).toBe('3 Meldungen');
  });
});
