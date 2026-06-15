import { useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Botao } from "../components/Botao";
import { BrandHeader } from "../components/BrandHeader";
import { useApp } from "../context/AppContext";
import { CategoriaMissao, Missao } from "../types";
import { AppColors, Colors, PaletaAcessibilidadeId, paletasAcessibilidade } from "../../constants/theme";
import { RootStackParamList } from "../routes/types";
import { ATIVIDADES_ONBOARDING, calcularRecompensasPorDuracao, gerarMissoesPersonalizadas } from "../data/missoes";
import { emailValido, LIMITE_EMAIL, LIMITE_NOME, LIMITE_SENHA, normalizarEmail } from "../utils/validacoes";
import { avataresIniciais } from "./EscolhaAvatarScreen";

type Props = StackScreenProps<RootStackParamList, "Cadastro">;

const areas = [
  { label: "Física", valor: CategoriaMissao.Fisica },
  { label: "Mental", valor: CategoriaMissao.Mental },
  { label: "Lazer", valor: CategoriaMissao.Lazer },
  { label: "Sono", valor: CategoriaMissao.Sono },
];
const TEMPO_DIARIO_PADRAO = 15;
const etapas = ["Acessibilidade", "Conta", "Área", "Hábitos", "Resumo", "Avatar"];

export function CadastroScreen({ navigation }: Props) {
  const { cadastrar, colors, definirPaletaTemporaria } = useApp();
  const styles = criarStyles(colors);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [editandoDados, setEditandoDados] = useState(false);
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [emailEdicao, setEmailEdicao] = useState("");
  const [paleta, setPaleta] = useState<PaletaAcessibilidadeId>("auroraHealth");
  const [foco, setFoco] = useState(CategoriaMissao.Fisica);
  const [atividadesPorArea, setAtividadesPorArea] = useState<Record<CategoriaMissao, string[]>>({
    [CategoriaMissao.Mental]: [],
    [CategoriaMissao.Fisica]: [],
    [CategoriaMissao.Lazer]: [],
    [CategoriaMissao.Sono]: [],
  });
  const tempoDiario = TEMPO_DIARIO_PADRAO;
  const [habitosPreview, setHabitosPreview] = useState<Missao[]>([]);
  const [avatarSelecionado, setAvatarSelecionado] = useState(avataresIniciais[0].id);
  const alertaNomeAberto = useRef(false);
  const alertaEmailAberto = useRef(false);
  const alertaSenhaAberto = useRef(false);
  const [carregando, setCarregando] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState(0);
  const ultimaEtapa = etapaAtual === etapas.length - 1;
  const atividadesSelecionadas = atividadesPorArea[foco];
  const todasAtividadesSelecionadas = Object.values(atividadesPorArea).flat();
  const indiceAreaAtual = areas.findIndex((area) => area.valor === foco);
  const proximaArea = areas[indiceAreaAtual + 1];
  const atividadesCompletas = areas.every((area) => atividadesPorArea[area.valor].length === 2);
  const areaAtualCompleta = atividadesSelecionadas.length === 2;

  function selecionarPaleta(paletaAcessibilidade: PaletaAcessibilidadeId) {
    setPaleta(paletaAcessibilidade);
    definirPaletaTemporaria(paletaAcessibilidade);
  }

  function atualizarNomeComLimite(valor: string, atualizar: (nomeLimitado: string) => void) {
    if (valor.length <= LIMITE_NOME) {
      atualizar(valor);
      return;
    }

    atualizar(valor.slice(0, LIMITE_NOME));

    if (!alertaNomeAberto.current) {
      alertaNomeAberto.current = true;
      Alert.alert(
        "Nome muito longo",
        `O nome deve ter no máximo ${LIMITE_NOME} caracteres.`,
        [{ text: "OK", onPress: () => { alertaNomeAberto.current = false; } }]
      );
    }
  }

  function atualizarEmailComLimite(valor: string, atualizar: (emailLimitado: string) => void) {
    if (valor.length <= LIMITE_EMAIL) {
      atualizar(valor);
      return;
    }

    atualizar(valor.slice(0, LIMITE_EMAIL));

    if (!alertaEmailAberto.current) {
      alertaEmailAberto.current = true;
      Alert.alert(
        "Email muito longo",
        `O email deve ter no máximo ${LIMITE_EMAIL} caracteres.`,
        [{ text: "OK", onPress: () => { alertaEmailAberto.current = false; } }]
      );
    }
  }

  function atualizarSenhaComLimite(valor: string, atualizar: (senhaLimitada: string) => void) {
    if (valor.length <= LIMITE_SENHA) {
      atualizar(valor);
      return;
    }

    atualizar(valor.slice(0, LIMITE_SENHA));

    if (!alertaSenhaAberto.current) {
      alertaSenhaAberto.current = true;
      Alert.alert(
        "Senha muito longa",
        `A senha não deve ultrapassar ${LIMITE_SENHA} dígitos.`,
        [{ text: "OK", onPress: () => { alertaSenhaAberto.current = false; } }]
      );
    }
  }

  function validarConta() {
    if (nome.trim().length < 2) {
      Alert.alert("Nome inválido", "Informe um nome com pelo menos 2 caracteres.");
      return false;
    }

    if (nome.trim().length > LIMITE_NOME) {
      Alert.alert("Nome inválido", `O nome deve ter no máximo ${LIMITE_NOME} caracteres.`);
      return false;
    }

    if (!emailValido(email)) {
      Alert.alert("Email inválido", "Informe um email válido.");
      return false;
    }

    if (senha.length < 6) {
      Alert.alert("Senha curta", "A senha precisa ter pelo menos 6 caracteres.");
      return false;
    }

    if (senha.length > LIMITE_SENHA) {
      Alert.alert("Senha inválida", `A senha deve ter no máximo ${LIMITE_SENHA} caracteres.`);
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
    if (etapaAtual === 2 && !avancarArea()) return;
    if (etapaAtual === 3 && habitosPreview.length === 0) {
      Alert.alert("Escolha pelo menos um hábito", "Mantenha ao menos um hábito para criar sua jornada.");
      return;
    }
    if (ultimaEtapa) {
      criarConta();
      return;
    }

    setEtapaAtual((atual) => Math.min(atual + 1, etapas.length - 1));
  }

  function avancarArea() {
    if (!areaAtualCompleta) {
      Alert.alert("Complete a área", `Escolha 2 atividades de ${areas[indiceAreaAtual]?.label} para continuar.`);
      return false;
    }

    if (proximaArea) {
      setFoco(proximaArea.valor);
      return false;
    }

    if (!atividadesCompletas) {
      Alert.alert("Complete as atividades", "Revise as áreas anteriores e selecione 2 atividades em cada uma.");
      return false;
    }

    setHabitosPreview(gerarMissoesPersonalizadas(foco, tempoDiario, todasAtividadesSelecionadas));
    return true;
  }

  function voltar() {
    if (etapaAtual === 0) {
      navigation.goBack();
      return;
    }

    setEtapaAtual((atual) => Math.max(atual - 1, 0));
  }

  function escolherFoco(area: CategoriaMissao) {
    const indiceArea = areas.findIndex((item) => item.valor === area);
    const areaLiberada = indiceArea === 0 || atividadesPorArea[areas[indiceArea - 1].valor].length === 2;

    if (!areaLiberada) {
      Alert.alert("Área bloqueada", "Complete 2 atividades da área anterior para continuar.");
      return;
    }

    setFoco(area);
  }

  function areaLiberada(indice: number) {
    return indice === 0 || atividadesPorArea[areas[indice - 1].valor].length === 2;
  }

  function mensagemFluxoAtividades() {
    if (!areaAtualCompleta) {
      return `Escolha 2 atividades de ${areas[indiceAreaAtual]?.label} para liberar a próxima área.`;
    }

    if (proximaArea) {
      return `Pronto. ${proximaArea.label} foi liberada. Toque nela para escolher mais 2 itens.`;
    }

    return "Todas as áreas foram preenchidas. Agora você pode avançar para o resumo do cadastro.";
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

  function iniciarEdicaoDados() {
    setNomeEdicao(nome);
    setEmailEdicao(email);
    setEditandoDados(true);
  }

  function salvarEdicaoDados() {
    const nomeLimpo = nomeEdicao.trim();
    const emailLimpo = normalizarEmail(emailEdicao);

    if (nomeLimpo.length < 2) {
      Alert.alert("Nome inválido", "Informe um nome com pelo menos 2 caracteres.");
      return;
    }

    if (nomeLimpo.length > LIMITE_NOME) {
      Alert.alert("Nome inválido", `O nome deve ter no máximo ${LIMITE_NOME} caracteres.`);
      return;
    }

    if (!emailValido(emailLimpo)) {
      Alert.alert("Email inválido", "Informe um email válido.");
      return;
    }

    setNome(nomeLimpo);
    setEmail(emailLimpo);
    setEmailEdicao(emailLimpo);
    setEditandoDados(false);
  }

  function removerHabito(id: string) {
    setHabitosPreview((atuais) => atuais.filter((missao) => missao.id !== id));
  }

  function atualizarDuracaoHabito(id: string, duracaoMinutos: number) {
    const duracaoSegura = Math.min(45, Math.max(5, Math.round(duracaoMinutos)));
    const recompensas = calcularRecompensasPorDuracao(duracaoSegura);

    setHabitosPreview((atuais) =>
      atuais.map((missao) =>
        missao.id === id
          ? {
              ...missao,
              duracaoMinutos: duracaoSegura,
              ...recompensas,
            }
          : missao
      )
    );
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
        avatarId: avatarSelecionado,
        missoesPersonalizadas: habitosPreview,
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

        <ScrollView
          style={styles.etapa}
          contentContainerStyle={[styles.etapaConteudo, etapaAtual === 2 && styles.etapaConteudoAtividades]}
          scrollEnabled={etapaAtual !== 2}
          showsVerticalScrollIndicator={false}
        >
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
              <TextInput style={styles.input} placeholder="Nome" placeholderTextColor={colors.muted} value={nome} onChangeText={(valor) => atualizarNomeComLimite(valor, setNome)} />
              <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.muted} value={email} onChangeText={(valor) => atualizarEmailComLimite(valor, setEmail)} keyboardType="email-address" autoCapitalize="none" />
              <TextInput style={styles.input} placeholder="Senha" placeholderTextColor={colors.muted} value={senha} onChangeText={(valor) => atualizarSenhaComLimite(valor, setSenha)} secureTextEntry />
              <TextInput style={styles.input} placeholder="Confirmar senha" placeholderTextColor={colors.muted} value={confirmacao} onChangeText={(valor) => atualizarSenhaComLimite(valor, setConfirmacao)} secureTextEntry />
            </View>
          )}

          {etapaAtual === 2 && (
            <View>
              <Text style={styles.label}>Área que deseja aprimorar</Text>
              <Text style={styles.descricaoEtapa}>Complete 2 itens para liberar a próxima área.</Text>
              <View style={styles.areaGrid}>
                {areas.map((area, index) => {
                  const liberada = areaLiberada(index);
                  const ativa = foco === area.valor;

                  return (
                    <TouchableOpacity
                      key={area.valor}
                      style={[
                        styles.areaChip,
                        ativa && styles.chipAtivo,
                        !liberada && styles.areaChipBloqueada,
                      ]}
                      onPress={() => escolherFoco(area.valor)}
                      disabled={!liberada}
                    >
                      <Text style={[
                        styles.areaChipTexto,
                        ativa && styles.chipTextoAtivo,
                        !liberada && styles.areaChipTextoBloqueado,
                      ]}>
                        {area.label} {atividadesPorArea[area.valor].length}/2
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.subLabel}>Escolha 2 atividades de {areas[indiceAreaAtual]?.label}</Text>
              <View style={styles.atividadesGrid}>
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
              <Text style={styles.mensagemOrientacao}>{mensagemFluxoAtividades()}</Text>
            </View>
          )}

          {etapaAtual === 3 && (
            <View>
              <Text style={styles.label}>Pré-visualização dos hábitos</Text>
              <Text style={styles.descricaoEtapa}>Essas missões serão criadas com base nas atividades escolhidas.</Text>
              <View style={styles.habitosLista}>
                {habitosPreview.map((missao) => (
                  <View key={missao.id} style={styles.habitoResumoCard}>
                    <View style={styles.habitoTopo}>
                      <Text style={styles.habitoTitulo}>{missao.titulo}</Text>
                      <TouchableOpacity style={styles.removerHabito} onPress={() => removerHabito(missao.id)}>
                        <Text style={styles.removerHabitoTexto}>Remover</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.habitoCategoria}>{missao.categoria}</Text>
                    <Text style={styles.habitoDescricao}>{missao.descricao}</Text>
                    <View style={styles.duracaoLinha}>
                      <TouchableOpacity style={styles.stepper} onPress={() => atualizarDuracaoHabito(missao.id, missao.duracaoMinutos - 5)}>
                        <Text style={styles.stepperTexto}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.duracao}>{missao.duracaoMinutos} min</Text>
                      <TouchableOpacity style={styles.stepper} onPress={() => atualizarDuracaoHabito(missao.id, missao.duracaoMinutos + 5)}>
                        <Text style={styles.stepperTexto}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.habitoMeta}>{missao.recompensaXp} XP • {missao.recompensaMoedas} moedas</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {etapaAtual === 4 && (
            <View>
              <Text style={styles.label}>Resumo do cadastro</Text>
              <View style={styles.resumo}>
                <View style={styles.resumoTopo}>
                  <Text style={styles.resumoTitulo}>Confira seus dados</Text>
                  {!editandoDados && (
                    <TouchableOpacity style={styles.editarBotao} onPress={iniciarEdicaoDados}>
                      <Text style={styles.editarBotaoTexto}>Editar</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {editandoDados ? (
                  <View style={styles.card}>
                    <Text style={styles.labelCampo}>Nome</Text>
                    <TextInput style={styles.input} placeholder="Nome" placeholderTextColor={colors.muted} value={nomeEdicao} onChangeText={(valor) => atualizarNomeComLimite(valor, setNomeEdicao)} />
                    <Text style={styles.labelCampo}>E-mail</Text>
                    <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.muted} value={emailEdicao} onChangeText={(valor) => atualizarEmailComLimite(valor, setEmailEdicao)} keyboardType="email-address" autoCapitalize="none" />
                    <Botao titulo="Salvar dados" onPress={salvarEdicaoDados} />
                  </View>
                ) : (
                  <View style={styles.resumoDados}>
                    <View style={styles.resumoLinha}>
                      <Text style={styles.resumoLabel}>Nome</Text>
                      <Text style={styles.resumoValor}>{nome || "Seu nome"}</Text>
                    </View>
                    <View style={styles.resumoLinha}>
                      <Text style={styles.resumoLabel}>E-mail</Text>
                      <Text style={styles.resumoValor}>{email || "email"}</Text>
                    </View>
                  </View>
                )}
                <View style={styles.resumoLinha}>
                  <Text style={styles.resumoLabel}>Hábitos mantidos</Text>
                  <Text style={styles.resumoValor}>{habitosPreview.length}</Text>
                </View>
              </View>
            </View>
          )}

          {etapaAtual === 5 && (
            <View>
              <Text style={styles.label}>Escolha seu avatar</Text>
              <Text style={styles.descricaoEtapa}>Ele representa sua evolução dentro do NewCare.</Text>
              <View style={styles.grid}>
                {avataresIniciais.map((avatar) => {
                  const ativo = avatarSelecionado === avatar.id;

                  return (
                    <TouchableOpacity
                      key={avatar.id}
                      style={[styles.avatarCard, ativo && styles.avatarCardAtivo]}
                      onPress={() => setAvatarSelecionado(avatar.id)}
                    >
                      <Text style={styles.avatarSimbolo}>{avatar.simbolo}</Text>
                      <Text style={styles.avatarNome}>{avatar.nome}</Text>
                      <Text style={styles.avatarFase}>{avatar.foco}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.navegacao}>
          <TouchableOpacity style={styles.botaoVoltar} onPress={voltar}>
            <Text style={styles.botaoVoltarTexto}>{etapaAtual === 0 ? "Login" : "Voltar"}</Text>
          </TouchableOpacity>
          <View style={styles.botaoAvancar}>
            <Botao
              titulo={ultimaEtapa ? "Finalizar cadastro" : "Avançar"}
              onPress={avancar}
              carregando={carregando}
            />
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
  etapaConteudoAtividades: { flexGrow: 1, paddingBottom: 0 },
  card: { gap: 10, marginBottom: 18 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, fontSize: 16, fontWeight: "700", minHeight: 50, paddingHorizontal: 14 },
  labelCampo: { color: colors.text, fontSize: 13, fontWeight: "900", marginBottom: -4 },
  label: { color: colors.text, fontSize: 16, fontWeight: "900", marginBottom: 10, marginTop: 10 },
  descricaoEtapa: { color: colors.muted, fontSize: 13, fontWeight: "700", lineHeight: 18, marginBottom: 10 },
  subLabel: { color: colors.text, fontSize: 14, fontWeight: "900", marginBottom: 8, marginTop: 14 },
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
  areaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  areaChip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 999, borderWidth: 1, minHeight: 36, justifyContent: "center", paddingHorizontal: 10, width: "48%" },
  areaChipBloqueada: { opacity: 0.35 },
  areaChipTexto: { color: colors.muted, fontSize: 13, fontWeight: "900", textAlign: "center" },
  areaChipTextoBloqueado: { color: colors.muted },
  atividadesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  atividadeCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, minHeight: 90, padding: 10, width: "48%" },
  atividadeCardAtiva: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  atividadeTopo: { gap: 6 },
  atividadeTitulo: { color: colors.text, fontSize: 13, fontWeight: "900" },
  atividadeBadge: { alignSelf: "flex-start", backgroundColor: colors.card, borderRadius: 999, color: colors.muted, fontSize: 10, fontWeight: "900", overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3 },
  atividadeBadgeAtiva: { backgroundColor: colors.primary, color: colors.surface },
  atividadeDescricao: { color: colors.muted, fontSize: 11, fontWeight: "700", lineHeight: 14, marginTop: 5 },
  contadorAtividades: { color: colors.primary, fontSize: 12, fontWeight: "900", marginTop: 6, textAlign: "right" },
  mensagemOrientacao: { backgroundColor: colors.primarySoft, borderRadius: 10, color: colors.primary, fontSize: 12, fontWeight: "900", lineHeight: 16, marginTop: 6, padding: 8 },
  avatarCard: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, minHeight: 145, justifyContent: "center", padding: 12, width: "48%" },
  avatarCardAtivo: { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderWidth: 2 },
  avatarSimbolo: { fontSize: 34, marginBottom: 10 },
  avatarNome: { color: colors.text, fontSize: 15, fontWeight: "900", textAlign: "center" },
  avatarFase: { color: colors.primary, fontWeight: "900", marginTop: 6 },
  habitosLista: { gap: 8 },
  habitoResumoCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, padding: 12 },
  habitoTopo: { alignItems: "flex-start", flexDirection: "row", gap: 10, justifyContent: "space-between" },
  habitoTitulo: { color: colors.text, flex: 1, fontSize: 14, fontWeight: "900" },
  habitoCategoria: { color: colors.primary, fontSize: 11, fontWeight: "900", textTransform: "capitalize" },
  habitoDescricao: { color: colors.muted, fontSize: 12, fontWeight: "700", lineHeight: 16, marginTop: 6 },
  habitoMeta: { color: colors.secondary, fontSize: 12, fontWeight: "900", marginTop: 8 },
  removerHabito: { backgroundColor: colors.warningSoft, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  removerHabitoTexto: { color: colors.warning, fontSize: 11, fontWeight: "900" },
  duracaoLinha: { alignItems: "center", flexDirection: "row", gap: 12, marginTop: 10 },
  stepper: { alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: 999, height: 30, justifyContent: "center", width: 30 },
  stepperTexto: { color: colors.primary, fontSize: 18, fontWeight: "900", lineHeight: 20 },
  duracao: { color: colors.text, fontSize: 14, fontWeight: "900", minWidth: 58, textAlign: "center" },
  resumo: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, marginTop: 18, padding: 14 },
  resumoTopo: { alignItems: "center", flexDirection: "row", gap: 12, justifyContent: "space-between", marginBottom: 4 },
  resumoTitulo: { color: colors.text, fontSize: 16, fontWeight: "900", marginBottom: 8 },
  resumoTexto: { color: colors.muted, fontWeight: "800", marginTop: 4 },
  resumoDados: { gap: 8 },
  resumoLinha: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 10, borderWidth: 1, marginTop: 8, padding: 10 },
  resumoLabel: { color: colors.muted, fontSize: 11, fontWeight: "900", marginBottom: 3, textTransform: "uppercase" },
  resumoValor: { color: colors.text, fontSize: 15, fontWeight: "900" },
  editarBotao: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  editarBotaoTexto: { color: colors.primary, fontSize: 12, fontWeight: "900" },
  navegacao: { alignItems: "center", flexDirection: "row", gap: 12, paddingTop: 12 },
  botaoVoltar: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, justifyContent: "center", minHeight: 50, paddingHorizontal: 18 },
  botaoVoltarTexto: { color: colors.text, fontWeight: "900" },
  botaoAvancar: { flex: 1 },
});
