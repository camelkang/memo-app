import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CHECKED, UNCHECKED } from '@/lib/checklist';
import { findSensitive } from '@/lib/sensitive';

type Piece =
  | { kind: 'plain'; text: string }
  | { kind: 'secret'; start: number; text: string }
  | { kind: 'box'; offset: number; text: string };

function split(text: string): Piece[] {
  // Every place the text changes kind: hidden ranges, and the box at the start of checklist lines.
  const marks: Piece[] = [];
  const cuts: { start: number; end: number; piece: Piece }[] = findSensitive(text).map((range) => ({
    ...range,
    piece: { kind: 'secret', start: range.start, text: text.slice(range.start, range.end) },
  }));
  let lineStart = 0;
  for (const line of text.split('\n')) {
    if (line.startsWith(`${UNCHECKED} `) || line.startsWith(`${CHECKED} `)) {
      cuts.push({ start: lineStart, end: lineStart + 1, piece: { kind: 'box', offset: lineStart, text: line[0] } });
    }
    lineStart += line.length + 1;
  }
  cuts.sort((a, b) => a.start - b.start);

  let position = 0;
  for (const cut of cuts) {
    if (cut.start < position) continue;
    if (cut.start > position) marks.push({ kind: 'plain', text: text.slice(position, cut.start) });
    marks.push(cut.piece);
    position = cut.end;
  }
  if (position < text.length) marks.push({ kind: 'plain', text: text.slice(position) });
  return marks;
}

type Props = {
  text: string;
  /** Tapping ordinary text switches to editing. */
  onEdit: () => void;
  onToggleCheck: (offset: number) => void;
};

/**
 * Shows a memo with its sensitive parts hidden. Tapping a hidden part shows it,
 * tapping it again hides it. Used instead of the editor until the user starts editing.
 */
export function MemoReader({ text, onEdit, onToggleCheck }: Props) {
  const theme = useTheme();
  const [shown, setShown] = useState<number[]>([]);

  function toggle(start: number) {
    setShown((current) => (current.includes(start) ? current.filter((item) => item !== start) : [...current, start]));
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text onPress={onEdit} style={[styles.text, { color: theme.text }]}>
        {split(text).map((piece, index) => {
          if (piece.kind === 'plain') return piece.text;
          if (piece.kind === 'box') {
            return (
              <Text key={index} onPress={() => onToggleCheck(piece.offset)} accessibilityRole="checkbox">
                {piece.text}
              </Text>
            );
          }
          const visible = shown.includes(piece.start);
          return (
            <Text
              key={index}
              onPress={() => toggle(piece.start)}
              accessibilityRole="button"
              accessibilityLabel={visible ? `${piece.text}, 눌러서 가리기` : '가려진 정보, 눌러서 보기'}
              style={{ backgroundColor: theme.tintSoft, color: theme.tintInk, fontWeight: '600' }}>
              {visible ? ` ${piece.text} ` : ' •••• 보기 '}
            </Text>
          );
        })}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.three, flexGrow: 1 },
  text: { flexGrow: 1, fontSize: 17, lineHeight: 30 },
});
