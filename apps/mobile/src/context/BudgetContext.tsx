import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import { BudgetItem } from '../types';

interface BudgetContextData {
  clientName: string;
  setClientName: (name: string) => void;
  items: BudgetItem[];
  addItem: (description: string, price: number, quantity?: number) => void;
  removeItem: (id: string) => void;
  total: number;
  clearBudget: () => void;
}

const BudgetContext = createContext<BudgetContextData>({} as BudgetContextData);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [clientName, setClientName] = useState('');
  const [items, setItems] = useState<BudgetItem[]>([]);

  const total = useMemo(() => {
    return items.reduce((acc, item) => {
      return acc + (item.unit_price * item.quantity);
    }, 0);
  }, [items]);

  function addItem(description: string, price: number, quantity = 1) {
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      description,
      unit_price: price,
      quantity,
    };
    setItems((oldItems) => [...oldItems, newItem]);
  }

  function removeItem(id: string) {
    setItems((oldItems) => oldItems.filter(item => item.id !== id));
  }

  function clearBudget() {
    setClientName('');
    setItems([]);
  }

  return (
    <BudgetContext.Provider value={{
      clientName,
      setClientName,
      items,
      addItem,
      removeItem,
      total,
      clearBudget
    }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget deve ser usado dentro de um BudgetProvider');
  }
  return context;
}
