import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, Platform, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundaryProps } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ERPProvider } from '../context/ERPContext';
import MainScreen from './index';

SplashScreen.preventAutoHideAsync();

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 24 }}>
      <View style={{ backgroundColor: '#fee2e2', padding: 16, borderRadius: 100, marginBottom: 20 }}>
        <Text style={{ fontSize: 32 }}>⚠️</Text>
      </View>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, textAlign: 'center' }}>
        Oops! Something went wrong.
      </Text>
      <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 30, maxWidth: 400 }}>
        An unexpected error occurred in the application.
        {'\n\n'}
        <Text style={{ color: '#ef4444', fontStyle: 'italic' }}>{error.message}</Text>
      </Text>
      <TouchableOpacity 
        onPress={retry}
        style={{ backgroundColor: '#2563eb', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

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
