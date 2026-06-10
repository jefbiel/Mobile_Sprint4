import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { AppColors } from "../../constants/theme";
import { useApp } from "../context/AppContext";

interface Props {
  titulo: string;
  onPress: () => void;
  carregando?: boolean;
  variante?: "primario" | "secundario";
}

export function Botao({ titulo, onPress, carregando = false, variante = "primario" }: Props) {
  const { colors } = useApp();
  const styles = criarStyles(colors);

  return (
    <TouchableOpacity
      style={[styles.btn, variante === "secundario" && styles.secundario]}
      onPress={onPress}
      disabled={carregando}
    >
      {carregando ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{titulo}</Text>}
    </TouchableOpacity>
  );
}

const criarStyles = (colors: AppColors) => StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    minHeight: 50,
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  secundario: {
    backgroundColor: colors.secondary,
    shadowColor: colors.secondary,
  },
  text: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },
});
