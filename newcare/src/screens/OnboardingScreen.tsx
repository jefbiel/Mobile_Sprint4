import { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, StyleSheet, View } from "react-native";
import { Botao } from "../components/Botao";
import { useApp } from "../context/AppContext";
import { CategoriaMissao } from "../types";
import { AppColors } from "../../constants/theme";
import { BrandHeader } from "../components/BrandHeader";

const focos = [
  { label: "Mental", valor: CategoriaMissao.Mental, emoji: "🧠", descricao: "foco, pausa e respiração" },
  { label: "Física", valor: CategoriaMissao.Fisica, emoji: "💪", descricao: "movimento e energia" },
  { label: "Lazer", valor: CategoriaMissao.Lazer, emoji: "🎮", descricao: "descanso e prazer" },
  { label: "Sono", valor: CategoriaMissao.Sono, emoji: "😴", descricao: "rotina e recuperação" },
];

const tempos = [10, 15, 30];
const niveis = ["iniciante", "intermediario", "avancado"] as const;

export function OnboardingScreen() {
  const { colors, concluirOnboarding } = useApp();
  const styles = criarStyles(colors);
  const [foco, setFoco] = useState(CategoriaMissao.Mental);
  const [tempoDiario, setTempoDiario] = useState(15);
  const [nivelAtual, setNivelAtual] = useState<"iniciante" | "intermediario" | "avancado">("iniciante");
  const [carregando, setCarregando] = useState(false);
  const focoSelecionado = focos.find((item) => item.valor === foco) ?? focos[0];

  async function gerarPlano() {
    try {
      setCarregando(true);
      await concluirOnboarding({ foco, tempoDiario, nivelAtual });
    } catch {
      Alert.alert("Não foi possível gerar o plano", "Tente novamente em alguns instantes.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BrandHeader compact />
          <Text style={styles.titulo}>Monte sua jornada</Text>
          <Text style={styles.subtitulo}>
            Escolha um ponto de partida e o app cria missões diárias proporcionais ao seu tempo.
          </Text>
        </View>

        <View style={styles.cardDestaque}>
          <Text style={styles.cardDestaqueEmoji}>{focoSelecionado.emoji}</Text>
          <View style={styles.cardDestaqueInfo}>
            <Text style={styles.cardDestaqueTitulo}>Plano focado em {focoSelecionado.label}</Text>
            <Text style={styles.cardDestaqueTexto}>
              {tempoDiario} min • nível {nivelAtual}
            </Text>
          </View>
        </View>

        <View style={styles.secao}>
          <Text style={styles.label}>Área de foco</Text>
          <View style={styles.grid}>
            {focos.map((item) => (
              <TouchableOpacity
                key={item.valor}
                style={[styles.opcao, foco === item.valor && styles.opcaoAtiva]}
                onPress={() => setFoco(item.valor)}
              >
                <Text style={styles.opcaoEmoji}>{item.emoji}</Text>
                <Text style={styles.opcaoTexto}>{item.label}</Text>
                <Text style={styles.opcaoDescricao}>{item.descricao}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.secao}>
          <View>
            <Text style={styles.label}>Tempo por dia</Text>
            <View style={styles.linha}>
              {tempos.map((tempo) => (
                <TouchableOpacity
                  key={tempo}
                  style={[styles.chip, tempoDiario === tempo && styles.chipAtivo]}
                  onPress={() => setTempoDiario(tempo)}
                >
                  <Text style={[styles.chipTexto, tempoDiario === tempo && styles.chipTextoAtivo]}>
                    {tempo} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.blocoNivel}>
            <Text style={styles.label}>Nível</Text>
            <View style={styles.linha}>
              {niveis.map((nivel) => (
                <TouchableOpacity
                  key={nivel}
                  style={[styles.chip, nivelAtual === nivel && styles.chipAtivo]}
                  onPress={() => setNivelAtual(nivel)}
                >
                  <Text style={[styles.chipTexto, nivelAtual === nivel && styles.chipTextoAtivo]}>
                    {nivel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.resumo}>
          <Text style={styles.resumoTitulo}>Seu plano inicial</Text>
          <View style={styles.resumoLinha}>
            <Text style={styles.resumoLabel}>Missões</Text>
            <Text style={styles.resumoValor}>{tempoDiario <= 10 ? 2 : tempoDiario <= 20 ? 3 : 4}</Text>
            <Text style={[styles.resumoLabel, { marginLeft: 12 }]}>Recompensa</Text>
            <Text style={styles.resumoValor}>XP + moedas</Text>
          </View>
        </View>

        <View style={styles.botaoArea}>
          <Botao titulo="Gerar missões" onPress={gerarPlano} carregando={carregando} />
        </View>
      </ScrollView>
    </View>
  );
}

const criarStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 34,
  },
  header: {
    marginBottom: 18,
  },
  marca: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  titulo: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
  },
  subtitulo: {
    color: colors.muted,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 8,
    fontSize: 14,
  },
  cardDestaque: {
    alignItems: "center",
    backgroundColor: colors.text,
    borderRadius: 14,
    flexDirection: "row",
    gap: 14,
    marginBottom: 22,
    paddingHorizontal: 14,
    paddingVertical: 16,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDestaqueEmoji: {
    fontSize: 28,
  },
  cardDestaqueInfo: {
    flex: 1,
  },
  cardDestaqueTitulo: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "900",
  },
  cardDestaqueTexto: {
    color: colors.primarySoft,
    fontWeight: "700",
    marginTop: 5,
    fontSize: 13,
  },
  secao: {
    marginBottom: 20,
  },
  label: {
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
    fontSize: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  opcao: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    minHeight: 88,
    padding: 12,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  opcaoAtiva: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  opcaoEmoji: {
    fontSize: 20,
    marginBottom: 8,
  },
  opcaoTexto: {
    fontWeight: "900",
    color: colors.text,
    fontSize: 14,
  },
  opcaoDescricao: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
    marginTop: 4,
  },
  linha: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  blocoNivel: {
    marginTop: 18,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipAtivo: {
    backgroundColor: colors.secondarySoft,
    borderColor: colors.secondary,
  },
  chipTexto: {
    color: colors.muted,
    fontWeight: "800",
    textTransform: "capitalize",
    fontSize: 13,
  },
  chipTextoAtivo: {
    color: colors.secondary,
  },
  resumo: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
    padding: 14,
  },
  resumoTitulo: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
  },
  resumoLinha: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    rowGap: 4,
  },
  resumoLabel: {
    color: colors.muted,
    fontWeight: "800",
    fontSize: 12,
  },
  resumoValor: {
    color: colors.primary,
    fontWeight: "900",
    fontSize: 13,
  },
  botaoArea: {
    marginBottom: 8,
  },
});
