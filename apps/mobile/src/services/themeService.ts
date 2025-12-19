import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_STORAGE_KEY = "@cotadorplus:theme";

export type ThemeMode = "light" | "dark";

/**
 * Salva a preferência de tema no AsyncStorage
 */
export async function saveThemePreference(theme: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error("Erro ao salvar preferência de tema:", error);
  }
}

/**
 * Carrega a preferência de tema salva no AsyncStorage
 * Retorna 'light' como padrão se não houver preferência salva
 */
export async function loadThemePreference(): Promise<ThemeMode> {
  try {
    const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    return "light"; // Tema padrão
  } catch (error) {
    console.error("Erro ao carregar preferência de tema:", error);
    return "light"; // Tema padrão em caso de erro
  }
}
