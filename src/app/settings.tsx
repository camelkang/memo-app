import Constants from 'expo-constants';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { exportMemos } from '@/lib/export';
import { confirmIdentity } from '@/lib/lock';
import { useMemos } from '@/lib/memos';
import { updateSettings, useSettings } from '@/lib/settings';

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const memos = useMemos();
  const [exportState, setExportState] = useState<'idle' | 'working' | 'failed'>('idle');

  async function toggleLock(next: boolean) {
    // Turning the lock off is checked, so someone holding an open phone can't remove it.
    if (!next && !(await confirmIdentity('앱 잠금 끄기'))) return;
    updateSettings({ lockEnabled: next });
  }

  async function onExport() {
    if (exportState === 'working') return;
    setExportState('working');
    try {
      await exportMemos(memos);
      setExportState('idle');
    } catch {
      setExportState('failed');
    }
  }

  const card = [styles.card, { backgroundColor: theme.card }];
  const canExport = memos.length > 0;

  return (
    <ScrollView
      style={{ backgroundColor: theme.backgroundGrouped }}
      contentContainerStyle={{ padding: Spacing.three, paddingBottom: insets.bottom + Spacing.five }}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>잠금</Text>
      <View style={card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={[styles.label, { color: theme.text }]}>앱 잠금</Text>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              {Platform.OS === 'web'
                ? '폰에 설치한 앱에서만 쓸 수 있어요'
                : '앱을 열 때 지문이나 화면 잠금으로 확인해요'}
            </Text>
          </View>
          <Switch
            value={settings.lockEnabled}
            onValueChange={toggleLock}
            disabled={Platform.OS === 'web'}
            trackColor={{ true: theme.tint, false: theme.backgroundSelected }}
            accessibilityLabel="앱 잠금"
          />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>내 메모</Text>
      <View style={card}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.text }]}>저장된 메모</Text>
          <Text style={[styles.value, { color: theme.textSecondary }]}>{memos.length}개</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.backgroundElement }]} />
        <Pressable
          onPress={onExport}
          disabled={!canExport}
          accessibilityRole="button"
          style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.backgroundSelected }]}>
          <View style={styles.rowText}>
            <Text style={[styles.label, { color: canExport ? theme.tint : theme.textSecondary }]}>
              {exportState === 'working' ? '내보내는 중…' : '텍스트 파일로 내보내기'}
            </Text>
            <Text style={[styles.hint, { color: exportState === 'failed' ? theme.danger : theme.textSecondary }]}>
              {exportState === 'failed'
                ? '내보내지 못했어요. 다시 눌러 주세요.'
                : canExport
                  ? '내보낸 파일은 암호화되지 않아요. 믿을 수 있는 곳에만 보관하세요.'
                  : '내보낼 메모가 아직 없어요'}
            </Text>
          </View>
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>정보</Text>
      <View style={card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={[styles.label, { color: theme.text }]}>메모는 이 폰에만 있어요</Text>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              계정도 서버도 없어요. 폰 안에 암호화해서 저장해요.
            </Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.backgroundElement }]} />
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.text }]}>버전</Text>
          <Text style={[styles.value, { color: theme.textSecondary }]}>
            {Constants.expoConfig?.version ?? ''}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    marginHorizontal: Spacing.two,
  },
  card: { borderRadius: 20, overflow: 'hidden' },
  row: {
    minHeight: 60,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowText: { flex: 1, gap: 4 },
  label: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
  hint: { fontSize: 14, lineHeight: 20 },
  value: { fontSize: 16 },
  divider: { height: 1, marginLeft: 20 },
});
