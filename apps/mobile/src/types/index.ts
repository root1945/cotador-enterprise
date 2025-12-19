/**
 * Define os status possíveis de um orçamento.
 */
export type BudgetStatus =
  | "draft"
  | "sent"
  | "approved"
  | "paid"
  | "rejected"
  | "canceled";

/**
 * Perfil do Prestador de Serviço (Você/Usuário do App)
 * Tabela: profiles
 */
export interface UserProfile {
  id: string; // UUID do Supabase
  business_name: string;
  pix_key: string;
  pix_type: "cpf" | "cnpj" | "email" | "phone" | "random";
  logo_url?: string;
  is_premium: boolean;
}

/**
 * Cliente do Prestador
 * Tabela: clients
 */
export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  created_at?: string;
}

/**
 * Produto do Prestador
 * Tabela: products
 */
export interface Product {
  id: string;
  user_id: string;
  title: string;
  price: number;
  category?: string;
}

/**
 * Item individual dentro de um orçamento (uma linha da tabela)
 * Tabela: budget_items
 */
export interface BudgetItem {
  id: string; // Usaremos UUID ou um Date.now().toString() temporário no front
  description: string;
  quantity: number;
  unit_price: number;
  // O subtotal (qtd * preco) pode ser calculado na hora, não precisa salvar
}

/**
 * O Orçamento Completo (O documento principal)
 * Tabela: budgets
 */
export interface Budget {
  id: string;
  user_id: string;

  // Relacionamentos
  client_id: string | null;
  client?: Client; // Opcional: as vezes carregamos o orçamento COM os dados do cliente junto

  // Título do orçamento
  title?: string;

  // Lista de itens
  items: BudgetItem[];

  // Dados financeiros
  total_amount: number;

  // Metadados
  status: BudgetStatus;
  valid_until?: string; // Data em formato ISO (yyyy-mm-dd)
  created_at: string;
  pdf_url?: string;
  client_ref_id?: string;
}
