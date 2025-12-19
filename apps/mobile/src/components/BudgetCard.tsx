import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Budget, BudgetStatus } from '../types';
import { COLOR_BLACK } from '../utils/colors';

const styles = StyleSheet.create({
  card: {
    elevation: 2,
    shadowColor: COLOR_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
});
interface BudgetCardProps {
  item: Budget;
  onPress: (budget: Budget) => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const getStatusLabel = (status: BudgetStatus) => {
  switch (status) {
    case 'sent': return 'Enviado';
    case 'paid': return 'Pago';
    case 'approved': return 'Aprovado';
    case 'rejected': return 'Recusado';
    case 'canceled': return 'Cancelado';
    default: return 'Rascunho';
  }
};

const getStatusColor = (status: BudgetStatus) => {
  switch (status) {
    case 'paid': return 'bg-green-100 dark:bg-green-900/40';
    case 'approved': return 'bg-blue-100 dark:bg-blue-900/40';
    case 'sent': return 'bg-orange-100 dark:bg-orange-900/40';
    case 'rejected': return 'bg-red-100 dark:bg-red-900/40';
    case 'canceled': return 'bg-slate-200 dark:bg-slate-700';
    default: return 'bg-slate-100 dark:bg-slate-800';
  }
};

const getStatusTextColor = (status: BudgetStatus) => {
  switch (status) {
    case 'paid': return 'text-green-700 dark:text-green-400';
    case 'approved': return 'text-blue-700 dark:text-blue-400';
    case 'sent': return 'text-orange-700 dark:text-orange-400';
    case 'rejected': return 'text-red-700 dark:text-red-400';
    case 'canceled': return 'text-slate-600 dark:text-slate-400';
    default: return 'text-slate-500 dark:text-slate-400';
  }
};

export default function BudgetCard({ item, onPress }: BudgetCardProps) {
  const { colorScheme } = useColorScheme();

  return (
    <TouchableOpacity
      className="bg-white dark:bg-slate-800 mx-5 mb-4 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 flex-row justify-between items-center"
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onPress(item)}
    >
      {/* Ícone */}
      <View className="w-12 h-12 bg-blue-50 dark:bg-slate-700 rounded-full items-center justify-center mr-4">
        <Ionicons name="document-text" size={24} color={colorScheme === 'dark' ? '#60a5fa' : '#3b82f6'} />
      </View>

      <View className="flex-1">
        <Text className="text-slate-800 dark:text-slate-100 font-bold text-lg truncate" numberOfLines={1}>
          {item.title?.replace('Orçamento para ', '') || 'Orçamento'}
        </Text>
        <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1 font-medium">
          {formatDate(item.created_at)} • {item.items?.length || 0} itens
        </Text>
      </View>

      <View className="items-end ml-3">
        <Text className="text-slate-800 dark:text-slate-100 font-bold text-base text-right">
          R$ {item.total_amount.toFixed(2).replace('.', ',')}
        </Text>
        <View className={`${getStatusColor(item.status)} px-2 py-1 rounded-md mt-1 self-end`}>
          <Text className={`${getStatusTextColor(item.status)} text-[10px] font-bold uppercase`}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
