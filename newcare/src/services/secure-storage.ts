import * as SecureStore from "expo-secure-store";

const memoriaSegura: Record<string, string> = {};

async function executarComFallback<T>(
  acaoSecureStore: () => Promise<T>,
  acaoMemoria: () => T
) {
  try {
    return await acaoSecureStore();
  } catch (error) {
    console.warn("SecureStore indisponível. Usando storage seguro em memória.", error);
    return acaoMemoria();
  }
}

export const salvarSeguro = async <T,>(chave: string, valor: T) => {
  const data = JSON.stringify(valor);

  await executarComFallback(
    () => SecureStore.setItemAsync(chave, data),
    () => {
      memoriaSegura[chave] = data;
    }
  );
};

export const buscarSeguro = async <T,>(chave: string): Promise<T | null> => {
  const data = await executarComFallback(
    () => SecureStore.getItemAsync(chave),
    () => memoriaSegura[chave] ?? null
  );

  return data ? (JSON.parse(data) as T) : null;
};

export const removerSeguro = async (chave: string) => {
  await executarComFallback(
    () => SecureStore.deleteItemAsync(chave),
    () => {
      delete memoriaSegura[chave];
    }
  );
};
