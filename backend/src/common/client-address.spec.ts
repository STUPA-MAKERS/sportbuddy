import { reporterAddress } from './client-address';

describe('reporterAddress', () => {
  it('keeps IPv4 and unwraps IPv4-mapped IPv6', () => {
    expect(reporterAddress('203.0.113.7')).toBe('203.0.113.7');
    expect(reporterAddress('::ffff:203.0.113.7')).toBe('203.0.113.7');
  });

  it('reduces IPv6 to its /64', () => {
    expect(reporterAddress('2001:db8:1:2:aaaa:bbbb:cccc:dddd')).toBe(
      '2001:db8:1:2::/64',
    );
    expect(reporterAddress('2001:0db8:0001:0002::1')).toBe('2001:db8:1:2::/64');
    expect(reporterAddress('2001:db8::1')).toBe('2001:db8:0:0::/64');
    expect(reporterAddress('fe80::1%eth0')).toBe('fe80:0:0:0::/64');
  });
});
