import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Socket } from "socket.io-client";
import { useApp } from "../context/AppContext";
import { AppColors } from "../../constants/theme";
import { Botao } from "../components/Botao";
import { BrandHeader } from "../components/BrandHeader";
import {
  conectarSocketIo,
  publicarCalculoAguaIo,
  publicarConsumoAguaIo,
  REALTIME_URL,
} from "../services/realtime";
import { AguaResultado, LeituraIoT } from "../types/realtime";

type NivelAtividade = "baixo" | "moderado" | "alto";
type StatusLocalizacao = "nao-solicitada" | "carregando" | "permitida" | "recusada" | "erro";

interface LocalizacaoUsuario {
  latitude: number;
  longitude: number;
  cidade?: string;
  regiao?: string;
}

interface DadosCalculo {
  pesoKg: number;
  alturaCm: number;
  idade: number;
  nivelAtividade: NivelAtividade;
  temperaturaC: number;
  umidadePercentual: number;
  adicionalAtividadeMl: number;
}

const medidas = [250, 300, 500, 750, 1000, 1500, 2000];
const niveisAtividade = [
  { label: "Baixo", valor: "baixo", adicionalMl: 0 },
  { label: "Moderado", valor: "moderado", adicionalMl: 350 },
  { label: "Alto", valor: "alto", adicionalMl: 700 },
] as const;

function numeroDoCampo(valor: string) {
  return Number(valor.replace(",", "."));
}

function formatarHora(timestamp?: number) {
  if (!timestamp) return "aguardando";

  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HidratacaoScreen() {
  const {
    colors,
    hidratacao,
    registrarAguaBebida,
    salvarMetaHidratacao,
    selecionarMedidaAgua,
    usuario,
  } = useApp();
  const styles = criarStyles(colors);
  const socketRef = useRef<Socket | null>(null);
  const ultimoCalculoRef = useRef<DadosCalculo | null>(null);
  const [peso, setPeso] = useState(String(hidratacao.dadosSaude?.pesoKg ?? ""));
  const [altura, setAltura] = useState(String(hidratacao.dadosSaude?.alturaCm ?? ""));
  const [idade, setIdade] = useState(String(hidratacao.dadosSaude?.idade ?? ""));
  const [temperatura, setTemperatura] = useState(String(hidratacao.dadosSaude?.temperaturaC ?? 25));
  const [umidade, setUmidade] = useState(String(hidratacao.dadosSaude?.umidadePercentual ?? 62));
  const [nivelAtividade, setNivelAtividade] = useState<NivelAtividade>(
    hidratacao.dadosSaude?.nivelAtividade ?? "moderado"
  );
  const [socketConectado, setSocketConectado] = useState(false);
  const [erroTempoReal, setErroTempoReal] = useState("");
  const [leiturasIoT, setLeiturasIoT] = useState<Record<string, LeituraIoT>>({});
  const [aguardandoCalculo, setAguardandoCalculo] = useState(false);
  const [statusLocalizacao, setStatusLocalizacao] = useState<StatusLocalizacao>("nao-solicitada");
  const [erroLocalizacao, setErroLocalizacao] = useState("");
  const [localizacao, setLocalizacao] = useState<LocalizacaoUsuario | null>(null);

  const pesoKg = numeroDoCampo(peso);
  const alturaCm = numeroDoCampo(altura);
  const idadeAnos = numeroDoCampo(idade);
  const temp = numeroDoCampo(temperatura);
  const umidadePercentual = numeroDoCampo(umidade);
  const atividade = niveisAtividade.find((item) => item.valor === nivelAtividade) ?? niveisAtividade[1];
  const metaMl = hidratacao.metaMl ?? 0;
  const restanteMl = Math.max(0, metaMl - hidratacao.consumidoMl);
  const coposRestantes = metaMl > 0 ? Math.ceil(restanteMl / hidratacao.medidaPadraoMl) : 0;
  const progresso = metaMl > 0 ? Math.min((hidratacao.consumidoMl / metaMl) * 100, 100) : 0;
  const leituraTemperatura = leiturasIoT["sensor/casa/temperatura"];
  const leituraUmidade = leiturasIoT["sensor/casa/umidade"];
  const leituraStatus = leiturasIoT["sensor/status/conexao"];
  const ultimaAtualizacao = Math.max(
    leituraTemperatura?.atualizadoEm ?? 0,
    leituraUmidade?.atualizadoEm ?? 0,
    leituraStatus?.atualizadoEm ?? 0
  );
  const sensorStatus = leituraStatus?.valor ?? (socketConectado ? "conectado" : "offline");

  const receberLeituraIoT = useCallback((leitura: LeituraIoT) => {
    setLeiturasIoT((atuais) => ({
      ...atuais,
      [leitura.topico]: leitura,
    }));

    if (leitura.topico === "sensor/casa/temperatura") {
      setTemperatura(leitura.valor);
    }

    if (leitura.topico === "sensor/casa/umidade") {
      setUmidade(leitura.valor);
    }
  }, []);

  const receberResultadoAgua = useCallback(async (resultado: AguaResultado) => {
    setAguardandoCalculo(false);
    const dados = ultimoCalculoRef.current;

    if (!dados) return;

    await salvarMetaHidratacao(
      {
        pesoKg: dados.pesoKg,
        alturaCm: dados.alturaCm,
        idade: dados.idade,
        nivelAtividade: dados.nivelAtividade,
        temperaturaC: resultado.temperaturaC,
        umidadePercentual: dados.umidadePercentual,
      },
      resultado.ml + dados.adicionalAtividadeMl
    );

    Alert.alert(
      "Meta calculada em tempo real",
      `O servidor definiu sua meta em ${((resultado.ml + dados.adicionalAtividadeMl) / 1000).toFixed(2)} L.`
    );
  }, [salvarMetaHidratacao]);

  useEffect(() => {
    const socket = conectarSocketIo({
      onConexao: (conectado) => {
        setSocketConectado(conectado);
        if (conectado) setErroTempoReal("");
      },
      onLeituraIoT: receberLeituraIoT,
      onResultadoAgua: receberResultadoAgua,
      onErro: (mensagem) => {
        setAguardandoCalculo(false);
        setErroTempoReal(mensagem);
      },
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [receberLeituraIoT, receberResultadoAgua]);

  function camposBasicosValidos() {
    return (
      Number.isFinite(pesoKg) &&
      pesoKg > 0 &&
      Number.isFinite(alturaCm) &&
      alturaCm > 0 &&
      Number.isFinite(idadeAnos) &&
      idadeAnos > 0
    );
  }

  function calcularMetaLocal() {
    if (!Number.isFinite(pesoKg) || pesoKg <= 0) return 0;

    const base = pesoKg * 35;
    const alturaAjuste = Number.isFinite(alturaCm) && alturaCm > 0 ? Math.max(0, alturaCm - 160) * 3 : 0;
    const idadeAjuste = Number.isFinite(idadeAnos) && idadeAnos >= 60 ? -150 : 0;
    const calorAjuste = Number.isFinite(temp) ? Math.max(0, temp - 24) * 80 : 0;
    const umidadeAjuste = Number.isFinite(umidadePercentual) && umidadePercentual < 35 ? 150 : 0;

    return Math.max(
      1200,
      Math.round(base + alturaAjuste + idadeAjuste + calorAjuste + umidadeAjuste + atividade.adicionalMl)
    );
  }

  async function salvarMetaLocal() {
    const calculada = calcularMetaLocal();

    await salvarMetaHidratacao(
      {
        pesoKg,
        alturaCm,
        idade: idadeAnos,
        nivelAtividade,
        temperaturaC: Number.isFinite(temp) ? temp : 25,
        umidadePercentual: Number.isFinite(umidadePercentual) ? umidadePercentual : 62,
      },
      calculada
    );

    Alert.alert("Meta calculada", `Sua meta diária foi definida em ${(calculada / 1000).toFixed(2)} L.`);
  }

  async function calcularESalvar() {
    if (!camposBasicosValidos()) {
      Alert.alert("Complete seus dados", "Informe peso, altura e idade para calcular a meta de água.");
      return;
    }

    ultimoCalculoRef.current = {
      pesoKg,
      alturaCm,
      idade: idadeAnos,
      nivelAtividade,
      temperaturaC: Number.isFinite(temp) ? temp : 25,
      umidadePercentual: Number.isFinite(umidadePercentual) ? umidadePercentual : 62,
      adicionalAtividadeMl: atividade.adicionalMl,
    };

    if (socketRef.current?.connected && Number.isFinite(temp)) {
      setAguardandoCalculo(true);
      setErroTempoReal("");
      publicarCalculoAguaIo(socketRef.current, {
        pesoKg,
        temperaturaC: temp,
      });
      return;
    }

    setErroTempoReal("Servidor offline. O app usou o cálculo local como alternativa.");
    await salvarMetaLocal();
  }

  async function registrar() {
    if (metaMl <= 0) {
      Alert.alert("Informe seu peso", "O peso é necessário para calcular a meta diária.");
      return;
    }

    const atualizada = await registrarAguaBebida(metaMl);

    publicarConsumoAguaIo(socketRef.current, {
      usuarioId: usuario?.id ?? "usuario-local",
      medidaMl: hidratacao.medidaPadraoMl,
      consumidoMl: atualizada.consumidoMl,
      metaMl,
      metaBatida: atualizada.metaBatida,
    });

    if (atualizada.metaBatida && !hidratacao.metaBatida) {
      Alert.alert("Meta de água batida", "Você ganhou 25 XP e 5 moedas.");
    }
  }

  async function usarLocalizacao() {
    try {
      setStatusLocalizacao("carregando");
      setErroLocalizacao("");

      const permissao = await Location.requestForegroundPermissionsAsync();

      if (permissao.status !== "granted") {
        setStatusLocalizacao("recusada");
        setErroLocalizacao("Permissão recusada. Você ainda pode usar temperatura manual ou sensor IoT.");
        return;
      }

      const posicao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const endereco = await Location.reverseGeocodeAsync(posicao.coords);
      const primeiroEndereco = endereco[0];

      setLocalizacao({
        latitude: posicao.coords.latitude,
        longitude: posicao.coords.longitude,
        cidade: primeiroEndereco?.city ?? primeiroEndereco?.subregion ?? undefined,
        regiao: primeiroEndereco?.region ?? undefined,
      });
      setStatusLocalizacao("permitida");
    } catch {
      setStatusLocalizacao("erro");
      setErroLocalizacao("Não foi possível obter a localização agora.");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BrandHeader compact showBackButton />
        <Text style={styles.titulo}>Hidratação Inteligente</Text>
        <Text style={styles.subtitulo}>
          Preencha seus dados uma vez para calcular quanto de água beber no dia.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardTopo}>
            <View>
              <Text style={styles.valor}>{metaMl ? `${(metaMl / 1000).toFixed(2)} L` : "--"}</Text>
              <Text style={styles.label}>Meta diária</Text>
            </View>
            <View style={[styles.statusPill, socketConectado ? styles.statusOk : styles.statusAlerta]}>
              <Text style={styles.statusTexto}>{socketConectado ? "tempo real" : "offline"}</Text>
            </View>
          </View>
          <View style={styles.barra}><View style={[styles.barraInterna, { width: `${progresso}%` }]} /></View>
          <Text style={styles.texto}>
            {hidratacao.consumidoMl}/{metaMl || "--"} ml consumidos - {coposRestantes} medidas restantes
          </Text>
          {!!erroTempoReal && <Text style={styles.erroTexto}>{erroTempoReal}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.labelForte}>Seus dados para o cálculo</Text>
          <Text style={styles.textoPequeno}>
            Informe peso, altura e idade. A temperatura e umidade podem vir do sensor IoT ou ser ajustadas manualmente.
          </Text>

          <View style={styles.linha}>
            <TextInput
              style={styles.input}
              placeholder="Peso kg"
              placeholderTextColor={colors.muted}
              value={peso}
              onChangeText={setPeso}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Altura cm"
              placeholderTextColor={colors.muted}
              value={altura}
              onChangeText={setAltura}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.linha}>
            <TextInput
              style={styles.input}
              placeholder="Idade"
              placeholderTextColor={colors.muted}
              value={idade}
              onChangeText={setIdade}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Temperatura"
              placeholderTextColor={colors.muted}
              value={temperatura}
              onChangeText={setTemperatura}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.linha}>
            <TextInput
              style={styles.input}
              placeholder="Umidade %"
              placeholderTextColor={colors.muted}
              value={umidade}
              onChangeText={setUmidade}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.labelForte}>Atividade física</Text>
          <View style={styles.chipsCompactos}>
            {niveisAtividade.map((item) => (
              <TouchableOpacity
                key={item.valor}
                style={[styles.chip, nivelAtividade === item.valor && styles.chipAtivo]}
                onPress={() => setNivelAtividade(item.valor)}
              >
                <Text style={[styles.chipTexto, nivelAtividade === item.valor && styles.chipTextoAtivo]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Botao
            titulo={aguardandoCalculo ? "Calculando no servidor..." : metaMl > 0 ? "Recalcular meta" : "Salvar dados e calcular meta"}
            onPress={calcularESalvar}
            carregando={aguardandoCalculo}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.labelForte}>Sensores IoT</Text>
          <Text style={styles.textoPequeno}>Servidor: {REALTIME_URL}</Text>
          <View style={styles.grid}>
            <View style={styles.info}>
              <Text style={styles.infoValor}>{leituraTemperatura?.valor ?? temperatura}°C</Text>
              <Text style={styles.infoLabel}>Temperatura</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.infoValor}>{(leituraUmidade?.valor ?? umidade) || "--"}%</Text>
              <Text style={styles.infoLabel}>Umidade</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.infoValor}>{sensorStatus}</Text>
              <Text style={styles.infoLabel}>Status</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.infoValor}>{formatarHora(ultimaAtualizacao)}</Text>
              <Text style={styles.infoLabel}>Atualização</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.labelForte}>Localização nativa</Text>
          <Text style={styles.texto}>
            {localizacao
              ? `${localizacao.cidade ?? "Local atual"}${localizacao.regiao ? ` - ${localizacao.regiao}` : ""}`
              : "Use a localização para registrar o contexto do cálculo."}
          </Text>
          {localizacao && (
            <Text style={styles.textoPequeno}>
              Lat {localizacao.latitude.toFixed(4)} | Long {localizacao.longitude.toFixed(4)}
            </Text>
          )}
          {!!erroLocalizacao && <Text style={styles.erroTexto}>{erroLocalizacao}</Text>}
          <TouchableOpacity
            style={styles.botaoLocalizacao}
            onPress={usarLocalizacao}
            disabled={statusLocalizacao === "carregando"}
          >
            <Text style={styles.botaoLocalizacaoTexto}>
              {statusLocalizacao === "carregando" ? "Buscando localização..." : "Usar localização"}
            </Text>
          </TouchableOpacity>
        </View>

        {metaMl > 0 && (
          <View style={styles.card}>
            <Text style={styles.labelForte}>Registrar consumo</Text>
            <Text style={styles.textoPequeno}>Escolha a medida padrão e toque no botão sempre que beber água.</Text>
            <View style={styles.chips}>
              {medidas.map((medida) => (
                <TouchableOpacity
                  key={medida}
                  style={[styles.chip, hidratacao.medidaPadraoMl === medida && styles.chipAtivo]}
                  onPress={() => selecionarMedidaAgua(medida)}
                >
                  <Text style={[styles.chipTexto, hidratacao.medidaPadraoMl === medida && styles.chipTextoAtivo]}>
                    {medida >= 1000 ? `${medida / 1000} L` : `${medida} ml`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Botao titulo="Registrar água" onPress={registrar} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const criarStyles = (colors: AppColors) => StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  content: { padding: 20, paddingBottom: 28 },
  titulo: { color: colors.text, fontSize: 28, fontWeight: "900" },
  subtitulo: { color: colors.muted, fontWeight: "700", marginBottom: 18, marginTop: 6 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  cardTopo: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  valor: { color: colors.primary, fontSize: 34, fontWeight: "900" },
  label: { color: colors.muted, fontWeight: "900", marginTop: 4 },
  texto: { color: colors.muted, fontWeight: "700", marginTop: 10 },
  textoPequeno: { color: colors.muted, fontSize: 12, fontWeight: "700", marginTop: 6 },
  erroTexto: { color: colors.danger, fontSize: 12, fontWeight: "800", marginTop: 10 },
  barra: { backgroundColor: colors.background, borderRadius: 999, height: 10, marginTop: 14, overflow: "hidden" },
  barraInterna: { backgroundColor: colors.primary, height: "100%" },
  linha: { flexDirection: "row", gap: 10, marginTop: 12 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  info: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    width: "48%",
  },
  infoValor: { color: colors.text, fontSize: 17, fontWeight: "900" },
  infoLabel: { color: colors.muted, fontSize: 12, fontWeight: "800", marginTop: 2 },
  labelForte: { color: colors.text, fontWeight: "900", marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chipsCompactos: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  chipAtivo: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipTexto: { color: colors.muted, fontWeight: "900" },
  chipTextoAtivo: { color: colors.primary },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  statusOk: { backgroundColor: colors.successSoft },
  statusAlerta: { backgroundColor: colors.warningSoft },
  statusTexto: { color: colors.text, fontSize: 12, fontWeight: "900" },
  botaoLocalizacao: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    padding: 12,
  },
  botaoLocalizacaoTexto: { color: colors.primary, fontWeight: "900" },
});
