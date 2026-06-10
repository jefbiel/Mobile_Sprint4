import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as Location from "expo-location";
import { Socket } from "socket.io-client";
import { useApp } from "../context/AppContext";
import { CardMissao } from "../components/CardMissao";
import { StatusMissao } from "../types";
import { AppColors } from "../../constants/theme";
import { BrandHeader } from "../components/BrandHeader";
import { conectarSocketIo, publicarCalculoAguaIo, publicarConsumoAguaIo, REALTIME_URL } from "../services/realtime";
import { AguaResultado, LeituraIoT } from "../types/realtime";

const MEDIDAS_AGUA = [250, 300, 500, 750, 1000, 1500, 2000];

function progressoNivel(xp: number) {
  const faixas = [0, 100, 250, 500, 900, 1400];
  const atual = [...faixas].reverse().find((valor) => xp >= valor) ?? 0;
  const proxima = faixas.find((valor) => valor > xp) ?? xp + 500;
  return {
    percentual: Math.min(((xp - atual) / (proxima - atual)) * 100, 100),
    proxima,
  };
}

export function HomeScreen() {
  const {
    colors,
    usuario,
    missoes,
    hidratacao,
    completarMissao,
    selecionarMedidaAgua,
    registrarAguaBebida,
  } = useApp();
  const styles = criarStyles(colors);
  const socketRef = useRef<Socket | null>(null);
  const [socketConectado, setSocketConectado] = useState(false);
  const [leituras, setLeituras] = useState<Record<string, LeituraIoT>>({});
  const [erroRealtime, setErroRealtime] = useState<string | null>(null);
  const [peso, setPeso] = useState("70");
  const [temperaturaManual, setTemperaturaManual] = useState("");
  const [resultadoAgua, setResultadoAgua] = useState<AguaResultado | null>(null);
  const [calculandoAgua, setCalculandoAgua] = useState(false);
  const [localizacaoStatus, setLocalizacaoStatus] = useState<"idle" | "loading" | "success" | "denied" | "error">("idle");
  const [localizacaoTexto, setLocalizacaoTexto] = useState<string | null>(null);
  const concluidas = missoes.filter((m) => m.status === StatusMissao.Concluida).length;
  const pendentes = missoes.filter((m) => m.status === StatusMissao.Pendente);
  const percentualHoje = Math.round((concluidas / Math.max(1, missoes.length)) * 100);
  const xp = progressoNivel(usuario?.xp ?? 0);
  const temperaturaIoT = Number(leituras["sensor/casa/temperatura"]?.valor);
  const temperaturaAtual = Number(temperaturaManual.replace(",", ".")) || temperaturaIoT || 25;
  const umidadeAtual = leituras["sensor/casa/umidade"]?.valor;
  const statusSensor = leituras["sensor/status/conexao"]?.valor ?? "aguardando";

  const calculoLocal = useMemo(() => {
    const pesoKg = Number(peso.replace(",", "."));
    if (!Number.isFinite(pesoKg) || pesoKg <= 0) return null;

    const extraPorCalor = Math.max(0, temperaturaAtual - 24) * 80;
    const ml = Math.round(pesoKg * 35 + extraPorCalor);
    return {
      ml,
      litros: Number((ml / 1000).toFixed(2)),
    };
  }, [peso, temperaturaAtual]);
  const metaAguaMl = resultadoAgua?.ml ?? calculoLocal?.ml ?? 0;
  const progressoAgua = metaAguaMl > 0 ? Math.min((hidratacao.consumidoMl / metaAguaMl) * 100, 100) : 0;
  const medidasRestantes = metaAguaMl > 0
    ? Math.max(0, Math.ceil((metaAguaMl - hidratacao.consumidoMl) / hidratacao.medidaPadraoMl))
    : 0;
  const medidasTotais = metaAguaMl > 0 ? Math.ceil(metaAguaMl / hidratacao.medidaPadraoMl) : 0;
  const tipoMedida = hidratacao.medidaPadraoMl >= 1000 ? "garrafa" : "copo";

  useEffect(() => {
    const socket = conectarSocketIo({
      onConexao: setSocketConectado,
      onLeituraIoT: (leitura) => {
        setErroRealtime(null);
        setLeituras((atuais) => ({ ...atuais, [leitura.topico]: leitura }));
      },
      onResultadoAgua: (resultado) => {
        setCalculandoAgua(false);
        setResultadoAgua(resultado);
      },
      onErro: (mensagem) => {
        setCalculandoAgua(false);
        setErroRealtime(mensagem);
      },
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  function concluirMissao(id: string) {
    const missao = missoes.find((item) => item.id === id);
    completarMissao(id);
    if (missao?.status === StatusMissao.Pendente) {
      Alert.alert("Missão concluída", `Você ganhou ${missao.recompensaXp} XP.`);
    }
  }

  function calcularAgua() {
    const pesoKg = Number(peso.replace(",", "."));

    if (!Number.isFinite(pesoKg) || pesoKg <= 0) {
      Alert.alert("Peso inválido", "Informe seu peso em kg para calcular a quantidade de água.");
      return;
    }

    setCalculandoAgua(true);
    setErroRealtime(null);

    try {
      publicarCalculoAguaIo(socketRef.current, { pesoKg, temperaturaC: temperaturaAtual });
    } catch {
      setCalculandoAgua(false);
      setResultadoAgua({
        ml: calculoLocal?.ml ?? 0,
        litros: calculoLocal?.litros ?? 0,
        pesoKg,
        temperaturaC: temperaturaAtual,
        atualizadoEm: Date.now(),
      });
      setErroRealtime("Usando cálculo local porque o Socket.IO está offline.");
    }
  }

  async function solicitarLocalizacao() {
    setLocalizacaoStatus("loading");
    setLocalizacaoTexto(null);

    try {
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (permissao.status !== Location.PermissionStatus.GRANTED) {
        setLocalizacaoStatus("denied");
        setLocalizacaoTexto("Permissão recusada. O cálculo continua usando a temperatura do sensor ou valor manual.");
        return;
      }

      const posicao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocalizacaoStatus("success");
      setLocalizacaoTexto(
        `Localização registrada: ${posicao.coords.latitude.toFixed(3)}, ${posicao.coords.longitude.toFixed(3)}`
      );
    } catch {
      setLocalizacaoStatus("error");
      setLocalizacaoTexto("Não foi possível obter a localização agora.");
    }
  }

  async function registrarConsumoAgua() {
    if (metaAguaMl <= 0 || !usuario) return;

    const atualizada = await registrarAguaBebida(metaAguaMl);
    publicarConsumoAguaIo(socketRef.current, {
      usuarioId: usuario.id,
      medidaMl: atualizada.medidaPadraoMl,
      consumidoMl: atualizada.consumidoMl,
      metaMl: metaAguaMl,
      metaBatida: atualizada.metaBatida,
    });

    if (!hidratacao.metaBatida && atualizada.metaBatida) {
      Alert.alert("Meta de água batida", "Você ganhou 25 XP e 5 moedas.");
    }
  }

  const cabecalho = (
    <>
      <BrandHeader compact />
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.saudacao}>Olá, {usuario?.nome}</Text>
          <Text style={styles.subtitulo}>
            Level {usuario?.nivel} • Especialidade: {usuario?.areaDominante}
          </Text>
        </View>
      </View>

      <View style={styles.painel}>
        <View style={styles.painelTopo}>
          <View>
            <Text style={styles.painelLabel}>Evolução atual</Text>
            <Text style={styles.painelTitulo}>Nível {usuario?.nivel}</Text>
          </View>
          <View style={styles.xpPill}>
            <Text style={styles.xpPillTexto}>⭐ {usuario?.xp} XP</Text>
          </View>
        </View>
        <View style={styles.barra}>
          <View style={[styles.barraInterna, { width: `${xp.percentual}%` }]} />
        </View>
        <Text style={styles.meta}>Próximo nível em {xp.proxima} XP</Text>
      </View>

      <View style={styles.resumoGrid}>
        <View style={styles.resumoCard}>
          <Text style={styles.resumoValor}>{percentualHoje}%</Text>
          <Text style={styles.resumoLabel}>Hoje</Text>
        </View>
        <View style={styles.resumoCard}>
          <Text style={styles.resumoValor}>🔥 {usuario?.streak}</Text>
          <Text style={styles.resumoLabel}>Streak</Text>
        </View>
        <View style={styles.resumoCard}>
          <Text style={styles.resumoValor}>{pendentes.length}</Text>
          <Text style={styles.resumoLabel}>Pendentes</Text>
        </View>
      </View>

      <View style={styles.hidratacaoCard}>
        <View style={styles.linhaStatus}>
          <View>
            <Text style={styles.painelLabelDestaque}>Hidratação inteligente</Text>
            <Text style={styles.hidratacaoTitulo}>
              {resultadoAgua?.litros ?? calculoLocal?.litros ?? "--"} L hoje
            </Text>
          </View>
          <View style={[styles.statusPill, socketConectado ? styles.statusOnline : styles.statusOffline]}>
            <Text style={styles.statusTexto}>{socketConectado ? "tempo real" : "offline"}</Text>
          </View>
        </View>

        <View style={styles.inputsLinha}>
          <View style={styles.inputGrupo}>
            <Text style={styles.inputLabel}>Peso kg</Text>
            <TextInput
              value={peso}
              onChangeText={setPeso}
              keyboardType="numeric"
              placeholder="70"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </View>
          <View style={styles.inputGrupo}>
            <Text style={styles.inputLabel}>Temperatura °C</Text>
            <TextInput
              value={temperaturaManual}
              onChangeText={setTemperaturaManual}
              keyboardType="numeric"
              placeholder={Number.isFinite(temperaturaIoT) ? `${temperaturaIoT.toFixed(1)}` : "25"}
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.iotGrid}>
          <View style={styles.iotItem}>
            <Text style={styles.iotValor}>{Number.isFinite(temperaturaIoT) ? `${temperaturaIoT.toFixed(1)}°C` : "--"}</Text>
            <Text style={styles.iotLabel}>Sensor IoT</Text>
          </View>
          <View style={styles.iotItem}>
            <Text style={styles.iotValor}>{umidadeAtual ? `${umidadeAtual}%` : "--"}</Text>
            <Text style={styles.iotLabel}>Umidade</Text>
          </View>
          <View style={styles.iotItem}>
            <Text style={styles.iotValor}>{statusSensor}</Text>
            <Text style={styles.iotLabel}>Status</Text>
          </View>
        </View>

        <View style={styles.acoesLinha}>
          <Pressable style={styles.botaoPrimario} onPress={calcularAgua}>
            {calculandoAgua ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.botaoPrimarioTexto}>Calcular</Text>
            )}
          </Pressable>
          <Pressable style={styles.botaoSecundario} onPress={solicitarLocalizacao}>
            <Text style={styles.botaoSecundarioTexto}>
              {localizacaoStatus === "loading" ? "Localizando..." : "Usar localização"}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.feedbackTexto}>
          {erroRealtime ?? localizacaoTexto ?? `Servidor: ${REALTIME_URL}`}
        </Text>
      </View>

      <View style={styles.medidorCard}>
        <View style={styles.linhaStatus}>
          <View style={styles.medidorTituloBox}>
            <Text style={styles.painelLabelDestaque}>Medidor padrão</Text>
            <Text style={styles.medidorTitulo}>
              {medidasRestantes > 0 ? `${medidasRestantes} ${tipoMedida}${medidasRestantes > 1 ? "s" : ""} restantes` : "Meta concluída"}
            </Text>
          </View>
          <Text style={styles.medidorResumo}>
            {hidratacao.consumidoMl}/{metaAguaMl || "--"} ml
          </Text>
        </View>

        <View style={styles.medidasGrid}>
          {MEDIDAS_AGUA.map((medida) => {
            const selecionada = medida === hidratacao.medidaPadraoMl;
            return (
              <Pressable
                key={medida}
                onPress={() => selecionarMedidaAgua(medida)}
                style={[styles.medidaOpcao, selecionada && styles.medidaOpcaoAtiva]}
              >
                <Text style={[styles.medidaTexto, selecionada && styles.medidaTextoAtivo]}>
                  {medida >= 1000 ? `${medida / 1000} L` : `${medida} ml`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.barraAgua}>
          <View style={[styles.barraAguaInterna, { width: `${progressoAgua}%` }]} />
        </View>

        <Text style={styles.feedbackTexto}>
          {medidasTotais > 0
            ? `Sua meta equivale a ${medidasTotais} ${tipoMedida}${medidasTotais > 1 ? "s" : ""} de ${hidratacao.medidaPadraoMl} ml.`
            : "Calcule a hidratação para ver a quantidade de copos."}
        </Text>

        <Pressable
          style={[styles.botaoRegistrarAgua, metaAguaMl <= 0 && styles.botaoDesabilitado]}
          onPress={registrarConsumoAgua}
          disabled={metaAguaMl <= 0}
        >
          <Text style={styles.botaoPrimarioTexto}>
            Registrar {tipoMedida} de {hidratacao.medidaPadraoMl >= 1000 ? `${hidratacao.medidaPadraoMl / 1000} L` : `${hidratacao.medidaPadraoMl} ml`}
          </Text>
        </Pressable>
      </View>

      <View style={styles.linhaTitulo}>
        <View>
          <Text style={styles.tituloSecao}>Próximas missões</Text>
          <Text style={styles.descricaoSecao}>Complete tarefas para ganhar XP e moedas.</Text>
        </View>
        <Text style={styles.contador}>{concluidas}/{missoes.length}</Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={pendentes.length > 0 ? pendentes : missoes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CardMissao missao={item} onPress={concluirMissao} />
        )}
        ListHeaderComponent={cabecalho}
        ListEmptyComponent={
          <View style={styles.estadoVazio}>
            <Text style={styles.estadoVazioTitulo}>Tudo pronto por hoje</Text>
            <Text style={styles.estadoVazioTexto}>Você concluiu todas as missões disponíveis.</Text>
          </View>
        }
        contentContainerStyle={styles.listaConteudo}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const criarStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listaConteudo: {
    padding: 20,
    paddingTop: 56,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  headerInfo: {
    flex: 1,
  },
  marca: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  saudacao: {
    fontSize: 25,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 2,
  },
  subtitulo: {
    color: colors.muted,
    marginTop: 4,
    marginBottom: 12,
  },
  painel: {
    backgroundColor: colors.text,
    borderRadius: 18,
    padding: 18,
    marginTop: 18,
    marginBottom: 14,
    shadowColor: colors.secondary,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  painelTopo: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  painelLabel: {
    color: colors.primarySoft,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  painelLabelDestaque: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  painelTitulo: {
    color: colors.surface,
    fontWeight: "900",
    fontSize: 24,
    marginTop: 2,
  },
  xpPill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  xpPillTexto: {
    color: colors.surface,
    fontWeight: "900",
  },
  barra: {
    height: 9,
    borderRadius: 999,
    backgroundColor: "#174A6B",
    marginTop: 16,
    overflow: "hidden",
  },
  barraInterna: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  meta: {
    color: colors.primarySoft,
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  resumoGrid: {
    flexDirection: "row",
    gap: 10,
  },
  hidratacaoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
  },
  linhaStatus: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  hidratacaoTitulo: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 2,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusOnline: {
    backgroundColor: colors.successSoft,
  },
  statusOffline: {
    backgroundColor: colors.warningSoft,
  },
  statusTexto: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  inputsLinha: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  inputGrupo: {
    flex: 1,
  },
  inputLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  iotGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  iotItem: {
    backgroundColor: colors.card,
    borderRadius: 10,
    flex: 1,
    minHeight: 58,
    padding: 10,
  },
  iotValor: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  iotLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 3,
  },
  acoesLinha: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  botaoPrimario: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 12,
  },
  botaoPrimarioTexto: {
    color: colors.surface,
    fontWeight: "900",
  },
  botaoSecundario: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 12,
  },
  botaoSecundarioTexto: {
    color: colors.text,
    fontWeight: "900",
  },
  feedbackTexto: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10,
  },
  medidorCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    padding: 16,
  },
  medidorTituloBox: {
    flex: 1,
  },
  medidorTitulo: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  medidorResumo: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 3,
  },
  medidasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  medidaOpcao: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 40,
    minWidth: 70,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  medidaOpcaoAtiva: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  medidaTexto: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  medidaTextoAtivo: {
    color: colors.surface,
  },
  barraAgua: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    height: 10,
    marginTop: 14,
    overflow: "hidden",
  },
  barraAguaInterna: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
    height: "100%",
  },
  botaoRegistrarAgua: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    justifyContent: "center",
    marginTop: 14,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  botaoDesabilitado: {
    opacity: 0.5,
  },
  resumoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  resumoValor: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  resumoLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  linhaTitulo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 12,
  },
  tituloSecao: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
  },
  descricaoSecao: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  contador: {
    color: colors.primary,
    fontWeight: "900",
    fontSize: 16,
  },
  estadoVazio: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  estadoVazioTitulo: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  estadoVazioTexto: {
    color: colors.muted,
    marginTop: 4,
  },
});
