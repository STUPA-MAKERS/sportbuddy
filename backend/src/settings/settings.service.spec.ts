import { BadRequestException } from '@nestjs/common';
import { matchesBlockedPattern, moderationRecipients, normalizeBlockedPattern, plainAddress } from './settings.service';

describe('blocked email patterns', () => {
  it('matches a full address case-insensitively', () => {
    expect(matchesBlockedPattern('Party.RT@web.de', 'party.rt@web.de')).toBe(true);
    expect(matchesBlockedPattern('other@web.de', 'party.rt@web.de')).toBe(false);
  });

  it('matches a whole domain but not a look-alike', () => {
    expect(matchesBlockedPattern('x@wegwerfmail.de', '*@wegwerfmail.de')).toBe(true);
    expect(matchesBlockedPattern('x@notwegwerfmail.de', '*@wegwerfmail.de')).toBe(false);
  });

  it('normalizes and validates input', () => {
    expect(normalizeBlockedPattern('  *@Spam.DE ')).toBe('*@spam.de');
    expect(() => normalizeBlockedPattern('*@')).toThrow(BadRequestException);
    expect(() => normalizeBlockedPattern('kein@')).toThrow(BadRequestException);
  });
});

describe('moderation recipients', () => {
  const now = Date.parse('2026-10-12T12:00:00Z');
  const recent = new Date(now - 86_400_000);

  it('combines active moderators who opted in with MODERATION_EMAIL, deduplicated', () => {
    const moderators = [
      { email: 'Anna@hs.de', notify: true, lastLoginAt: recent },
      { email: 'ben@hs.de', notify: false, lastLoginAt: recent },
      { email: null, notify: true, lastLoginAt: recent },
      { email: 'alt@hs.de', notify: true, lastLoginAt: new Date(now - 91 * 86_400_000) },
    ];
    expect(moderationRecipients(moderators, 'stupa@hs.de, anna@hs.de;kaputt', now)).toEqual(['anna@hs.de', 'stupa@hs.de']);
    expect(moderationRecipients([], undefined, now)).toEqual([]);
  });

  it('only accepts plain addresses', () => {
    expect(plainAddress(' A.B@hs-reutlingen.de ')).toBe('a.b@hs-reutlingen.de');
    expect(plainAddress('"x"<evil@x.y>')).toBeNull();
    expect(plainAddress('a,evil@x.y')).toBeNull();
    expect(plainAddress(`${'a'.repeat(250)}@x.de`)).toBeNull();
    expect(plainAddress(null)).toBeNull();
  });
});
