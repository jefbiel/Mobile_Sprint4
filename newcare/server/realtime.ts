import cors from "cors";
import express, { Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import { AguaCalculoPayload, AguaConsumoPayload, AguaResultado, LeituraIoT } from "../src/types/realtime";

interface CorpoPublicacao {
  topico: string;
  valor: string;
}

const PORT = Number(process.env.PORT ?? 3000);
const estado = new Map<string, LeituraIoT>();
let tick = 0;

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

function calcularAgua({ pesoKg, temperaturaC }: AguaCalculoPayload): AguaResultado {
  const extraPorCalor = Math.max(0, temperaturaC - 24) * 80;
  const ml = Math.round(pesoKg * 35 + extraPorCalor);

  return {
    ml,
    litros: Number((ml / 1000).toFixed(2)),
    pesoKg,
    temperaturaC,
    atualizadoEm: Date.now(),
  };
}

function publicar(topico: string, valor: string) {
  const leitura = { topico, valor, atualizadoEm: Date.now() };
  estado.set(topico, leitura);
  io.emit("iot:leitura", leitura);
  console.log(`[iot] ${topico}: ${valor}`);
}

app.get("/api/leituras/:grupo/:local/:tipo", (req: Request, res: Response) => {
  const topico = `${req.params.grupo}/${req.params.local}/${req.params.tipo}`;
  const leitura = estado.get(topico);

  if (!leitura) {
    res.status(404).json({ erro: `topico nao encontrado: ${topico}` });
    return;
  }

  res.json(leitura);
});

app.post("/api/publicar", (req: Request<unknown, unknown, CorpoPublicacao>, res: Response) => {
  const { topico, valor } = req.body;

  if (typeof topico !== "string" || typeof valor !== "string") {
    res.status(400).json({ erro: "topico e valor sao obrigatorios" });
    return;
  }

  publicar(topico, valor);
  res.json({ ok: true });
});

io.on("connection", (socket) => {
  console.log(`[socket] cliente conectado: ${socket.id}`);

  for (const leitura of estado.values()) {
    socket.emit("iot:leitura", leitura);
  }

  socket.on("agua:calcular", (payload: AguaCalculoPayload) => {
    if (
      !Number.isFinite(payload?.pesoKg) ||
      !Number.isFinite(payload?.temperaturaC) ||
      payload.pesoKg <= 0
    ) {
      socket.emit("agua:erro", { mensagem: "Informe peso e temperatura válidos." });
      return;
    }

    socket.emit("agua:resultado", calcularAgua(payload));
  });

  socket.on("agua:consumo", (payload: AguaConsumoPayload) => {
    publicar("sensor/hidratacao/consumo", String(payload.consumidoMl));
    publicar("sensor/hidratacao/meta", payload.metaBatida ? "batida" : "em-andamento");
    console.log(
      `[agua] ${payload.usuarioId}: +${payload.medidaMl}ml | ${payload.consumidoMl}/${payload.metaMl}ml`
    );
  });
});

function proximaTemperatura() {
  const oscilacao = Math.sin(tick / 5) * 7;
  const ruido = (Math.random() - 0.5) * 1.8;
  return Math.max(15, Math.min(38, 25 + oscilacao + ruido)).toFixed(1);
}

function proximaUmidade() {
  const oscilacao = Math.sin(tick / 8 + 1) * 18;
  return Math.max(30, Math.min(85, 56 + oscilacao)).toFixed(0);
}

setInterval(() => {
  tick++;
  publicar("sensor/casa/temperatura", proximaTemperatura());
  publicar("sensor/casa/umidade", proximaUmidade());
  publicar("sensor/status/conexao", tick % 10 === 0 ? "alerta" : "online");
}, 5000);

httpServer.listen(PORT, () => {
  console.log(`Servidor Socket.IO/IoT em http://localhost:${PORT}`);
});
