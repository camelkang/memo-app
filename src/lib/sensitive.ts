// Finds things in a memo that shouldn't be readable at a glance: account numbers,
// card numbers, resident registration numbers, and passwords written after a label.

export type Range = { start: number; end: number };

const MASK = '••••';

// Digits in groups joined by hyphens or spaces, e.g. 123456-01-234567 or 1234 5678 9012 3456.
const NUMBER = /\d{2,6}(?:[- ]\d{2,7}){1,4}/g;
// "비밀번호: abcd1234". A separator is required so "비밀번호 바꾸기" is left alone.
const SECRET = /(?:비밀번호|비번|암호|패스워드|password|passwd|pw|pin)\s*[:：=]\s*(\S+)/gi;
// 010-1234-5678, 02-123-4567: phone numbers are not hidden.
const PHONE = /^0\d{1,2}[- ]\d{3,4}[- ]\d{4}$/;

const CARD = /^\d{4}(?: \d{4}){3}$/;

function isSensitiveNumber(match: string) {
  if (PHONE.test(match)) return false;
  // Space-separated digits are only hidden when they look like a card number;
  // otherwise parcel tracking numbers and the like would be hidden too.
  if (match.includes(' ')) return CARD.test(match);
  // Dates and times such as 2026-11-11 or 11 30 are short; real numbers are long.
  const digits = match.replace(/\D/g, '').length;
  return digits >= 10 && digits <= 16;
}

/** Ranges of the text to hide, in order, never overlapping. */
export function findSensitive(text: string): Range[] {
  const ranges: Range[] = [];
  for (const match of text.matchAll(NUMBER)) {
    if (isSensitiveNumber(match[0])) ranges.push({ start: match.index, end: match.index + match[0].length });
  }
  for (const match of text.matchAll(SECRET)) {
    const start = match.index + match[0].length - match[1].length;
    ranges.push({ start, end: start + match[1].length });
  }
  ranges.sort((a, b) => a.start - b.start);
  return ranges.filter((range, index) => index === 0 || range.start >= ranges[index - 1].end);
}

/** The text with every sensitive part replaced by dots. */
export function maskText(text: string) {
  let result = '';
  let position = 0;
  for (const range of findSensitive(text)) {
    result += text.slice(position, range.start) + MASK;
    position = range.end;
  }
  return result + text.slice(position);
}
