import './global.css';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

import { BudgetProvider } from './src/context/BudgetContext';
import { supabase } from './src/services/supabase';
import { Routes } from './src/routes';
import AuthScreen from './src/screens/AuthScreen';
import { AlertProvider } from './src/context/AlertContext';
import { loadThemePreference } from './src/services/themeService';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [themeLoaded, setThemeLoaded] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const savedTheme = await loadThemePreference();
        if (setColorScheme) {
          setColorScheme(savedTheme);
        }
      } catch (error) {
        console.error('Erro ao carregar tema:', error);
      } finally {
        setThemeLoaded(true);
      }
    };

    initializeTheme();
  }, [setColorScheme]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading || !themeLoaded || !fontsLoaded) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AlertProvider>
        <BudgetProvider>
          <StatusBar style="auto" />
          {session ? <Routes /> : <AuthScreen />}
        </BudgetProvider>
      </AlertProvider>
    </SafeAreaProvider>
  );
}
