import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';

const styles = StyleSheet.create({
  header: (insets: EdgeInsets) => ({
    paddingTop: insets.top + 20,
    paddingBottom: 25,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  }),
});

interface HeaderProps {
  title: string;
  subtitle?: string;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onActionPress?: () => void;
}

export function Header({ title, subtitle, actionIcon, onActionPress }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="bg-slate-50 dark:bg-slate-900">
      <LinearGradient
        colors={['#1e40af', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header(insets)}
        className="shadow-lg shadow-blue-900/20"
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white font-bold text-2xl font-sans-bold">
              {title}
            </Text>
            {subtitle && (
              <Text className="text-blue-100 text-sm mt-1 font-sans opacity-90">
                {subtitle}
              </Text>
            )}
          </View>

          {actionIcon && (
            <TouchableOpacity
              onPress={onActionPress}
              className="bg-white/20 p-2 rounded-full active:bg-white/30"
            >
              <Ionicons name={actionIcon} size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}
