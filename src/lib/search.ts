// Korean search: matches normal text, and also initial consonants (초성).
// "ㄱㅈㅂㅎ" finds "계좌번호"; mixing works too: "계ㅈ" finds "계좌".

const CHOSEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];
const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

function choseongOf(char: string): string | null {
  const code = char.charCodeAt(0);
  if (code < HANGUL_START || code > HANGUL_END) return null;
  return CHOSEONG[Math.floor((code - HANGUL_START) / 588)];
}

function isChoseong(char: string) {
  return CHOSEONG.includes(char);
}

function charMatches(queryChar: string, textChar: string) {
  if (queryChar === textChar) return true;
  return isChoseong(queryChar) && choseongOf(textChar) === queryChar;
}

/** Start index of the first match of `query` in `text`, or -1. Case-insensitive. */
export function findMatch(text: string, query: string): number {
  const haystack = text.toLowerCase();
  const needle = query.trim().toLowerCase();
  if (!needle) return -1;
  // Fast path: no initial consonants in the query.
  if (![...needle].some(isChoseong)) return haystack.indexOf(needle);
  const last = haystack.length - needle.length;
  for (let start = 0; start <= last; start++) {
    let matched = true;
    for (let offset = 0; offset < needle.length; offset++) {
      if (!charMatches(needle[offset], haystack[start + offset])) {
        matched = false;
        break;
      }
    }
    if (matched) return start;
  }
  return -1;
}

export function matches(text: string, query: string) {
  return findMatch(text, query) !== -1;
}
