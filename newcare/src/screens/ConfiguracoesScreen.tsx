import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Botao } from "../components/Botao";
import { BrandHeader } from "../components/BrandHeader";
import { useApp } from "../context/AppContext";
import { AppColors, Colors, PaletaAcessibilidadeId, paletasAcessibilidade } from "../../constants/theme";
import { emailValido, LIMITE_EMAIL, LIMITE_NOME, LIMITE_SENHA, normalizarEmail } from "../utils/validacoes";

function numero(valor: string) {
  return Number(valor.replace(",", "."));
}

export function ConfiguracoesScreen() {
  const { atualizarPaletaAcessibilidade, atualizarPerfil, colors, hidratacao, logout, salvarMetaHidratacao, usuario } = useApp();
  const styles = criarStyles(colors);
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [senha, setSenha] = useState("");
  const [paleta, setPaleta] = useState(usuario?.preferencias.paletaAcessibilidade ?? "auroraHealth");
  const [peso, setPeso] = useState(String(hidratacao.dadosSaude?.pesoKg ?? ""));
  const [altura, setAltura] = useState(String(hidratacao.dadosSaude?.alturaCm ?? ""));
  const [idade, setIdade] = useState(String(hidratacao.dadosSaude?.idade ?? ""));
  const [metaHidratacao, setMetaHidratacao] = useState(String(hidratacao.metaMl ?? ""));
  const alertaSenhaAberto = useRef(false);

  useEffect(() => {
    if (!usuario) return;
    setPaleta(usuario.preferencias.paletaAcessibilidade);
  }, [usuario]);

  async function selecionarPaleta(paletaAcessibilidade: PaletaAcessibilidadeId) {
    setPaleta(paletaAcessibilidade);
    await atualizarPaletaAcessibilidade(paletaAcessibilidade);
  }

  function atualizarSenhaComLimite(valor: string) {
    if (valor.length <= LIMITE_SENHA) {
      setSenha(valor);
      return;
    }

    setSenha(valor.slice(0, LIMITE_SENHA));

    if (!alertaSenhaAberto.current) {
      alertaSenhaAberto.current = true;
      Alert.alert(
        "Senha muito longa",
        `A senha não deve ultrapassar ${LIMITE_SENHA} dígitos.`,
        [{ text: "OK", onPress: () => { alertaSenhaAberto.current = false; } }]
      );
    }
  }

  async function salvar() {
    if (!usuario) return;

    if (nome.trim().length < 2 || nome.trim().length > LIMITE_NOME || !emailValido(email)) {
      Alert.alert("Dados inválidos", "Informe nome e e-mail válidos.");
      return;
    }

    const querSalvarSaude = Boolean(
      peso.trim() ||
      altura.trim() ||
      idade.trim() ||
      metaHidratacao.trim() ||
      hidratacao.dadosSaude ||
      hidratacao.metaMl
    );
    const pesoKg = numero(peso);
    const alturaCm = numero(altura);
    const idadeAnos = numero(idade);
    const metaMl = numero(metaHidratacao);

    if (querSalvarSaude) {
      if (!Number.isFinite(pesoKg) || pesoKg <= 0 || !Number.isFinite(alturaCm) || alturaCm <= 0 || !Number.isFinite(idadeAnos) || idadeAnos <= 0) {
        Alert.alert("Preferências de saúde", "Informe peso, altura e idade válidos.");
        return;
      }

      if (!Number.isFinite(metaMl) || metaMl <= 0) {
        Alert.alert("Meta de hidratação", "Informe uma meta de hidratação válida em ml.");
        return;
      }
    }

    await atualizarPerfil({
      nome: nome.trim(),
      email: normalizarEmail(email),
      areaDominante: usuario.areaDominante,
      tempoDiario: usuario.perfil?.tempoDiario,
      preferencias: {
        ...usuario.preferencias,
        paletaAcessibilidade: paleta,
      },
    });

    if (querSalvarSaude) {
      await salvarMetaHidratacao(
        {
          pesoKg,
          alturaCm,
          idade: idadeAnos,
          nivelAtividade: hidratacao.dadosSaude?.nivelAtividade ?? "moderado",
          temperaturaC: hidratacao.dadosSaude?.temperaturaC ?? 25,
          umidadePercentual: hidratacao.dadosSaude?.umidadePercentual ?? 62,
        },
        Math.round(metaMl)
      );
    }

    Alert.alert("Configurações salvas", senha ? "Senha registrada para alteração futura." : "Preferências atualizadas.");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerFixo}>
        <BrandHeader compact showBackButton />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.titulo}>Configurações</Text>
        <TextInput style={styles.input} placeholder="Nome" placeholderTextColor={colors.muted} value={nome} onChangeText={setNome} maxLength={LIMITE_NOME} />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" maxLength={LIMITE_EMAIL} />
        <TextInput style={styles.input} placeholder="Nova senha" placeholderTextColor={colors.muted} value={senha} onChangeText={atualizarSenhaComLimite} secureTextEntry />

        <Text style={styles.label}>Cor de acessibilidade</Text>
        <View style={styles.paletasGrid}>
          {paletasAcessibilidade.map((item) => {
            const ativa = paleta === item.id;
            const amostra = Colors[item.id];

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.paletaBotao, ativa && styles.paletaBotaoAtivo]}
                onPress={() => selecionarPaleta(item.id)}
              >
                <View style={styles.paletaTopo}>
                  <View style={[styles.amostraCor, { backgroundColor: amostra.primary }]} />
                  <View style={[styles.amostraCor, { backgroundColor: amostra.secondary }]} />
                  <View style={[styles.amostraCor, { backgroundColor: amostra.accent }]} />
                </View>
                <Text style={styles.paletaNome}>{item.nome}</Text>
                <Text style={styles.paletaResumo}>{ativa ? "Ativo" : item.resumo}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Preferências de saúde</Text>
        <View style={styles.linha}>
          <View style={styles.campoFlex}>
            <Text style={styles.campoLabel}>Peso (kg)</Text>
            <TextInput style={styles.inputFlex} placeholder="Ex: 80" placeholderTextColor={colors.muted} value={peso} onChangeText={setPeso} keyboardType="numeric" />
          </View>
          <View style={styles.campoFlex}>
            <Text style={styles.campoLabel}>Altura (cm)</Text>
            <TextInput style={styles.inputFlex} placeholder="Ex: 178" placeholderTextColor={colors.muted} value={altura} onChangeText={setAltura} keyboardType="numeric" />
          </View>
        </View>
        <View style={styles.linha}>
          <View style={styles.campoFlex}>
            <Text style={styles.campoLabel}>Idade</Text>
            <TextInput style={styles.inputFlex} placeholder="Ex: 21" placeholderTextColor={colors.muted} value={idade} onChangeText={setIdade} keyboardType="numeric" />
          </View>
          <View style={styles.campoFlex}>
            <Text style={styles.campoLabel}>Meta diária (ml)</Text>
            <TextInput style={styles.inputFlex} placeholder="Ex: 3284" placeholderTextColor={colors.muted} value={metaHidratacao} onChangeText={setMetaHidratacao} keyboardType="numeric" />
          </View>
        </View>
        <Botao titulo="Salvar configurações" onPress={salvar} />
        <View style={styles.espaco} />
        <Botao titulo="Sair da conta" variante="secundario" onPress={logout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const criarStyles = (colors: AppColors) => StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  headerFixo: { backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: 1, paddingHorizontal: 20, paddingTop: 10 },
  content: { gap: 10, padding: 20, paddingBottom: 28, paddingTop: 16 },
  titulo: { color: colors.text, fontSize: 28, fontWeight: "900", marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, minHeight: 50, paddingHorizontal: 14 },
  inputFlex: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, flex: 1, minHeight: 50, paddingHorizontal: 14 },
  campoFlex: { flex: 1, gap: 6 },
  campoLabel: { color: colors.muted, fontSize: 12, fontWeight: "900" },
  label: { color: colors.text, fontWeight: "900", marginTop: 8 },
  linha: { flexDirection: "row", gap: 10 },
  paletasGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  paletaBotao: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, minHeight: 112, padding: 12, width: "48%" },
  paletaBotaoAtivo: { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderWidth: 2 },
  paletaTopo: { flexDirection: "row", gap: 6, marginBottom: 10 },
  amostraCor: { borderColor: colors.border, borderRadius: 999, borderWidth: 1, height: 20, width: 20 },
  paletaNome: { color: colors.text, fontSize: 14, fontWeight: "900", lineHeight: 17 },
  paletaResumo: { color: colors.primary, fontSize: 12, fontWeight: "800", marginTop: 4 },
  espaco: { height: 2 },
});
