import { supabase } from "./supabase";
import { Client, Product } from "../types";

export async function searchClients(query: string): Promise<Client[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found");

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .ilike("name", `%${query}%`)
    .limit(5);

  if (error) throw error;
  return data as Client[];
}

export async function saveClient(client: Omit<Client, "id" | "user_id">) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found");

  const { data, error } = await supabase
    .from("clients")
    .insert({ ...client, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

export async function searchProducts(query: string): Promise<Product[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found");

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", user.id)
    .ilike("title", `%${query}%`)
    .limit(10);

  if (error) throw error;
  return data as Product[];
}

export async function saveProduct(product: Omit<Product, "id" | "user_id">) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found");

  const { data, error } = await supabase
    .from("products")
    .insert({ ...product, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Product;
}

export async function ensureCatalogData(
  clientName: string,
  items: { description: string; unit_price: number }[],
) {
  try {
    if (clientName.trim()) {
      const existingClients = await searchClients(clientName);
      const exactMatch = existingClients.find(
        (c) => c.name.toLowerCase() === clientName.toLowerCase(),
      );

      if (!exactMatch) {
        await saveClient({ name: clientName });
      }
    }

    for (const item of items) {
      if (item.description.trim()) {
        const existingProducts = await searchProducts(item.description);
        const exactMatch = existingProducts.find(
          (p) => p.title.toLowerCase() === item.description.toLowerCase(),
        );

        if (!exactMatch) {
          await saveProduct({
            title: item.description,
            price: item.unit_price,
          });
        }
      }
    }
  } catch (error) {
    console.error("Erro ao atualizar catálogo inteligente:", error);
  }
}
