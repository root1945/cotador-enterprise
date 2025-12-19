import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AlertType = 'success' | 'error' | 'warning';

interface AlertContextData {
  showAlert: (title: string, message: string, type?: AlertType) => void;
}

const AlertContext = createContext<AlertContextData>({} as AlertContextData);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AlertType>('success');

  const showAlert = (t: string, m: string, tp: AlertType = 'success') => {
    setTitle(t);
    setMessage(m);
    setType(tp);
    setVisible(true);
  };

  const closeAlert = () => setVisible(false);

  const getConfig = () => {
    switch (type) {
      case 'error':
        return { icon: 'alert-circle', color: '#ef4444', bgColor: 'bg-red-100', btnColor: 'bg-red-600' };
      case 'warning':
        return { icon: 'warning', color: '#f59e0b', bgColor: 'bg-orange-100', btnColor: 'bg-orange-500' };
      case 'success':
      default:
        return { icon: 'checkmark-circle', color: '#22c55e', bgColor: 'bg-green-100', btnColor: 'bg-green-600' };
    }
  };

  const config = getConfig();

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full items-center shadow-2xl border border-slate-100 dark:border-slate-700">

            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${config.bgColor}`}>
              <Ionicons name={config.icon} size={32} color={config.color} />
            </View>

            <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
              {title}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-center mb-6 leading-5">
              {message}
            </Text>

            <TouchableOpacity
              onPress={closeAlert}
              className={`w-full p-4 rounded-xl items-center ${config.btnColor} active:opacity-90`}
            >
              <Text className="text-white font-bold text-lg">Entendi</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </AlertContext.Provider>
  );
}

export const useAlert = () => useContext(AlertContext);
