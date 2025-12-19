import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { useBudget } from '../context/BudgetContext';
import { useAlert } from '../context/AlertContext';
import { getUserProfile } from '../services/profileService';
import { generateAndSharePDF } from '../services/pdfGenerator';
import { saveBudgetToSupabase } from '../services/budgetService';
import {
  searchClients,
  searchProducts,
  ensureCatalogData
} from '../services/catalogService';
import { Header } from '../components/Header';
import { AutocompleteInput } from '../components/AutocompleteInput';
import { Product } from '../types';

const styles = StyleSheet.create({
  scrollView: {
    paddingBottom: 140,
  },
  viewClient: {
    zIndex: 100,
  },
  viewAddItem: {
    zIndex: 50,
    elevation: 2,
  },
  viewItem: {
    zIndex: 60,
  },
  iconAddItem: {
    marginRight: 8,
  },
  viewItems: {
    zIndex: 1,
  },
  viewTotal: {
    zIndex: 200,
  },
});

export default function BudgetForm() {
  const { clientName, setClientName, items, addItem, removeItem, total } = useBudget();
  const [isGenerating, setIsGenerating] = useState(false);
  const { colorScheme } = useColorScheme();
  const { showAlert } = useAlert();

  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQty, setItemQty] = useState('1');

  const handleGeneratePDF = async () => {
    if (items.length === 0) return;
    try {
      setIsGenerating(true);
      const profile = await getUserProfile();
      if (!profile?.pix_key) {
        return showAlert('Atenção', 'Chave Pix não configurada no perfil.', 'warning');
      }

      await ensureCatalogData(clientName, items);

      await saveBudgetToSupabase({ clientName, items, total });
      await generateAndSharePDF({
        clientName,
        items,
        total,
        businessName: profile?.business_name,
        pixKey: profile?.pix_key
      });
    } catch {
      showAlert('Erro', 'Não foi possível gerar o PDF.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddItem = () => {
    if (!itemDesc.trim()) return showAlert('Ops', 'Digite a descrição.', 'warning');
    const priceNumber = parseFloat(itemPrice.replace(',', '.'));
    const qtyNumber = parseFloat(itemQty.replace(',', '.'));
    if (isNaN(priceNumber) || priceNumber <= 0) return showAlert('Ops', 'Valor inválido.', 'warning');

    addItem(itemDesc, priceNumber, qtyNumber || 1);
    setItemDesc('');
    setItemPrice('');
    setItemQty('1');
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      <Header title="Novo Orçamento" subtitle="Preencha os dados do serviço" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView
          className="flex-1 px-4 pt-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >

          {/* BLOCO CLIENTE COM AUTOCOMPLETE */}
          <View className="mb-6" style={styles.viewClient}>
            <Text className="text-slate-500 dark:text-slate-400 font-bold mb-2 uppercase text-xs tracking-wider ml-1">
              Cliente
            </Text>

            <AutocompleteInput
              placeholder="Nome do cliente (Digite para buscar)"
              value={clientName}
              onChangeText={setClientName}
              fetchData={searchClients}
              icon="person-outline"
              zIndex={100}
              onSelect={(client) => {
                setClientName(client.name);
              }}
              formatResult={(client) => ({
                id: client.id,
                title: client.name,
                subtitle: client.phone || 'Cliente cadastrado',
                originalData: client
              })}
            />
          </View>

          {/* CARD DE ADICIONAR ITEM */}
          <View
            className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 mb-6 shadow-sm"
            style={styles.viewAddItem}
          >
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 bg-blue-50 dark:bg-blue-900/40 rounded-full items-center justify-center mr-2">
                <Ionicons name="pricetag" size={16} color="#3b82f6" />
              </View>
              <Text className="text-slate-700 dark:text-slate-200 font-bold text-base">Novo Item</Text>
            </View>

            {/* AUTOCOMPLETE DE PRODUTO */}
            <View style={styles.viewItem}>
              <AutocompleteInput
                placeholder="Descrição (Ex: Instalação)"
                value={itemDesc}
                onChangeText={setItemDesc}
                fetchData={searchProducts}
                zIndex={60}
                onSelect={(product: Product) => {
                  setItemDesc(product.title);
                  if (product.price) {
                    setItemPrice(product.price.toString().replace('.', ','));
                  }
                }}
                formatResult={(product: Product) => ({
                  id: product.id,
                  title: product.title,
                  subtitle: `R$ ${product.price?.toFixed(2) || '0,00'}`,
                  originalData: product
                })}
              />
            </View>

            <View className="flex-row gap-3 -mt-2">
              <View className="flex-1">
                <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1 ml-1">Valor (R$)</Text>
                <TextInput
                  className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-center font-bold text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 shadow-sm"
                  placeholder="0,00"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={itemPrice}
                  onChangeText={setItemPrice}
                />
              </View>
              <View className="w-24">
                <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1 ml-1">Qtd</Text>
                <TextInput
                  className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-center font-bold text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 shadow-sm"
                  placeholder="1"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={itemQty}
                  onChangeText={setItemQty}
                />
              </View>
            </View>

            <TouchableOpacity
              className="mt-4 bg-blue-50 dark:bg-blue-500/10 py-4 rounded-2xl flex-row justify-center items-center border border-blue-100 dark:border-blue-500/20"
              onPress={handleAddItem}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={22} color={colorScheme === 'dark' ? '#60a5fa' : '#2563eb'} style={styles.iconAddItem} />
              <Text className="text-blue-600 dark:text-blue-400 font-bold text-base">Adicionar Item</Text>
            </TouchableOpacity>
          </View>

          {/* LISTA DE ITENS */}
          {items.length > 0 && (
            <View style={styles.viewItems}>
              <Text className="text-slate-500 dark:text-slate-400 font-bold mb-3 uppercase text-xs tracking-wider ml-1">
                Resumo ({items.length})
              </Text>
              {items.map((item) => (
                <View key={item.id} className="bg-white dark:bg-slate-800 p-4 mb-3 rounded-2xl flex-row justify-between items-center border border-slate-100 dark:border-slate-700">
                  <View className="flex-1 pr-4">
                    <Text className="text-slate-800 dark:text-slate-100 font-bold text-base">{item.description}</Text>
                    <Text className="text-slate-400 text-sm mt-1">
                      {item.quantity}x <Text className="text-slate-600 dark:text-slate-300 font-medium">R$ {item.unit_price.toFixed(2)}</Text>
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-slate-800 dark:text-slate-100 font-bold text-lg">
                      R$ {(item.unit_price * item.quantity).toFixed(2).replace('.', ',')}
                    </Text>
                    <TouchableOpacity onPress={() => removeItem(item.id)} className="p-2 -mr-2 opacity-60">
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View className="absolute bottom-6 left-5 right-5" style={styles.viewTotal}>
          <View
            className="bg-white dark:bg-slate-800 p-5 rounded-[24px] flex-row justify-between items-center border border-slate-100 dark:border-slate-700 shadow-md">
            <View>
              <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Estimado</Text>
              <Text className="text-slate-900 dark:text-white text-2xl font-bold font-sans-bold">
                R$ {total.toFixed(2).replace('.', ',')}
              </Text>
            </View>

            <TouchableOpacity
              className={`px-6 py-3 rounded-xl flex-row items-center ${items.length > 0 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
              disabled={items.length === 0 || isGenerating}
              onPress={handleGeneratePDF}
            >
              {isGenerating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text className={`font-bold mr-2 ${items.length > 0 ? 'text-white' : 'text-slate-400'}`}>
                    Gerar PDF
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={items.length > 0 ? 'white' : '#94a3b8'} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
