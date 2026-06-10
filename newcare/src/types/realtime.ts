export interface LeituraIoT {
  topico: string;
  valor: string;
  atualizadoEm: number;
}

export interface AguaCalculoPayload {
  pesoKg: number;
  temperaturaC: number;
}

export interface AguaResultado {
  ml: number;
  litros: number;
  temperaturaC: number;
  pesoKg: number;
  atualizadoEm: number;
}

export interface AguaConsumoPayload {
  usuarioId: string;
  medidaMl: number;
  consumidoMl: number;
  metaMl: number;
  metaBatida: boolean;
}
