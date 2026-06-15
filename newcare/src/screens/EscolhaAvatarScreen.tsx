import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Botao } from "../components/Botao";
import { BrandHeader } from "../components/BrandHeader";
import { useApp } from "../context/AppContext";
import { AppColors } from "../../constants/theme";

export const avataresIniciais = [
  { id: "avatar-1", nome: "Aprendiz", simbolo: "📘", foco: "Fase 1" },
  { id: "avatar-2", nome: "Explorador", simbolo: "🧭", foco: "Fase 1" },
  { id: "avatar-3", nome: "Guardião", simbolo: "🛡️", foco: "Fase 1" },
  { id: "avatar-4", nome: "Nômade", simbolo: "🌙", foco: "Fase 1" },
];

export function EscolhaAvatarScreen() {
  const { escolherAvatar, colors } = useApp();
  const styles = criarStyles(colors);
  const [selecionado, setSelecionado] = useState(avataresIniciais[0].id);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <BrandHeader compact />
        <Text style={styles.titulo}>Escolha seu avatar</Text>
        <Text style={styles.subtitulo}>Ele representa sua evolução dentro do NewCare.</Text>

        <View style={styles.grid}>
          {avataresIniciais.map((avatar) => {
            const ativo = selecionado === avatar.id;
            return (
              <TouchableOpacity key={avatar.id} style={[styles.card, ativo && styles.cardAtivo]} onPress={() => setSelecionado(avatar.id)}>
                <Text style={styles.simbolo}>{avatar.simbolo}</Text>
                <Text style={styles.nome}>{avatar.nome}</Text>
                <Text style={styles.fase}>{avatar.foco}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Botao titulo="Entrar na HomePage" onPress={() => escolherAvatar(selecionado)} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const criarStyles = (colors: AppColors) => StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  content: { flex: 1, padding: 20 },
  titulo: { color: colors.text, fontSize: 28, fontWeight: "900", marginTop: 12 },
  subtitulo: { color: colors.muted, fontWeight: "700", marginBottom: 18, marginTop: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  card: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, minHeight: 150, justifyContent: "center", padding: 12, width: "48%" },
  cardAtivo: { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderWidth: 2 },
  simbolo: { fontSize: 36, marginBottom: 10 },
  nome: { color: colors.text, fontSize: 15, fontWeight: "900", textAlign: "center" },
  fase: { color: colors.primary, fontWeight: "900", marginTop: 6 },
  footer: { marginTop: "auto" },
});
