import { supabase } from "./supabase";
import { Budget, BudgetItem, BudgetStatus } from "../types";

interface SaveBudgetProps {
  clientName: string;
  items: BudgetItem[];
  total: number;
}

export async function saveBudgetToSupabase({
  clientName,
  items,
  total,
}: SaveBudgetProps) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Usuário não autenticado. Faça login.");
    }

    const { data: budgetData, error: budgetError } = await supabase
      .from("budgets")
      .insert({
        user_id: user.id,
        client_id: null,
        title: `Orçamento para ${clientName}`,
        total_amount: total,
        status: "draft",
      })
      .select()
      .single();

    if (budgetError) throw budgetError;

    const budgetId = budgetData.id;

    const itemsToSave = items.map((item) => ({
      budget_id: budgetId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from("budget_items")
      .insert(itemsToSave);

    if (itemsError) throw itemsError;

    console.log("Orçamento salvo com sucesso! ID:", budgetId);
    return budgetId;
  } catch (error) {
    console.error("Erro ao salvar no banco:", error);
    throw error;
  }
}

export async function getBudgetsByUser(): Promise<Budget[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    const { data, error } = await supabase
      .from("budgets")
      .select(
        `
        *,
        budget_items (
          id,
          description,
          quantity,
          unit_price
        )
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data.map((budget: Budget) => ({
      ...budget,
      items: budget.budget_items || [],
      title: budget.title || `Orçamento ${budget.id.slice(0, 8)}`,
    })) as Budget[];
  } catch (error) {
    console.error("Erro ao buscar orçamentos:", error);
    throw error;
  }
}

export async function updateBudgetStatus(
  budgetId: string,
  newStatus: BudgetStatus,
) {
  try {
    const { error } = await supabase
      .from("budgets")
      .update({ status: newStatus })
      .eq("id", budgetId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    throw error;
  }
}
