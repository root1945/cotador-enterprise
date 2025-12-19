import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const styles = StyleSheet.create({
  button: {
    marginRight: 8,
  },
});

interface StatusButtonProps {
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
}

const StatusButton = ({ label, icon, color, onPress }: StatusButtonProps) => {
  const bgColors: Record<string, string> = {
    green: 'bg-green-100 dark:bg-green-900/40',
    blue: 'bg-blue-100 dark:bg-blue-900/40',
    orange: 'bg-orange-100 dark:bg-orange-900/40',
    red: 'bg-red-100 dark:bg-red-900/40',
  };
  const textColors: Record<string, string> = {
    green: 'text-green-700 dark:text-green-400',
    blue: 'text-blue-700 dark:text-blue-400',
    orange: 'text-orange-700 dark:text-orange-400',
    red: 'text-red-700 dark:text-red-400',
  };
  const iconColors: Record<string, string> = {
    green: '#15803d', blue: '#1d4ed8', orange: '#c2410c', red: '#b91c1c',
  };

  return (
    <TouchableOpacity
      className={`w-[48%] p-4 rounded-2xl flex-row items-center justify-center mb-2 border border-transparent ${bgColors[color]}`}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={iconColors[color]} style={styles.button} />
      <Text className={`font-bold ${textColors[color]}`}>{label}</Text>
    </TouchableOpacity>
  );
};

export default StatusButton;
