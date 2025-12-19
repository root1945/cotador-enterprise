import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useFocusEffect } from '@react-navigation/native';

import { Budget, BudgetStatus } from '../types';
import { getBudgetsByUser, updateBudgetStatus } from '../services/budgetService';
import { useAlert } from '../context/AlertContext';
import { Header } from '../components/Header';
import BudgetCard from '../components/BudgetCard';
import StatusButton from '../components/StatusButton';

const styles = StyleSheet.create({
  flatList: {
    paddingTop: 20,
    paddingBottom: 100,
  },
});

export default function HistoryScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const { colorScheme } = useColorScheme();
  const { showAlert } = useAlert();

  const loadData = async () => {
    try {
      const data = await getBudgetsByUser();
      setBudgets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const handleCardPress = (budget: Budget) => {
    setSelectedBudget(budget);
    setModalVisible(true);
  };

  const handleStatusChange = async (newStatus: BudgetStatus) => {
    if (!selectedBudget) return;

    const oldBudgets = [...budgets];
    setBudgets(budgets.map(b => b.id === selectedBudget.id ? { ...b, status: newStatus } : b));
    setModalVisible(false);

    try {
      await updateBudgetStatus(selectedBudget.id, newStatus);
      showAlert('Atualizado', 'Status alterado com sucesso!', 'success');
    } catch {
      setBudgets(oldBudgets);
      showAlert('Erro', 'Não foi possível atualizar o status.', 'error');
    } finally {
      setSelectedBudget(null);
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      <Header title="Gestão" subtitle="Toque no card para mudar status" />

      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BudgetCard
            item={item}
            onPress={handleCardPress}
          />
        )}
        contentContainerStyle={styles.flatList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colorScheme === 'dark' ? '#60a5fa' : '#2563eb'}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center mt-20 opacity-50 px-10">
              <Ionicons
                name="document-text-outline"
                size={64}
                color={colorScheme === 'dark' ? '#475569' : '#cbd5e1'}
              />
              <Text className="text-slate-400 dark:text-slate-500 mt-4 text-center">
                Nenhum orçamento encontrado.
              </Text>
            </View>
          ) : null
        }
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/60 justify-end"
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View className="bg-white dark:bg-slate-800 rounded-t-[32px] p-6 pb-10 border-t border-slate-200 dark:border-slate-700">

            <View className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full self-center mb-6" />

            <Text className="text-center text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-4 tracking-widest">
              Definir Status
            </Text>

            <View className="flex-row flex-wrap justify-between gap-3">
              <StatusButton label="Enviado" icon="paper-plane" color="orange" onPress={() => handleStatusChange('sent')} />
              <StatusButton label="Aprovado" icon="thumbs-up" color="blue" onPress={() => handleStatusChange('approved')} />
              <StatusButton label="Pago" icon="checkmark-circle" color="green" onPress={() => handleStatusChange('paid')} />
              <StatusButton label="Recusado" icon="close-circle" color="red" onPress={() => handleStatusChange('rejected')} />
            </View>

            <TouchableOpacity
              className="mt-6 p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl items-center"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-slate-600 dark:text-slate-300 font-bold">Cancelar</Text>
            </TouchableOpacity>

          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

