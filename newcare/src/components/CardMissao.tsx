import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Missao, StatusMissao } from "../types";
import { AppColors } from "../../constants/theme";
import { useApp } from "../context/AppContext";

interface Props {
  missao: Missao;
  onPress: (id: string) => void;
}

const categoriaEmoji = {
  mental: "🧠",
  fisica: "💪",
  lazer: "🎮",
  sono: "😴",
};

export function CardMissao({ missao, onPress }: Props) {
  const { colors } = useApp();
  const styles = criarStyles(colors);
  const concluida = missao.status === StatusMissao.Concluida;

  return (
    <View style={[styles.card, concluida && styles.cardConcluido]}>
      <View style={styles.header}>
        <Text style={styles.titulo}>
          {categoriaEmoji[missao.categoria]} {missao.titulo}
        </Text>
        <Text style={styles.badge}>{missao.tipo}</Text>
      </View>

      <Text style={styles.descricao}>{missao.descricao}</Text>
      <Text style={styles.meta}>
        🎯 {missao.duracaoMinutos} min • ⭐ +{missao.recompensaXp} XP • 💰 +{missao.recompensaMoedas}
      </Text>

      <TouchableOpacity
        style={[styles.botao, concluida && styles.botaoConcluido]}
        onPress={() => onPress(missao.id)}
        disabled={concluida}
      >
        <Text style={styles.botaoTexto}>{concluida ? "Concluída" : "Completar missão"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const criarStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardConcluido: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  titulo: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.secondarySoft,
    color: colors.secondary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: "hidden",
    fontSize: 12,
    textTransform: "capitalize",
  },
  descricao: {
    color: colors.muted,
    marginTop: 8,
  },
  meta: {
    color: colors.muted,
    marginTop: 8,
    fontSize: 12,
  },
  botao: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  botaoConcluido: {
    backgroundColor: colors.success,
  },
  botaoTexto: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
});
