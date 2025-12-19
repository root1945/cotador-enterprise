import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile, updateUserProfile } from '../services/profileService';
import { supabase } from '../services/supabase';
import { useAlert } from '../context/AlertContext';
import { formatPixKey, getPixType } from '../utils/formatters';
import { saveThemePreference, ThemeMode } from '../services/themeService';
import { Header } from '../components/Header';

export default function ProfileScreen() {
  const { colorScheme, toggleColorScheme, setColorScheme } = useNativeWindColorScheme();
  const { showAlert } = useAlert();

  const handleThemeChange = async (value: boolean) => {
    const newTheme: ThemeMode = value ? 'dark' : 'light';

    if (setColorScheme) {
      setColorScheme(newTheme);
    } else {
      if ((colorScheme === 'dark') !== value) {
        toggleColorScheme();
      }
    }

    await saveThemePreference(newTheme);
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [pixKey, setPixKey] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await getUserProfile();
      if (profile) {
        setBusinessName(profile.business_name || '');
        const savedPix = profile.pix_key || '';
        setPixKey(formatPixKey(savedPix));
      }
    } catch {
      showAlert('Erro', 'Não foi possível carregar seu perfil.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!businessName.trim()) {
      return showAlert('Atenção', 'O nome da empresa é obrigatório.', 'warning');
    }

    try {
      setSaving(true);
      await updateUserProfile({
        business_name: businessName,
        pix_key: pixKey,
      });
      showAlert('Sucesso', 'Perfil atualizado! Seus próximos orçamentos sairão com esses dados.', 'success');
    } catch {
      showAlert('Erro', 'Falha ao salvar perfil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      <Header
        title="Meu Perfil"
        subtitle="Dados da sua empresa"
        actionIcon="log-out-outline"
        onActionPress={handleLogout}
      />

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>

        {/* Card de Configuração */}
        <View className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">

          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center mb-2">
              <Ionicons name="business" size={32} color={colorScheme === 'dark' ? '#60a5fa' : '#2563eb'} />
            </View>
            <Text className="text-blue-600 dark:text-blue-400 font-bold">Logo da Empresa</Text>
            <Text className="text-xs text-slate-400 dark:text-slate-500">(Disponível no Premium)</Text>
          </View>

          {/* Nome da Empresa */}
          <View className="mb-4">
            <Text className="text-slate-900 dark:text-slate-100 font-bold mb-2">Nome do Negócio / Profissional</Text>
            <TextInput
              className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              placeholder="Ex: João Eletricista MEI"
              placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>

          {/* Chave Pix Com Formatador */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-slate-700 dark:text-slate-300 font-bold">Chave Pix (Para receber)</Text>

              {/* Badge Dinâmico */}
              {pixKey.length > 4 && (
                <View className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-md">
                  <Text className="text-blue-700 dark:text-blue-300 text-xs font-bold">
                    {getPixType(pixKey)}
                  </Text>
                </View>
              )}
            </View>

            <TextInput
              className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              placeholder="CPF, CNPJ, Celular ou E-mail"
              placeholderTextColor="#94a3b8"
              value={pixKey}
              onChangeText={(text) => {
                if (text.length < pixKey.length) {
                  setPixKey(text);
                } else {
                  setPixKey(formatPixKey(text));
                }
              }}
              maxLength={40}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text className="text-xs text-slate-400 mt-1">Essa chave aparecerá no rodapé do orçamento.</Text>
          </View>

        </View>

        {/* Toggle Tema Claro/Escuro */}
        <View className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${colorScheme === 'dark' ? 'bg-amber-900' : 'bg-amber-100'}`}>
              <Ionicons
                name={colorScheme === 'dark' ? "moon" : "sunny"}
                size={24}
                color={colorScheme === 'dark' ? "#fbbf24" : "#f59e0b"}
              />
            </View>
            <View>
              <Text className="text-slate-900 dark:text-slate-100 font-bold">Modo {colorScheme === 'dark' ? 'Escuro' : 'Claro'}</Text>
              <Text className="text-slate-400 dark:text-slate-500 text-xs">Altere a aparência do app</Text>
            </View>
          </View>

          <Switch
            value={colorScheme === 'dark'}
            onValueChange={handleThemeChange}
            trackColor={{ false: '#e2e8f0', true: '#2563eb' }}
            thumbColor={'#fff'}
            ios_backgroundColor="#e2e8f0"
          />
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity
          className={`p-4 rounded-xl items-center shadow-md ${saving ? 'bg-blue-400' : 'bg-blue-600'} active:opacity-90`}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">
              Salvar Alterações
            </Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
