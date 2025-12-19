import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Client, Product } from '../types';
import { COLOR_BLACK } from '../utils/colors';

export const styles = StyleSheet.create({
  mainView: (zIndex: number) => ({
    zIndex: zIndex,
    position: 'relative',
  }),
  mainIcon: {
    marginRight: 12,
  },
  listView: {
    elevation: 10,
    shadowColor: COLOR_BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
interface Suggestion {
  id: string;
  title: string;
  subtitle?: string;
  originalData: Client | Product
}

interface AutocompleteProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (item: Client | Product) => void;
  fetchData: (query: string) => Promise<Client[] | Product[]>;
  formatResult: (item: Client | Product) => Suggestion;
  icon?: keyof typeof Ionicons.glyphMap;
  keyboardType?: 'default' | 'numeric';
  zIndex?: number;
}

export function AutocompleteInput({
  placeholder,
  value,
  onChangeText,
  onSelect,
  fetchData,
  formatResult,
  icon,
  keyboardType = 'default',
  zIndex = 1
}: AutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      setShowList(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (!showList) return;

      setLoading(true);
      try {
        const results = await fetchData(value);
        const formatted = results.map(formatResult);
        setSuggestions(formatted);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [value, showList]);

  const handleSelect = (item: Suggestion) => {
    onChangeText(item.title);
    onSelect(item.originalData);
    setShowList(false);
  };

  return (
    <View style={styles.mainView(zIndex)} className="mb-4">

      {/* O Input Visual */}
      <View className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex-row items-center">
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={colorScheme === 'dark' ? '#94a3b8' : '#64748b'}
            style={styles.mainIcon}
          />
        )}
        <TextInput
          className="flex-1 text-slate-800 dark:text-slate-100 text-base"
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            setShowList(true);
          }}
          keyboardType={keyboardType}
        />
        {loading && <ActivityIndicator size="small" color="#2563eb" />}
      </View>

      {/* A Lista Flutuante ("Google Style") */}
      {showList && suggestions.length > 0 && (
        <View
          className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 rounded-xl mt-2 border border-slate-200 dark:border-slate-600 shadow-xl"
          style={styles.listView}
        >
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={`${item.id}-${index}`}
              className={`p-4 flex-row justify-between items-center ${index < suggestions.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}
              onPress={() => handleSelect(item)}
            >
              <View>
                <Text className="text-slate-800 dark:text-slate-100 font-bold">{item.title}</Text>
                {item.subtitle && (
                  <Text className="text-slate-400 text-xs">{item.subtitle}</Text>
                )}
              </View>
              <Ionicons name="arrow-forward-circle-outline" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
