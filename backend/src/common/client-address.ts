import { isIPv6 } from 'net';

/**
 * The part of a client address that stands for one reporter. One IPv6 connection usually gets a
 * whole /64, so only that prefix counts; IPv4-mapped addresses count as plain IPv4.
 */
export function reporterAddress(ip: string): string {
  const address = ip.split('%')[0];
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(address);
  if (mapped) return mapped[1];
  if (!isIPv6(address)) return address;
  const [head, tail] = address.split('::');
  const front = head ? head.split(':') : [];
  const back = tail ? tail.split(':') : [];
  const backLength = back.reduce(
    (n, part) => n + (part.includes('.') ? 2 : 1),
    0,
  );
  const groups =
    tail === undefined
      ? front
      : [...front, ...Array(8 - front.length - backLength).fill('0'), ...back];
  return `${groups
    .slice(0, 4)
    .map((g) => parseInt(g, 16).toString(16))
    .join(':')}::/64`;
}
