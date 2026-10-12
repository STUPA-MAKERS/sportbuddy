import { BadRequestException } from '@nestjs/common';
import { matchesBlockedPattern, normalizeBlockedPattern } from './settings.service';

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
