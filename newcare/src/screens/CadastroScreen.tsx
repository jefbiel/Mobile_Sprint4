import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Botao } from "../components/Botao";
import { BrandHeader } from "../components/BrandHeader";
import { useApp } from "../context/AppContext";
import { CategoriaMissao } from "../types";
import { AppColors, Colors, PaletaAcessibilidadeId, paletasAcessibilidade } from "../../constants/theme";
import { RootStackParamList } from "../routes/types";
import { ATIVIDADES_ONBOARDING } from "../data/missoes";

type Props = StackScreenProps<RootStackParamList, "Cadastro">;

const areas = [
  { label: "Mental", valor: CategoriaMissao.Mental },
  { label: "Física", valor: CategoriaMissao.Fisica },
  { label: "Lazer", valor: CategoriaMissao.Lazer },
  { label: "Sono", valor: CategoriaMissao.Sono },
];
const tempos = [10, 15, 30];
const etapas = ["Acessibilidade", "Conta", "Área", "Tempo"];

export function CadastroScreen({ navigation }: Props) {
  const { cadastrar, colors, definirPaletaTemporaria } = useApp();
  const styles = criarStyles(colors);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [paleta, setPaleta] = useState<PaletaAcessibilidadeId>("auroraHealth");
  const [foco, setFoco] = useState(CategoriaMissao.Mental);
  const [atividadesPorArea, setAtividadesPorArea] = useState<Record<CategoriaMissao, string[]>>({
    [CategoriaMissao.Mental]: [],
    [CategoriaMissao.Fisica]: [],
    [CategoriaMissao.Lazer]: [],
    [CategoriaMissao.Sono]: [],
  });
  const [tempoDiario, setTempoDiario] = useState(15);
  const [carregando, setCarregando] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState(0);
  const ultimaEtapa = etapaAtual === etapas.length - 1;
  const atividadesSelecionadas = atividadesPorArea[foco];
  const todasAtividadesSelecionadas = Object.values(atividadesPorArea).flat();

  function selecionarPaleta(paletaAcessibilidade: PaletaAcessibilidadeId) {
    setPaleta(paletaAcessibilidade);
    definirPaletaTemporaria(paletaAcessibilidade);
  }

  function validarConta() {
    if (nome.trim().length < 2) {
      Alert.alert("Nome inválido", "Informe um nome com pelo menos 2 caracteres.");
      return false;
    }

    if (!email.trim().includes("@")) {
      Alert.alert("Email inválido", "Informe um email válido.");
      return false;
    }

    if (senha.length < 6) {
      Alert.alert("Senha curta", "A senha precisa ter pelo menos 6 caracteres.");
      return false;
    }

    if (senha !== confirmacao) {
      Alert.alert("Senhas diferentes", "Confirme a senha usando o mesmo valor.");
      return false;
    }

    return true;
  }

  function avancar() {
    if (etapaAtual === 1 && !validarConta()) return;
    if (etapaAtual === 2 && atividadesSelecionadas.length !== 2) {
      Alert.alert("Escolha 2 atividades", "Selecione duas atividades sugeridas para montar seus hábitos iniciais.");
      return;
    }
    if (ultimaEtapa) {
      criarConta();
      return;
    }

    setEtapaAtual((atual) => Math.min(atual + 1, etapas.length - 1));
  }

  function voltar() {
    if (etapaAtual === 0) {
      navigation.goBack();
      return;
    }

    setEtapaAtual((atual) => Math.max(atual - 1, 0));
  }

  function escolherFoco(area: CategoriaMissao) {
    setFoco(area);
  }

  function alternarAtividade(atividadeId: string) {
    const atuais = atividadesPorArea[foco];

    if (atuais.includes(atividadeId)) {
      setAtividadesPorArea((selecoes) => ({
        ...selecoes,
        [foco]: atuais.filter((id) => id !== atividadeId),
      }));
      return;
    }

    if (atuais.length >= 2) {
      Alert.alert("Limite de atividades", "Você pode escolher até 2 atividades sugeridas por área.");
      return;
    }

    setAtividadesPorArea((selecoes) => ({
      ...selecoes,
      [foco]: [...atuais, atividadeId],
    }));
  }

  async function criarConta() {
    if (!validarConta()) return;

    try {
      setCarregando(true);
      await cadastrar({
        nome,
        email,
        senha,
        paletaAcessibilidade: paleta,
        foco,
        tempoDiario,
        atividadesSelecionadas: todasAtividadesSelecionadas,
      });
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Revise os dados e tente novamente.";
      Alert.alert("Não foi possível cadastrar", mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <BrandHeader compact />
        <Text style={styles.titulo}>Cadastro</Text>
        <Text style={styles.subtitulo}>Etapa {etapaAtual + 1} de {etapas.length}: {etapas[etapaAtual]}</Text>
        <View style={styles.progresso}>
          {etapas.map((etapa, index) => (
            <View key={etapa} style={[styles.progressoItem, index <= etapaAtual && styles.progressoItemAtivo]} />
          ))}
        </View>

        <ScrollView style={styles.etapa} contentContainerStyle={styles.etapaConteudo} showsVerticalScrollIndicator={false}>
          {etapaAtual === 0 && (
            <View>
              <Text style={styles.label}>Cor de acessibilidade</Text>
              <Text style={styles.descricaoEtapa}>Escolha a paleta que deixa o app mais confortável para você.</Text>
              <View style={styles.grid}>
                {paletasAcessibilidade.map((item) => {
                  const amostra = Colors[item.id];
                  const ativa = item.id === paleta;
                  return (
                    <TouchableOpacity key={item.id} style={[styles.opcao, ativa && styles.opcaoAtiva]} onPress={() => selecionarPaleta(item.id)}>
                      <View style={styles.amostras}>
                        <View style={[styles.amostra, { backgroundColor: amostra.primary }]} />
                        <View style={[styles.amostra, { backgroundColor: amostra.secondary }]} />
                        <View style={[styles.amostra, { backgroundColor: amostra.accent }]} />
                      </View>
                      <Text style={styles.opcaoTitulo}>{item.nome}</Text>
                      <Text style={styles.opcaoTexto}>{ativa ? "Ativo agora" : item.resumo}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {etapaAtual === 1 && (
            <View style={styles.card}>
              <Text style={styles.label}>Dados da conta</Text>
              <TextInput style={styles.input} placeholder="Nome" placeholderTextColor={colors.muted} value={nome} onChangeText={setNome} />
              <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <TextInput style={styles.input} placeholder="Senha" placeholderTextColor={colors.muted} value={senha} onChangeText={setSenha} secureTextEntry />
              <TextInput style={styles.input} placeholder="Confirmar senha" placeholderTextColor={colors.muted} value={confirmacao} onChangeText={setConfirmacao} secureTextEntry />
            </View>
          )}

          {etapaAtual === 2 && (
            <View>
              <Text style={styles.label}>Área que deseja aprimorar</Text>
              <View style={styles.chips}>
                {areas.map((area) => (
                  <TouchableOpacity key={area.valor} style={[styles.chip, foco === area.valor && styles.chipAtivo]} onPress={() => escolherFoco(area.valor)}>
                    <Text style={[styles.chipTexto, foco === area.valor && styles.chipTextoAtivo]}>{area.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.subLabel}>Escolha 2 atividades sugeridas</Text>
              <View style={styles.atividadesLista}>
                {ATIVIDADES_ONBOARDING[foco].map((atividade) => {
                  const ativa = atividadesSelecionadas.includes(atividade.id);

                  return (
                    <TouchableOpacity
                      key={atividade.id}
                      style={[styles.atividadeCard, ativa && styles.atividadeCardAtiva]}
                      onPress={() => alternarAtividade(atividade.id)}
                    >
                      <View style={styles.atividadeTopo}>
                        <Text style={styles.atividadeTitulo}>{atividade.titulo}</Text>
                        <Text style={[styles.atividadeBadge, ativa && styles.atividadeBadgeAtiva]}>
                          {ativa ? "Escolhida" : "Selecionar"}
                        </Text>
                      </View>
                      <Text style={styles.atividadeDescricao}>{atividade.descricao}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.contadorAtividades}>{atividadesSelecionadas.length}/2 escolhidas</Text>
            </View>
          )}

          {etapaAtual === 3 && (
            <View>
              <Text style={styles.label}>Tempo diário</Text>
              <View style={styles.chips}>
                {tempos.map((tempo) => (
                  <TouchableOpacity key={tempo} style={[styles.chip, tempoDiario === tempo && styles.chipAtivo]} onPress={() => setTempoDiario(tempo)}>
                    <Text style={[styles.chipTexto, tempoDiario === tempo && styles.chipTextoAtivo]}>{tempo} min</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.resumo}>
                <Text style={styles.resumoTitulo}>Resumo do cadastro</Text>
                <Text style={styles.resumoTexto}>{nome || "Seu nome"} • {email || "email"}</Text>
                <Text style={styles.resumoTexto}>Área: {areas.find((area) => area.valor === foco)?.label}</Text>
                <Text style={styles.resumoTexto}>Atividades escolhidas: {todasAtividadesSelecionadas.length}</Text>
                <Text style={styles.resumoTexto}>Tempo diário: {tempoDiario} min</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.navegacao}>
          <TouchableOpacity style={styles.botaoVoltar} onPress={voltar}>
            <Text style={styles.botaoVoltarTexto}>{etapaAtual === 0 ? "Login" : "Voltar"}</Text>
          </TouchableOpacity>
          <View style={styles.botaoAvancar}>
            <Botao titulo={ultimaEtapa ? "Criar cadastro" : "Avançar"} onPress={avancar} carregando={carregando} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const criarStyles = (colors: AppColors) => StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  content: { flex: 1, padding: 20, paddingBottom: 12 },
  titulo: { color: colors.text, fontSize: 28, fontWeight: "900", marginTop: 12 },
  subtitulo: { color: colors.muted, fontWeight: "700", marginTop: 6 },
  progresso: { flexDirection: "row", gap: 8, marginBottom: 18, marginTop: 14 },
  progressoItem: { backgroundColor: colors.border, borderRadius: 999, flex: 1, height: 5 },
  progressoItemAtivo: { backgroundColor: colors.primary },
  etapa: { flex: 1 },
  etapaConteudo: { paddingBottom: 8 },
  card: { gap: 10, marginBottom: 18 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, fontSize: 16, fontWeight: "700", minHeight: 50, paddingHorizontal: 14 },
  label: { color: colors.text, fontSize: 16, fontWeight: "900", marginBottom: 10, marginTop: 10 },
  descricaoEtapa: { color: colors.muted, fontWeight: "700", lineHeight: 19, marginBottom: 12 },
  subLabel: { color: colors.text, fontSize: 14, fontWeight: "900", marginBottom: 8, marginTop: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between", marginBottom: 8 },
  opcao: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, minHeight: 102, padding: 12, width: "48%" },
  opcaoAtiva: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  amostras: { flexDirection: "row", gap: 6, marginBottom: 10 },
  amostra: { borderColor: colors.border, borderRadius: 999, borderWidth: 1, height: 20, width: 20 },
  opcaoTitulo: { color: colors.text, fontSize: 14, fontWeight: "900" },
  opcaoTexto: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 3 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 999, borderWidth: 1, flexGrow: 1, minHeight: 42, justifyContent: "center", paddingHorizontal: 14 },
  chipAtivo: { backgroundColor: colors.secondarySoft, borderColor: colors.secondary },
  chipTexto: { color: colors.muted, fontWeight: "900", textAlign: "center" },
  chipTextoAtivo: { color: colors.secondary },
  atividadesLista: { gap: 8 },
  atividadeCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, padding: 12 },
  atividadeCardAtiva: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  atividadeTopo: { alignItems: "flex-start", flexDirection: "row", gap: 10, justifyContent: "space-between" },
  atividadeTitulo: { color: colors.text, flex: 1, fontSize: 14, fontWeight: "900" },
  atividadeBadge: { backgroundColor: colors.card, borderRadius: 999, color: colors.muted, fontSize: 11, fontWeight: "900", overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4 },
  atividadeBadgeAtiva: { backgroundColor: colors.primary, color: colors.surface },
  atividadeDescricao: { color: colors.muted, fontSize: 12, fontWeight: "700", lineHeight: 16, marginTop: 6 },
  contadorAtividades: { color: colors.primary, fontSize: 12, fontWeight: "900", marginTop: 8, textAlign: "right" },
  resumo: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, marginTop: 18, padding: 14 },
  resumoTitulo: { color: colors.text, fontSize: 16, fontWeight: "900", marginBottom: 8 },
  resumoTexto: { color: colors.muted, fontWeight: "800", marginTop: 4 },
  navegacao: { alignItems: "center", flexDirection: "row", gap: 12, paddingTop: 12 },
  botaoVoltar: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, justifyContent: "center", minHeight: 50, paddingHorizontal: 18 },
  botaoVoltarTexto: { color: colors.text, fontWeight: "900" },
  botaoAvancar: { flex: 1 },
});
