import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { UNCHECKED, continueChecklist, findCheckBoxes, toggleCheck } from '@/lib/checklist';
import { useProStatus } from '@/lib/pro';
import { createMemo, deleteMemo, formatDate, updateMemo, useMemoById } from '@/lib/memos';

export default function MemoEditorScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  // A new memo is saved only once something is typed, so empty memos don't pile up.
  const [id, setId] = useState(params.id === 'new' ? undefined : params.id);
  const memo = useMemoById(id);
  const [text, setText] = useState(memo?.text ?? '');
  // Web has no native dialog, so delete asks for a second tap instead.
  const [armed, setArmed] = useState(false);

  // If the user clears a memo and leaves, delete it.
  const latest = useRef({ id, text });
  useEffect(() => {
    latest.current = { id, text };
  }, [id, text]);
  useEffect(() => {
    return () => {
      const { id: lastId, text: lastText } = latest.current;
      if (lastId && !lastText.trim()) deleteMemo(lastId);
    };
  }, []);

  // Opened for a new memo (e.g. from the home-screen shortcut) with the free limit used up.
  const { full } = useProStatus();
  const blocked = !id && full;
  useEffect(() => {
    if (blocked) router.replace('/pro');
  }, [blocked]);

  // Where the cursor is, and where to put it after the app edits the text itself.
  const cursor = useRef(text.length);
  const [forcedCursor, setForcedCursor] = useState<number | undefined>();

  const input = useRef<ComponentRef<typeof TextInput>>(null);

  function moveCursor(position: number) {
    cursor.current = position;
    setForcedCursor(position);
    if (Platform.OS === 'web') {
      // The web text box restores its old cursor after a change, so set it once that is done.
      setTimeout(() => (input.current as unknown as HTMLTextAreaElement)?.setSelectionRange(position, position), 0);
    }
  }

  function onChangeText(typed: string) {
    // Work out where the change ended from the text itself: the cursor event can
    // arrive before or after this one depending on the platform.
    let same = 0;
    const limit = Math.min(text.length, typed.length);
    while (same < limit && text[text.length - 1 - same] === typed[typed.length - 1 - same]) same += 1;
    const end = typed.length - same;
    cursor.current = end;

    const continued = continueChecklist(text, typed, end - 1);
    const next = continued?.text ?? typed;
    if (continued) moveCursor(continued.cursor);
    save(next);
  }

  function onToggleCheck() {
    // Tapping the button can take focus away from the text (it does on web).
    input.current?.focus();
    const edit = toggleCheck(text, Math.min(cursor.current, text.length));
    moveCursor(edit.cursor);
    save(edit.text);
  }

  // Tapping a box in the text flips it. The boxes are found by laying the same
  // text out in a hidden copy, then placing a tap target over each one.
  const [layout, setLayout] = useState<{ text: string; y: number }[]>([]);
  const [scrollY, setScrollY] = useState(0);
  const visualLines =
    Platform.OS === 'web'
      ? // The web preview can't measure wrapped lines, so it assumes none wrap.
        text.split('\n').map((line, index) => ({ text: `${line}\n`, y: index * LINE_HEIGHT }))
      : layout;
  const boxes = findCheckBoxes(text, visualLines);

  function onTapBox(offset: number) {
    save(toggleCheck(text, offset).text);
  }

  function save(next: string) {
    setText(next);
    setArmed(false);
    if (id) {
      updateMemo(id, next);
    } else if (next.trim() && !blocked) {
      setId(createMemo(next).id);
    }
  }

  function remove() {
    if (id) deleteMemo(id);
    router.back();
  }

  function confirmDelete() {
    const title = '메모를 삭제할까요?';
    const message = '삭제한 메모는 되돌릴 수 없어요.';
    if (Platform.OS === 'web') {
      if (armed) remove();
      else setArmed(true);
      return;
    }
    Alert.alert(title, message, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: remove },
    ]);
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: memo ? formatDate(memo.updatedAt) : '',
          headerRight: () => (
            <View style={styles.actions}>
              <Pressable
                onPress={onToggleCheck}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="체크 항목으로 바꾸기, 또는 완료 표시"
                style={{ paddingHorizontal: Spacing.two }}>
                <Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>{UNCHECKED} 체크</Text>
              </Pressable>
              {id ? (
              <Pressable
                onPress={confirmDelete}
                hitSlop={12}
                accessibilityRole="button"
                style={{ paddingHorizontal: Spacing.two }}>
                <Text style={{ color: armed ? theme.danger : theme.textSecondary, fontSize: 16, fontWeight: '500' }}>
                  {armed ? '한 번 더 눌러 삭제' : '삭제'}
                </Text>
              </Pressable>
              ) : null}
            </View>
          ),
        }}
      />
      <View style={styles.container}>
      <Text
        aria-hidden
        importantForAccessibility="no-hide-descendants"
        onTextLayout={(event) => setLayout(event.nativeEvent.lines.map((line) => ({ text: line.text, y: line.y })))}
        style={[styles.editor, styles.mirror]}>
        {text}
      </Text>
      <TextInput
        ref={input}
        onScroll={(event) => setScrollY(event.nativeEvent.contentOffset.y)}
        value={text}
        onChangeText={onChangeText}
        selection={forcedCursor === undefined ? undefined : { start: forcedCursor, end: forcedCursor }}
        onSelectionChange={(event) => {
          cursor.current = event.nativeEvent.selection.start;
          // Hand the cursor back to the user once the app's own move has been applied.
          if (forcedCursor !== undefined) setForcedCursor(undefined);
        }}
        multiline
        autoFocus={!id}
        placeholder="메모를 입력하세요"
        placeholderTextColor={theme.textSecondary}
        textAlignVertical="top"
        style={[styles.editor, { color: theme.text }]}
      />
      <View style={styles.boxes} pointerEvents="box-none">
        {boxes.map((box) => (
          <Pressable
            key={box.offset}
            onPress={() => onTapBox(box.offset)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: box.checked }}
            style={[styles.box, { top: Spacing.three + box.y - scrollY }]}
          />
        ))}
      </View>
      </View>
    </>
  );
}

const LINE_HEIGHT = 30;

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Same size and wrapping as the editor, but invisible and untouchable.
  mirror: { position: 'absolute', top: 0, left: 0, right: 0, flex: 0, opacity: 0, pointerEvents: 'none' },
  boxes: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  // Covers the box character and the margin to its left.
  box: { position: 'absolute', left: 0, width: Spacing.four + 30, height: LINE_HEIGHT },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  editor: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    fontSize: 17,
    lineHeight: LINE_HEIGHT,
    outlineWidth: 0,
  },
});
