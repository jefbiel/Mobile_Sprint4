import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from "../context/AppContext";
import { Botao } from "../components/Botao";
import { AppColors, Colors, PaletaAcessibilidadeId, paletasAcessibilidade } from "../../constants/theme";
import { CategoriaMissao, StatusMissao } from "../types";
import { BrandHeader } from "../components/BrandHeader";

const areas = [
  { label: "Mental", valor: CategoriaMissao.Mental },
  { label: "Física", valor: CategoriaMissao.Fisica },
  { label: "Lazer", valor: CategoriaMissao.Lazer },
  { label: "Sono", valor: CategoriaMissao.Sono },
];

export function PerfilScreen() {
  const { atualizarPaletaAcessibilidade, atualizarPerfil, colors, logout, missoes, resetarPlano, usuario } = useApp();
  const styles = criarStyles(colors);
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [areaDominante, setAreaDominante] = useState(usuario?.areaDominante ?? CategoriaMissao.Mental);
  const [notificacoes, setNotificacoes] = useState(usuario?.preferencias.notificacoes ?? true);
  const [lembreteHorario, setLembreteHorario] = useState(usuario?.preferencias.lembreteHorario ?? "08:00");
  const [metaDiaria, setMetaDiaria] = useState(String(usuario?.preferencias.metaDiaria ?? 3));
  const [modalPaletasAberto, setModalPaletasAberto] = useState(false);
  const paletaAtual = usuario?.preferencias.paletaAcessibilidade ?? "auroraHealth";
  const paletaAtualInfo = paletasAcessibilidade.find((paleta) => paleta.id === paletaAtual) ?? paletasAcessibilidade[0];

  const concluidas = missoes.filter((missao) => missao.status === StatusMissao.Concluida).length;
  const pendentes = missoes.length - concluidas;
  const metaDiariaNumero = Number(metaDiaria);
  const progressoMeta = Math.min(
    100,
    (concluidas / Math.max(1, Number.isFinite(metaDiariaNumero) ? metaDiariaNumero : 1)) * 100
  );

  useEffect(() => {
    if (!usuario) return;
    setNome(usuario.nome);
    setAreaDominante(usuario.areaDominante);
    setNotificacoes(usuario.preferencias.notificacoes);
    setLembreteHorario(usuario.preferencias.lembreteHorario);
    setMetaDiaria(String(usuario.preferencias.metaDiaria));
  }, [usuario]);

  async function selecionarPaleta(paletaAcessibilidade: PaletaAcessibilidadeId) {
    await atualizarPaletaAcessibilidade(paletaAcessibilidade);
    setModalPaletasAberto(false);
  }

  async function salvarPerfil() {
    const nomeLimpo = nome.trim();

    if (nomeLimpo.length < 2) {
      Alert.alert("Nome inválido", "Informe um nome com pelo menos 2 caracteres.");
      return;
    }

    if (!/^\d{2}:\d{2}$/.test(lembreteHorario)) {
      Alert.alert("Horário inválido", "Use o formato HH:MM, por exemplo 08:00.");
      return;
    }

    const [hora, minuto] = lembreteHorario.split(":").map(Number);
    if (hora > 23 || minuto > 59) {
      Alert.alert("Horário inválido", "Use um horário entre 00:00 e 23:59.");
      return;
    }

    if (!Number.isInteger(metaDiariaNumero) || metaDiariaNumero < 1 || metaDiariaNumero > 12) {
      Alert.alert("Meta inválida", "Informe uma meta diária entre 1 e 12 missões.");
      return;
    }

    await atualizarPerfil({
      nome: nomeLimpo,
      areaDominante,
      preferencias: {
        notificacoes,
        lembreteHorario,
        metaDiaria: metaDiariaNumero,
        paletaAcessibilidade: paletaAtual,
      },
    });

    Alert.alert("Perfil atualizado", "Suas preferências foram salvas.");
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BrandHeader compact />
      <View style={styles.header}>
        <Image source={require("../../assets/images/icon.png")} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.nome}>{usuario?.nome}</Text>
          <Text style={styles.subtitulo}>
            Level {usuario?.nivel} • Especialidade: {usuario?.areaDominante}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValor}>{usuario?.xp ?? 0}</Text>
          <Text style={styles.statLabel}>XP</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValor}>{usuario?.moedas ?? 0}</Text>
          <Text style={styles.statLabel}>Moedas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValor}>{usuario?.streak ?? 0}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValor}>{usuario?.diasPerfeitos ?? 0}</Text>
          <Text style={styles.statLabel}>Dias perfeitos</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.secaoTitulo}>Editar perfil</Text>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu nome"
          placeholderTextColor={colors.muted}
          value={nome}
          onChangeText={setNome}
        />

        <Text style={styles.label}>Área dominante</Text>
        <View style={styles.chips}>
          {areas.map((area) => (
            <TouchableOpacity
              key={area.valor}
              style={[styles.chip, areaDominante === area.valor && styles.chipAtivo]}
              onPress={() => setAreaDominante(area.valor)}
            >
              <Text style={[styles.chipTexto, areaDominante === area.valor && styles.chipTextoAtivo]}>
                {area.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.secaoTitulo}>Preferências</Text>
        <View style={styles.linhaPreferencia}>
          <View>
            <Text style={styles.itemTitulo}>Notificações</Text>
            <Text style={styles.itemDescricao}>Lembretes para cumprir missões</Text>
          </View>
          <Switch
            value={notificacoes}
            onValueChange={setNotificacoes}
            trackColor={{ false: colors.border, true: colors.primarySoft }}
            thumbColor={notificacoes ? colors.primary : colors.muted}
          />
        </View>

        <Text style={styles.label}>Horário do lembrete</Text>
        <TextInput
          style={styles.input}
          placeholder="08:00"
          placeholderTextColor={colors.muted}
          value={lembreteHorario}
          onChangeText={setLembreteHorario}
        />

        <Text style={styles.label}>Meta diária de missões</Text>
        <TextInput
          style={styles.input}
          placeholder="3"
          placeholderTextColor={colors.muted}
          value={metaDiaria}
          onChangeText={setMetaDiaria}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Temas de acessibilidade</Text>
        <TouchableOpacity style={styles.botaoPaleta} onPress={() => setModalPaletasAberto(true)}>
          <View style={styles.botaoPaletaTextoBox}>
            <Text style={styles.itemTitulo}>{paletaAtualInfo.nome}</Text>
            <Text style={styles.itemDescricao}>{paletaAtualInfo.resumo}</Text>
          </View>
          <View style={styles.amostrasLinha}>
            <View style={[styles.amostraCor, { backgroundColor: colors.primary }]} />
            <View style={[styles.amostraCor, { backgroundColor: colors.secondary }]} />
            <View style={[styles.amostraCor, { backgroundColor: colors.accent }]} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.secaoTitulo}>Resumo das missões</Text>
        <Text style={styles.item}>Email: {usuario?.email}</Text>
        <Text style={styles.item}>Missões pendentes: {pendentes}</Text>
        <Text style={styles.item}>Missões concluídas: {concluidas}</Text>
        <Text style={styles.item}>Meta diária: {usuario?.preferencias.metaDiaria ?? 3} missões</Text>
        <Text style={styles.item}>Conquistas: {usuario?.conquistas.length ?? 0}</Text>
        <View style={styles.barraMeta}>
          <View style={[styles.barraMetaInterna, { width: `${progressoMeta}%` }]} />
        </View>
        <Text style={styles.itemDescricao}>
          {concluidas >= (usuario?.preferencias.metaDiaria ?? 3)
            ? "Meta diária alcançada."
            : "Continue concluindo missões para bater sua meta diária."}
        </Text>
      </View>

      <Botao titulo="Salvar perfil" onPress={salvarPerfil} />
      <View style={styles.espaco} />
      <Botao
        titulo="Resetar plano diário"
        variante="secundario"
        onPress={() => {
          resetarPlano();
          Alert.alert("Plano resetado", "Suas missões voltaram para pendente.");
        }}
      />
      <View style={styles.espaco} />
      <Botao titulo="Sair" onPress={logout} />

      <Modal
        animationType="fade"
        transparent
        visible={modalPaletasAberto}
        onRequestClose={() => setModalPaletasAberto(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalPaletasAberto(false)}>
          <Pressable style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitulo}>Temas de Acessibilidade</Text>
                <Text style={styles.modalSubtitulo}>Escolha a paleta mais confortável para você.</Text>
              </View>
              <TouchableOpacity style={styles.fecharModal} onPress={() => setModalPaletasAberto(false)}>
                <Text style={styles.fecharModalTexto}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalLista} showsVerticalScrollIndicator={false}>
              {paletasAcessibilidade.map((paleta) => {
                const selecionada = paleta.id === paletaAtual;
                const paletaCores = Colors[paleta.id];

                return (
                  <TouchableOpacity
                    key={paleta.id}
                    style={[styles.opcaoPaleta, selecionada && styles.opcaoPaletaAtiva]}
                    onPress={() => selecionarPaleta(paleta.id)}
                  >
                    <View style={styles.opcaoPaletaTopo}>
                      <View style={styles.opcaoPaletaTexto}>
                        <Text style={styles.opcaoPaletaNome}>{paleta.nome}</Text>
                        <Text style={styles.opcaoPaletaResumo}>{paleta.resumo}</Text>
                      </View>
                      {selecionada && <Text style={styles.opcaoPaletaSelecionada}>Ativo</Text>}
                    </View>
                    <Text style={styles.opcaoPaletaFinalidade}>{paleta.finalidade}</Text>
                    <View style={styles.amostrasPaleta}>
                      {[paletaCores.background, paletaCores.surface, paletaCores.primary, paletaCores.secondary, paletaCores.accent, paletaCores.success, paletaCores.warning, paletaCores.danger].map((cor) => (
                        <View key={cor} style={[styles.amostraPaletaCor, { backgroundColor: cor }]} />
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const criarStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 56,
    paddingBottom: 32,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginBottom: 18,
  },
  avatar: {
    borderRadius: 22,
    height: 74,
    width: 74,
  },
  headerInfo: {
    flex: 1,
  },
  nome: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
  },
  subtitulo: {
    color: colors.muted,
    marginTop: 4,
    textTransform: "capitalize",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    width: "48%",
  },
  statValor: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "900",
  },
  statLabel: {
    color: colors.muted,
    fontWeight: "700",
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  secaoTitulo: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  label: {
    color: colors.text,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    padding: 13,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipAtivo: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipTexto: {
    color: colors.muted,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  chipTextoAtivo: {
    color: colors.primary,
  },
  linhaPreferencia: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemTitulo: {
    color: colors.text,
    fontWeight: "900",
  },
  itemDescricao: {
    color: colors.muted,
    marginTop: 2,
  },
  botaoPaleta: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    padding: 13,
  },
  botaoPaletaTextoBox: {
    flex: 1,
  },
  amostrasLinha: {
    flexDirection: "row",
    gap: 5,
  },
  amostraCor: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 18,
    width: 18,
  },
  item: {
    color: colors.text,
    fontWeight: "700",
    marginBottom: 10,
  },
  barraMeta: {
    backgroundColor: colors.background,
    borderRadius: 999,
    height: 10,
    marginBottom: 10,
    marginTop: 4,
    overflow: "hidden",
  },
  barraMetaInterna: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: "100%",
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.68)",
    flex: 1,
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    maxHeight: "86%",
    padding: 16,
    width: "100%",
  },
  modalHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitulo: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
  },
  modalSubtitulo: {
    color: colors.muted,
    marginTop: 4,
  },
  fecharModal: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  fecharModalTexto: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 24,
  },
  modalLista: {
    marginHorizontal: -2,
  },
  opcaoPaleta: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  opcaoPaletaAtiva: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  opcaoPaletaTopo: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  opcaoPaletaTexto: {
    flex: 1,
  },
  opcaoPaletaNome: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  opcaoPaletaResumo: {
    color: colors.primary,
    fontWeight: "800",
    marginTop: 2,
  },
  opcaoPaletaSelecionada: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  opcaoPaletaFinalidade: {
    color: colors.muted,
    marginTop: 8,
  },
  amostrasPaleta: {
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
  },
  amostraPaletaCor: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    height: 22,
  },
  espaco: {
    height: 12,
  },
});
