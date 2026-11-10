import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MIN_PASSWORD_LENGTH, backupFileName, createBackup, isBackup, readBackup } from '@/lib/backup';
import { pickTextFile, shareTextFile } from '@/lib/export';
import { importMemos, useMemos } from '@/lib/memos';

type Notice = { tone: 'ok' | 'error'; text: string };

export default function BackupScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const restoring = mode === 'restore';
  const memos = useMemos();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [content, setContent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const longEnough = password.length >= MIN_PASSWORD_LENGTH;
  const ready = restoring ? content !== null && password.length > 0 : longEnough && password === confirm;

  async function pick() {
    setNotice(null);
    try {
      const text = await pickTextFile();
      if (text === null) return;
      if (isBackup(text)) {
        setContent(text);
      } else {
        setContent(null);
        setNotice({ tone: 'error', text: '꾹 백업 파일이 아니에요. 다른 파일을 골라 주세요.' });
      }
    } catch {
      setNotice({ tone: 'error', text: '파일을 읽지 못했어요. 다시 골라 주세요.' });
    }
  }

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    setNotice(null);
    try {
      if (restoring && content !== null) {
        const result = await readBackup(content, password);
        if ('error' in result) {
          setNotice({
            tone: 'error',
            text:
              result.error === 'wrong-password'
                ? '비밀번호가 맞지 않아요. 다시 입력해 주세요.'
                : '꾹 백업 파일이 아니에요. 다른 파일을 골라 주세요.',
          });
        } else {
          const changed = importMemos(result.memos);
          setPassword('');
          setNotice({
            tone: 'ok',
            text: changed > 0 ? `메모 ${changed}개를 가져왔어요.` : '새로 가져올 메모가 없어요. 이미 모두 있어요.',
          });
        }
      } else {
        await shareTextFile(backupFileName(), await createBackup(memos, password), 'application/octet-stream');
        setPassword('');
        setConfirm('');
        setNotice({ tone: 'ok', text: '백업 파일을 만들었어요. 안전한 곳에 보관하세요.' });
      }
    } catch {
      setNotice({ tone: 'error', text: restoring ? '가져오지 못했어요. 다시 눌러 주세요.' : '백업하지 못했어요. 다시 눌러 주세요.' });
    } finally {
      setBusy(false);
    }
  }

  const input = [styles.input, { backgroundColor: theme.card, color: theme.text }];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.backgroundGrouped }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: restoring ? '백업에서 가져오기' : '백업 만들기' }} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: Spacing.three, paddingBottom: insets.bottom + Spacing.five, gap: Spacing.three }}>
        <Text style={[styles.lead, { color: theme.textBody }]}>
          {restoring
            ? '백업 파일을 고르고, 백업할 때 정한 비밀번호를 입력하세요. 지금 있는 메모는 지워지지 않아요.'
            : `메모 ${memos.length}개를 비밀번호로 잠근 파일 하나로 만들어요. 폰을 바꿀 때 이 파일로 메모를 옮길 수 있어요.`}
        </Text>

        {restoring ? (
          <Pressable
            onPress={pick}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.pick,
              { backgroundColor: pressed ? theme.backgroundSelected : theme.card },
            ]}>
            <Text style={[styles.pickLabel, { color: theme.tint }]}>
              {content === null ? '백업 파일 고르기' : '다른 파일 고르기'}
            </Text>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              {content === null ? '이름이 kkuk-backup으로 시작하는 파일이에요' : '백업 파일을 골랐어요'}
            </Text>
          </Pressable>
        ) : null}

        <View style={{ gap: Spacing.two }}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={restoring ? '백업 비밀번호' : `비밀번호 (${MIN_PASSWORD_LENGTH}자 이상)`}
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="백업 비밀번호"
            style={input}
          />
          {restoring ? null : (
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="비밀번호 한 번 더"
              placeholderTextColor={theme.textSecondary}
              accessibilityLabel="비밀번호 확인"
              style={input}
            />
          )}
          {!restoring && confirm.length > 0 && password !== confirm ? (
            <Text style={[styles.hint, styles.inset, { color: theme.danger }]}>두 비밀번호가 달라요</Text>
          ) : null}
          {restoring ? null : (
            <Text style={[styles.hint, styles.inset, { color: theme.textSecondary }]}>
              비밀번호를 잊으면 이 백업은 누구도 열 수 없어요. 꾹도 되찾아 드릴 수 없어요.
            </Text>
          )}
        </View>

        {notice ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.notice, { color: notice.tone === 'ok' ? theme.ok : theme.danger }]}>
            {notice.text}
          </Text>
        ) : null}

        <Pressable
          onPress={submit}
          disabled={!ready || busy}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.tint, opacity: !ready || busy ? 0.4 : pressed ? 0.85 : 1 },
          ]}>
          <Text style={styles.buttonLabel}>
            {busy ? (restoring ? '여는 중…' : '잠그는 중…') : restoring ? '메모 가져오기' : '백업 파일 만들기'}
          </Text>
        </Pressable>

        {notice?.tone === 'ok' ? (
          <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.done}>
            <Text style={[styles.pickLabel, { color: theme.textSecondary }]}>설정으로 돌아가기</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: 16, lineHeight: 25, marginHorizontal: Spacing.two, marginTop: Spacing.two },
  pick: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 16, gap: 4 },
  pickLabel: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
  hint: { fontSize: 14, lineHeight: 20 },
  inset: { marginHorizontal: Spacing.two },
  input: { height: 56, borderRadius: 16, paddingHorizontal: 18, fontSize: 17, outlineWidth: 0 },
  notice: { fontSize: 15, lineHeight: 22, fontWeight: '600', marginHorizontal: Spacing.two },
  button: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  buttonLabel: { color: '#fff', fontSize: 17, fontWeight: '700' },
  done: { height: 48, alignItems: 'center', justifyContent: 'center' },
});
