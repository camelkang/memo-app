import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, splitMemo, useMemos } from '@/lib/memos';

export default function MemoListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const memos = useMemos();
  const [query, setQuery] = useState('');

  const keyword = query.trim().toLowerCase();
  const visible = keyword
    ? memos.filter((memo) => memo.text.toLowerCase().includes(keyword))
    : memos;

  return (
    <View style={styles.container}>
      <FlatList
        data={visible}
        keyExtractor={(memo) => memo.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        ListHeaderComponent={
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="검색"
            placeholderTextColor={theme.textSecondary}
            clearButtonMode="while-editing"
            accessibilityLabel="메모 검색"
            style={[styles.search, { backgroundColor: theme.backgroundElement, color: theme.text }]}
          />
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            {keyword ? '검색 결과가 없어요' : '아직 메모가 없어요.\n아래 + 버튼으로 첫 메모를 써 보세요.'}
          </Text>
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.backgroundSelected }]} />
        )}
        renderItem={({ item }) => {
          const { title, preview } = splitMemo(item.text);
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/memo/[id]', params: { id: item.id } })}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: theme.backgroundElement },
              ]}>
              <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
                {title}
              </Text>
              <Text numberOfLines={1} style={[styles.meta, { color: theme.textSecondary }]}>
                {formatDate(item.updatedAt)}
                {preview ? `  ${preview}` : ''}
              </Text>
            </Pressable>
          );
        }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="새 메모"
        onPress={() => router.push({ pathname: '/memo/[id]', params: { id: 'new' } })}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.tint,
            bottom: insets.bottom + Spacing.four,
            opacity: pressed ? 0.8 : 1,
          },
        ]}>
        <Text style={styles.fabLabel}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: {
    marginHorizontal: Spacing.three,
    marginVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 16,
  },
  empty: { textAlign: 'center', marginTop: Spacing.six, fontSize: 15, lineHeight: 22 },
  row: { paddingHorizontal: Spacing.three, paddingVertical: 12, gap: 2 },
  title: { fontSize: 17, fontWeight: '600' },
  meta: { fontSize: 14 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: Spacing.three },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  fabLabel: { color: '#fff', fontSize: 30, lineHeight: 34, fontWeight: '500' },
});
