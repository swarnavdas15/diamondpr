import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { ERPProvider } from '../context/ERPContext';
import MainScreen from './index';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'disable-native-password-reveal';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          input::-ms-reveal,
          input::-ms-clear,
          input::-webkit-contacts-auto-fill-button,
          input::-webkit-credentials-auto-fill-button {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            pointer-events: none !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
        <AuthProvider>
          <ERPProvider>
            <MainScreen />
          </ERPProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
