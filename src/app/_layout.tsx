import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';

import { LockScreen } from '@/components/lock-screen';
import { Colors } from '@/constants/theme';
import { clearExportedFile } from '@/lib/export';
import { useSharedTextAsMemo } from '@/lib/incoming';
import { useAppLock } from '@/lib/lock';
import { useNewMemoShortcut } from '@/lib/shortcuts';

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];
  const lock = useAppLock();
  const locked = lock.state !== 'unlocked';
  useSharedTextAsMemo();
  useNewMemoShortcut();

  useEffect(() => {
    clearExportedFile();
  }, []);

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Screens stay mounted under the lock so the user returns to where they were. */}
      <View
        style={{ flex: 1 }}
        importantForAccessibility={locked ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={locked}>
        <Stack
          screenOptions={{
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text },
            contentStyle: { backgroundColor: colors.background },
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="memo/[id]" options={{ title: '' }} />
          <Stack.Screen
            name="backup"
            options={{
              headerStyle: { backgroundColor: colors.backgroundGrouped },
              contentStyle: { backgroundColor: colors.backgroundGrouped },
            }}
          />
          <Stack.Screen
            name="pro"
            options={{
              title: '',
              headerStyle: { backgroundColor: colors.backgroundGrouped },
              contentStyle: { backgroundColor: colors.backgroundGrouped },
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: '설정',
              headerStyle: { backgroundColor: colors.backgroundGrouped },
              contentStyle: { backgroundColor: colors.backgroundGrouped },
            }}
          />
        </Stack>
      </View>
      {locked ? (
        <LockScreen ready={lock.state === 'locked'} biometric={lock.biometric} onUnlock={lock.unlock} />
      ) : null}
    </ThemeProvider>
  );
}
