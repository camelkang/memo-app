import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FREE_LIMIT, PRO_PRICE, purchasePro, resetProForTesting, useProStatus } from '@/lib/pro';

export default function ProScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { pro, count, full } = useProStatus();

  return (
    <ScrollView
      style={{ backgroundColor: theme.backgroundGrouped }}
      contentContainerStyle={{ padding: Spacing.three, paddingBottom: insets.bottom + Spacing.five, gap: Spacing.three }}>
      <View style={styles.head}>
        <Text style={[styles.badge, { backgroundColor: theme.tintSoft, color: theme.tintInk }]}>꾹 Pro</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
          {pro ? 'Pro를 쓰고 있어요' : full ? `무료 메모 ${FREE_LIMIT}개를\n모두 썼어요` : '메모를 개수 제한 없이'}
        </Text>
        <Text style={[styles.lead, { color: theme.textBody }]}>
          {pro
            ? '메모를 개수 제한 없이 쓸 수 있어요. 고마워요.'
            : `무료로는 메모 ${FREE_LIMIT}개까지 쓸 수 있어요. 지금 ${count}개를 썼어요. Pro는 한 번만 사면 계속 쓸 수 있어요.`}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        {['메모 개수 제한 없음', '한 번 결제, 구독 아님', '광고 없음 (무료도 같아요)'].map((line) => (
          <View key={line} style={styles.benefit}>
            <Text style={[styles.check, { color: theme.ok }]}>✓</Text>
            <Text style={[styles.benefitText, { color: theme.text }]}>{line}</Text>
          </View>
        ))}
      </View>

      {pro ? (
        <Pressable onPress={resetProForTesting} accessibilityRole="button" style={styles.secondary}>
          <Text style={[styles.secondaryLabel, { color: theme.textSecondary }]}>테스트용: 무료로 되돌리기</Text>
        </Pressable>
      ) : (
        <>
          <Pressable
            onPress={async () => {
              if (await purchasePro()) router.back();
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 }]}>
            <Text style={styles.buttonLabel}>{PRO_PRICE}에 Pro 사기</Text>
          </Pressable>
          <Text style={[styles.note, { color: theme.textSecondary }]}>
            테스트 버전이라 결제 없이 바로 Pro가 켜져요. 실제 결제는 출시 때 연결돼요.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: { gap: Spacing.two, marginHorizontal: Spacing.two, marginTop: Spacing.three },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    fontSize: 14,
    fontWeight: '700',
  },
  title: { fontSize: 28, lineHeight: 37, fontWeight: '800', letterSpacing: -0.8 },
  lead: { fontSize: 16, lineHeight: 25 },
  card: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  check: { fontSize: 18, fontWeight: '800' },
  benefitText: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
  button: { height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  buttonLabel: { color: '#fff', fontSize: 17, fontWeight: '700' },
  note: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginHorizontal: Spacing.three },
  secondary: { height: 48, alignItems: 'center', justifyContent: 'center' },
  secondaryLabel: { fontSize: 16, fontWeight: '600' },
});
