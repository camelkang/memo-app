import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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

  function onChangeText(next: string) {
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
          headerRight: () =>
            id ? (
              <Pressable
                onPress={confirmDelete}
                hitSlop={12}
                accessibilityRole="button"
                style={{ paddingHorizontal: Spacing.two }}>
                <Text style={{ color: armed ? theme.danger : theme.textSecondary, fontSize: 16, fontWeight: '500' }}>
                  {armed ? '한 번 더 눌러 삭제' : '삭제'}
                </Text>
              </Pressable>
            ) : null,
        }}
      />
      <TextInput
        value={text}
        onChangeText={onChangeText}
        multiline
        autoFocus={!id}
        placeholder="메모를 입력하세요"
        placeholderTextColor={theme.textSecondary}
        textAlignVertical="top"
        style={[styles.editor, { color: theme.text }]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  editor: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    fontSize: 17,
    lineHeight: 30,
    outlineWidth: 0,
  },
});
