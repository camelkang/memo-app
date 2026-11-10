import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, groupByDate, splitMemo, useMemoStatus, useMemos } from '@/lib/memos';
import { findMatch, matches } from '@/lib/search';

export default function MemoListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const memos = useMemos();
  const status = useMemoStatus();
  const [query, setQuery] = useState('');

  const keyword = query.trim();
  const visible = keyword ? memos.filter((memo) => matches(memo.text, keyword)) : memos;
  const sections = keyword
    ? visible.length > 0
      ? [{ title: `메모 ${visible.length}개를 찾았어요`, data: visible }]
      : []
    : groupByDate(visible);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundGrouped }]}>
      <SectionList
        sections={sections}
        keyExtractor={(memo) => memo.id}
        stickySectionHeadersEnabled={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 28,
          paddingBottom: insets.bottom + 112,
          paddingHorizontal: Spacing.three,
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text accessibilityRole="header" style={[styles.screenTitle, { color: theme.text }]}>
                메모
              </Text>
              <Pressable
                onPress={() => router.push('/settings')}
                accessibilityRole="button"
                style={styles.settingsButton}>
                <Text style={[styles.settingsLabel, { color: theme.textSecondary }]}>설정</Text>
              </Pressable>
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="메모 검색 · 초성도 돼요 (ㄱㅈ)"
              placeholderTextColor={theme.textSecondary}
              clearButtonMode="while-editing"
              accessibilityLabel="메모 검색"
              style={[styles.search, { backgroundColor: theme.card, color: theme.text }]}
            />
          </View>
        }
        ListEmptyComponent={
          status === 'loading' ? undefined : (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              {status === 'error'
                ? '메모를 열지 못했어요.\n이 폰에 저장된 암호 열쇠를 찾을 수 없어요.\n앱을 완전히 닫았다가 다시 열어 주세요.'
                : keyword
                  ? '찾는 메모가 없어요'
                  : '아직 메모가 없어요.\n아래 새 메모 버튼으로 첫 메모를 적어 보세요.'}
            </Text>
          )
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{section.title}</Text>
        )}
        renderItem={({ item, index, section }) => {
          const { title, preview } = splitMemo(item.text);
          const first = index === 0;
          const last = index === section.data.length - 1;
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/memo/[id]', params: { id: item.id } })}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: pressed ? theme.backgroundSelected : theme.card },
                first && styles.rowFirst,
                last && styles.rowLast,
              ]}>
              <View style={styles.rowTop}>
                <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
                  {highlight(title, keyword, { backgroundColor: theme.tintSoft, color: theme.tintInk })}
                </Text>
                <Text style={[styles.when, { color: theme.textSecondary }]}>
                  {formatDate(item.updatedAt)}
                </Text>
              </View>
              {preview ? (
                <Text numberOfLines={1} style={[styles.preview, { color: theme.textSecondary }]}>
                  {preview}
                </Text>
              ) : null}
            </Pressable>
          );
        }}
      />

      {status === 'ready' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="새 메모"
          onPress={() => router.push({ pathname: '/memo/[id]', params: { id: 'new' } })}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: theme.tint,
              bottom: insets.bottom + 28,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}>
          <Text style={styles.fabPlus}>+</Text>
          <Text style={styles.fabLabel}>새 메모</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Wraps the part of `text` that matches the search in a highlighted span. */
function highlight(text: string, keyword: string, style: { backgroundColor: string; color: string }) {
  const start = keyword ? findMatch(text, keyword) : -1;
  if (start === -1) return text;
  const end = start + keyword.length;
  return (
    <>
      {text.slice(0, start)}
      <Text style={style}>{text.slice(start, end)}</Text>
      {text.slice(end)}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { gap: Spacing.three, marginBottom: Spacing.two },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingsButton: { minWidth: 48, height: 48, paddingHorizontal: Spacing.two, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { fontSize: 16, fontWeight: '600' },
  screenTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8, marginHorizontal: Spacing.two },
  search: {
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 16,
    fontSize: 16,
    outlineWidth: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    marginHorizontal: Spacing.two,
  },
  empty: { textAlign: 'center', marginTop: Spacing.six, fontSize: 15, lineHeight: 24 },
  row: { paddingHorizontal: 20, paddingVertical: 14, gap: 4 },
  rowFirst: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 18 },
  rowLast: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, paddingBottom: 18 },
  rowTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1, fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  when: { fontSize: 13 },
  preview: { fontSize: 15 },
  fab: {
    position: 'absolute',
    right: 20,
    height: 56,
    paddingLeft: 18,
    paddingRight: 22,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 16px 24px -8px rgba(85,70,255,0.45), 0 6px 6px -3px rgba(0,0,0,0.06)',
  },
  fabPlus: { color: '#fff', fontSize: 24, lineHeight: 26, fontWeight: '500' },
  fabLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
