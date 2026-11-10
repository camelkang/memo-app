import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { useMemos } from '@/lib/memos';

function greeting(hour: number) {
  if (hour < 5) return '늦은 밤이에요';
  if (hour < 11) return '좋은 아침이에요';
  if (hour < 17) return '좋은 오후예요';
  if (hour < 22) return '좋은 저녁이에요';
  return '늦은 밤이에요';
}

type Props = {
  /** False while the lock state is still being checked: show a blank cover. */
  ready: boolean;
  biometric: boolean;
  onUnlock: () => void;
};

export function LockScreen({ ready, biometric, onUnlock }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const count = useMemos().length;
  const now = new Date();

  return (
    <View
      accessibilityViewIsModal
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        { backgroundColor: theme.background, paddingTop: insets.top + 72, paddingBottom: insets.bottom + 24 },
      ]}>
      {ready ? (
        <>
          <View style={styles.heading}>
            <Text style={[styles.date, { color: theme.textSecondary }]}>
              {now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
            </Text>
            <Text accessibilityRole="header" style={[styles.greeting, { color: theme.text }]}>
              {greeting(now.getHours())}
            </Text>
          </View>

          <View style={styles.stackArea}>
            <View style={styles.stack}>
              <View style={[styles.cardBack3, { backgroundColor: theme.backgroundElement, opacity: 0.6 }]} />
              <View style={[styles.cardBack2, { backgroundColor: theme.backgroundElement }]} />
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.backgroundSelected }]}>
                {/* Placeholder lines only: no real memo text is drawn while locked. */}
                <View style={[styles.bar, { width: '30%', height: 10, backgroundColor: theme.backgroundElement }]} />
                <View style={[styles.bar, { width: '70%', height: 18, backgroundColor: theme.backgroundSelected }]} />
                <View style={[styles.bar, { width: '86%', backgroundColor: theme.backgroundElement }]} />
                <View style={[styles.bar, { width: '64%', backgroundColor: theme.backgroundElement }]} />
                <View style={[styles.bar, { width: '78%', backgroundColor: theme.backgroundElement }]} />
                <View style={styles.lockOverlay}>
                  <View style={[styles.lockBadge, { backgroundColor: theme.tint }]}>
                    <View style={styles.lockShackle} />
                    <View style={styles.lockBody} />
                  </View>
                  <Text style={[styles.lockText, { color: theme.text }]}>
                    {count > 0 ? `메모 ${count}개가 잠겨 있어요` : '꾹이 잠겨 있어요'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onUnlock}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.tint, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}>
            <Text style={styles.buttonLabel}>{biometric ? '지문으로 열기' : '화면 잠금으로 열기'}</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  heading: { gap: 10 },
  date: { fontSize: 15, fontWeight: '500' },
  greeting: { fontSize: 34, fontWeight: '800', letterSpacing: -1, lineHeight: 44 },
  stackArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stack: { width: '100%', maxWidth: 310, height: 300 },
  cardBack3: { position: 'absolute', left: 34, right: 34, top: 0, height: 240, borderRadius: 28 },
  cardBack2: { position: 'absolute', left: 17, right: 17, top: 18, height: 250, borderRadius: 28 },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 38,
    height: 262,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 26,
    gap: 16,
    overflow: 'hidden',
    boxShadow: '0 32px 40px -16px rgba(0,0,0,0.12), 0 12px 12px -6px rgba(0,0,0,0.05)',
  },
  bar: { height: 12, borderRadius: 6 },
  lockOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: 12 },
  lockBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px -6px rgba(85,70,255,0.55)',
  },
  lockShackle: {
    width: 16,
    height: 12,
    borderWidth: 2.5,
    borderBottomWidth: 0,
    borderColor: '#fff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  lockBody: { width: 24, height: 17, borderRadius: 4, backgroundColor: '#fff' },
  lockText: { fontSize: 15, fontWeight: '700' },
  button: { height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  buttonLabel: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
