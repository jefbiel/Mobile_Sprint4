import Constants from "expo-constants";
import { io, Socket } from "socket.io-client";
import { AguaCalculoPayload, AguaConsumoPayload, AguaResultado, LeituraIoT } from "../types/realtime";

const FALLBACK_URL = "http://localhost:3000";

function resolverBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_REALTIME_URL;
  if (envUrl) return envUrl;

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(":")[0];

  return host ? `http://${host}:3000` : FALLBACK_URL;
}

export const REALTIME_URL = resolverBaseUrl();

export function conectarSocketIo(params: {
  onConexao: (conectado: boolean) => void;
  onLeituraIoT: (leitura: LeituraIoT) => void;
  onResultadoAgua: (resultado: AguaResultado) => void;
  onErro: (mensagem: string) => void;
}): Socket {
  const socket = io(REALTIME_URL, {
    transports: ["websocket"],
    reconnectionAttempts: 5,
    timeout: 5000,
  });

  socket.on("connect", () => params.onConexao(true));
  socket.on("disconnect", () => params.onConexao(false));
  socket.on("connect_error", () => {
    params.onConexao(false);
    params.onErro("Servidor em tempo real indisponível.");
  });
  socket.on("iot:leitura", params.onLeituraIoT);
  socket.on("agua:resultado", params.onResultadoAgua);
  socket.on("agua:erro", (erro: { mensagem?: string }) => {
    params.onErro(erro.mensagem ?? "Não foi possível calcular a hidratação.");
  });

  return socket;
}

export function publicarCalculoAguaIo(socket: Socket | null, payload: AguaCalculoPayload) {
  if (!socket?.connected) {
    throw new Error("Socket.IO desconectado.");
  }

  socket.emit("agua:calcular", payload);
}

export function publicarConsumoAguaIo(socket: Socket | null, payload: AguaConsumoPayload) {
  if (!socket?.connected) return;

  socket.emit("agua:consumo", payload);
}
