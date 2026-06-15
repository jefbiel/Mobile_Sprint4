export async function salvar<T>(key: string, data: T): Promise<void> {
  try {
    // Se for React Native, troque localStorage por AsyncStorage
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Erro ao salvar no storage:", error);
  }
}

export async function buscar<T>(key: string): Promise<T | null> {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch (error) {
    console.error("Erro ao buscar no storage:", error);
    return null;
  }
}
