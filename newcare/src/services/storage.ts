import AsyncStorage from "@react-native-async-storage/async-storage";

const memoria: Record<string, string> = {};

async function executarComFallback<T>(
  acaoAsyncStorage: () => Promise<T>,
  acaoMemoria: () => T
) {
  try {
    return await acaoAsyncStorage();
  } catch (error) {
    console.warn("AsyncStorage indisponível. Usando storage em memória.", error);
    return acaoMemoria();
  }
}

export const salvar = async <T,>(chave: string, valor: T) => {
  const data = JSON.stringify(valor);

  await executarComFallback(
    () => AsyncStorage.setItem(chave, data),
    () => {
      memoria[chave] = data;
    }
  );
};

export const buscar = async <T,>(chave: string): Promise<T | null> => {
  const data = await executarComFallback(
    () => AsyncStorage.getItem(chave),
    () => memoria[chave] ?? null
  );

  return data ? (JSON.parse(data) as T) : null;
};

export const remover = async (chave: string) => {
  await executarComFallback(
    () => AsyncStorage.removeItem(chave),
    () => {
      delete memoria[chave];
    }
  );
};
