import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BudgetForm from './screens/BudgetForm';
import HistoryScreen from './screens/HistoryScreen';
import ProfileScreen from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export function Routes() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: colorScheme === 'dark' ? '#64748b' : '#94a3b8',
          tabBarStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1e293b' : '#ffffff',
            borderTopColor: colorScheme === 'dark' ? '#334155' : '#e2e8f0',
            paddingTop: 5,
            paddingBottom: insets.bottom + 5,
            height: 60 + insets.bottom,
            elevation: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tab.Screen
          name="Novo"
          component={BudgetForm}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} />
          }}
        />

        <Tab.Screen
          name="Histórico"
          component={HistoryScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />
          }}
        />

        <Tab.Screen
          name="Perfil"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
