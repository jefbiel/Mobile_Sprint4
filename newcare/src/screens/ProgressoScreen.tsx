import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useApp } from "../context/AppContext";
import { StatusMissao } from "../types";
import { AppColors } from "../../constants/theme";
import { BrandHeader } from "../components/BrandHeader";

export function ProgressoScreen() {
  const { colors, usuario, missoes, conquistas } = useApp();
  const styles = criarStyles(colors);
  const total = missoes.length || 1;
  const concluidas = missoes.filter((m) => m.status === StatusMissao.Concluida).length;
  const percentual = Math.round((concluidas / total) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BrandHeader compact />
      <Text style={styles.titulo}>Progresso</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.valor}>{usuario?.xp ?? 0}</Text>
          <Text style={styles.label}>XP total</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.valor}>{usuario?.nivel ?? 1}</Text>
          <Text style={styles.label}>Level</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.valor}>{usuario?.streak ?? 0}</Text>
          <Text style={styles.label}>Streak</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.valor}>{percentual}%</Text>
          <Text style={styles.label}>Hoje</Text>
        </View>
      </View>

      <Text style={styles.secao}>Conquistas</Text>
      {conquistas.map((conquista) => (
        <View key={conquista.id} style={[styles.conquista, conquista.desbloqueada && styles.conquistaAtiva]}>
          <Text style={styles.conquistaTitulo}>
            {conquista.desbloqueada ? "🏆" : "🔒"} {conquista.titulo}
          </Text>
          <Text style={styles.conquistaDescricao}>{conquista.descricao}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const criarStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 56,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  valor: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.primary,
  },
  label: {
    color: colors.muted,
    marginTop: 4,
  },
  secao: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  conquista: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    opacity: 0.65,
  },
  conquistaAtiva: {
    opacity: 1,
    borderColor: colors.warning,
    backgroundColor: colors.warningSoft,
  },
  conquistaTitulo: {
    fontWeight: "900",
    color: colors.text,
  },
  conquistaDescricao: {
    color: colors.muted,
    marginTop: 4,
  },
});
