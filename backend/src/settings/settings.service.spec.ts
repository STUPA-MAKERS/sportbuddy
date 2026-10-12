import { BadRequestException } from '@nestjs/common';
import { matchesBlockedPattern, moderationRecipients, normalizeBlockedPattern } from './settings.service';

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
  it('combines moderators who opted in with MODERATION_EMAIL, deduplicated', () => {
    const moderators = [
      { email: 'Anna@hs.de', notify: true },
      { email: 'ben@hs.de', notify: false },
      { email: null, notify: true },
    ];
    expect(moderationRecipients(moderators, 'stupa@hs.de, anna@hs.de;kaputt')).toEqual(['anna@hs.de', 'stupa@hs.de']);
    expect(moderationRecipients([], undefined)).toEqual([]);
  });
});
