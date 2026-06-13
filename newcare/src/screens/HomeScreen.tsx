import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useApp } from "../context/AppContext";
import { CardMissao } from "../components/CardMissao";
import { StatusMissao } from "../types";
import { AppColors } from "../../constants/theme";
import { BrandHeader } from "../components/BrandHeader";
import { RootStackParamList } from "../routes/types";

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
    registrarAguaBebida,
  } = useApp();
  const styles = criarStyles(colors);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const concluidas = missoes.filter((m) => m.status === StatusMissao.Concluida).length;
  const pendentes = missoes.filter((m) => m.status === StatusMissao.Pendente);
  const percentualHoje = Math.round((concluidas / Math.max(1, missoes.length)) * 100);
  const xp = progressoNivel(usuario?.xp ?? 0);
  const metaAguaMl = hidratacao.metaMl ?? 0;
  const progressoAgua = metaAguaMl > 0 ? Math.min((hidratacao.consumidoMl / metaAguaMl) * 100, 100) : 0;
  const medidasRestantes = metaAguaMl > 0
    ? Math.max(0, Math.ceil((metaAguaMl - hidratacao.consumidoMl) / hidratacao.medidaPadraoMl))
    : 0;
  const tipoMedida = hidratacao.medidaPadraoMl >= 1000 ? "garrafa" : "copo";

  function concluirMissao(id: string) {
    const missao = missoes.find((item) => item.id === id);
    completarMissao(id);
    if (missao?.status === StatusMissao.Pendente) {
      Alert.alert("Missão concluída", `Você ganhou ${missao.recompensaXp} XP.`);
    }
  }

  async function registrarConsumoAgua() {
    if (metaAguaMl <= 0 || !usuario) return;

    const atualizada = await registrarAguaBebida(metaAguaMl);

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
              {metaAguaMl > 0 ? `${(metaAguaMl / 1000).toFixed(2)} L` : "--"}
            </Text>
          </View>
          <View style={[styles.statusPill, metaAguaMl > 0 ? styles.statusOnline : styles.statusOffline]}>
            <Text style={styles.statusTexto}>{metaAguaMl > 0 ? "calculado" : "pendente"}</Text>
          </View>
        </View>

        <View style={styles.barraAgua}>
          <View style={[styles.barraAguaInterna, { width: `${progressoAgua}%` }]} />
        </View>

        {metaAguaMl > 0 ? (
          <>
            <View style={styles.hidratacaoResumoLinha}>
              <Text style={styles.feedbackTexto}>{hidratacao.consumidoMl}/{metaAguaMl} ml consumidos</Text>
              <Text style={styles.feedbackTexto}>{medidasRestantes} {tipoMedida}{medidasRestantes === 1 ? "" : "s"} restantes</Text>
            </View>

            <View style={styles.acoesLinha}>
              <Pressable style={styles.botaoPrimario} onPress={registrarConsumoAgua}>
                <Text style={styles.botaoPrimarioTexto}>
                  Registrar {hidratacao.medidaPadraoMl >= 1000 ? `${hidratacao.medidaPadraoMl / 1000} L` : `${hidratacao.medidaPadraoMl} ml`}
                </Text>
              </Pressable>
              <Pressable style={styles.botaoSecundario} onPress={() => navigation.navigate("Hidratacao")}>
                <Text style={styles.botaoSecundarioTexto}>Ver detalhes</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.feedbackTexto}>Complete seus dados para calcular sua meta de água.</Text>
            <Pressable style={styles.botaoDetalheAgua} onPress={() => navigation.navigate("Hidratacao")}>
              <Text style={styles.botaoSecundarioTexto}>Calcular hidratação</Text>
            </Pressable>
          </>
        )}
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
          <CardMissao
            missao={item}
            onPress={concluirMissao}
            onDetalhes={(missaoId) => navigation.navigate("DetalheMissao", { missaoId })}
          />
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
  botaoDetalheAgua: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  feedbackTexto: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10,
  },
  hidratacaoResumoLinha: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
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
