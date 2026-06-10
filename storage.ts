export async function salvar(key: string, data: any): Promise<void> {
  try {
    // Se for React Native, troque localStorage por AsyncStorage
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Erro ao salvar no storage:", error);
  }
}

export async function buscar(key: string): Promise<any> {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error("Erro ao buscar no storage:", error);
    return null;
  }
}