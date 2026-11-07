import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createMemo, deleteMemo, formatDate, updateMemo, useMemoById } from '@/lib/memos';

export default function MemoEditorScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  // A new memo is saved only once something is typed, so empty memos don't pile up.
  const [id, setId] = useState(params.id === 'new' ? undefined : params.id);
  const memo = useMemoById(id);
  const [text, setText] = useState(memo?.text ?? '');

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

  function onChangeText(next: string) {
    setText(next);
    if (id) {
      updateMemo(id, next);
    } else if (next.trim()) {
      setId(createMemo(next).id);
    }
  }

  function confirmDelete() {
    Alert.alert('메모를 삭제할까요?', '삭제한 메모는 되돌릴 수 없어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          if (id) deleteMemo(id);
          router.back();
        },
      },
    ]);
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: memo ? formatDate(memo.updatedAt) : '',
          headerRight: () =>
            id ? (
              <Pressable onPress={confirmDelete} hitSlop={12} accessibilityRole="button">
                <Text style={{ color: theme.tint, fontSize: 17 }}>삭제</Text>
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
    padding: Spacing.three,
    fontSize: 17,
    lineHeight: 26,
  },
});
