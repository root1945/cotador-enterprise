import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useAlert } from '../context/AlertContext';
import { COLOR_BLACK } from '../utils/colors';


const styles = StyleSheet.create({
  linearGradientHeader: {
    height: '35%',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  card: {
    elevation: 8,
    shadowColor: COLOR_BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  icon: {
    marginRight: 12,
  },
  button: {
    padding: 4,
  },
});

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const { showAlert } = useAlert();

  async function handleAuth() {
    if (!email || !password) {
      return showAlert('Campo Vazio', 'Por favor, preencha e-mail e senha.', 'warning');
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        showAlert('Boas vindas!', 'Sua conta foi criada com sucesso.', 'success');
      }
    } catch {
      showAlert('Falha na Autenticação', 'Verifique seus dados e tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      <StatusBar style="light" />

      {/* --- HERO HEADER (Gradiente Grande) --- */}
      <LinearGradient
        colors={['#1e40af', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.linearGradientHeader}
      >
        <View className="items-center -mt-10">
          {/* Logo Icon com fundo translúcido */}
          <View className="w-20 h-20 bg-white/20 rounded-3xl items-center justify-center mb-4 border border-white/10">
            <Ionicons name="document-text" size={40} color="white" />
          </View>

          <Text className="text-4xl font-bold text-white font-sans-bold shadow-sm">
            Cotador<Text className="text-blue-200">+</Text>
          </Text>
          <Text className="text-blue-100 mt-2 text-center font-sans opacity-90">
            Seu negócio, agora profissional.
          </Text>
        </View>
      </LinearGradient>

      {/* --- CONTEÚDO FLUTUANTE --- */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
          className="-mt-16"
        >

          {/* Card Principal */}
          <View
            className="bg-white dark:bg-slate-800 p-8 rounded-[32px] mb-6 border border-slate-100 dark:border-slate-700"
            style={styles.card}
          >
            <Text className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-2">
              {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
            </Text>
            <Text className="text-slate-400 text-center mb-8 text-sm">
              {isLogin ? 'Insira seus dados para continuar' : 'Comece a gerar orçamentos hoje'}
            </Text>

            {/* Input E-mail */}
            <View className="mb-4">
              <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase ml-1 mb-2">E-mail</Text>
              <View className="flex-row items-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
                <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.icon} />
                <TextInput
                  className="flex-1 text-slate-800 dark:text-white text-base"
                  placeholder="seu@email.com"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Input Senha */}
            <View className="mb-8">
              <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase ml-1 mb-2">Senha</Text>
              <View className="flex-row items-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
                <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.icon} />
                <TextInput
                  className="flex-1 text-slate-800 dark:text-white text-base"
                  placeholder="********"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                  style={styles.button}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão de Ação */}
            <TouchableOpacity
              className="bg-blue-600 py-4 rounded-2xl items-center shadow-lg shadow-blue-500/30 active:opacity-90"
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  {isLogin ? 'Entrar no App' : 'Criar Conta Grátis'}
                </Text>
              )}
            </TouchableOpacity>

          </View>

          {/* Toggle Login/Cadastro */}
          <TouchableOpacity
            className="flex-row justify-center py-4 mb-10"
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text className="text-slate-500 dark:text-slate-400 text-base">
              {isLogin ? 'Novo por aqui? ' : 'Já tem uma conta? '}
            </Text>
            <Text className="text-blue-600 dark:text-blue-400 font-bold text-base ml-1">
              {isLogin ? 'Cadastre-se' : 'Fazer Login'}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
