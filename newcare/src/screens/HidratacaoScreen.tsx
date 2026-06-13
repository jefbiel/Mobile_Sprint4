import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { AppColors } from "../../constants/theme";
import { Botao } from "../components/Botao";

const medidas = [250, 300, 500, 750, 1000];
const niveisAtividade = [
  { label: "Baixo", valor: "baixo", adicionalMl: 0 },
  { label: "Moderado", valor: "moderado", adicionalMl: 350 },
  { label: "Alto", valor: "alto", adicionalMl: 700 },
] as const;

export function HidratacaoScreen() {
  const { colors, hidratacao, registrarAguaBebida, salvarMetaHidratacao, selecionarMedidaAgua } = useApp();
  const styles = criarStyles(colors);
  const [peso, setPeso] = useState(String(hidratacao.dadosSaude?.pesoKg ?? ""));
  const [altura, setAltura] = useState(String(hidratacao.dadosSaude?.alturaCm ?? ""));
  const [idade, setIdade] = useState(String(hidratacao.dadosSaude?.idade ?? ""));
  const [temperatura, setTemperatura] = useState(String(hidratacao.dadosSaude?.temperaturaC ?? 25));
  const [umidade, setUmidade] = useState(String(hidratacao.dadosSaude?.umidadePercentual ?? 62));
  const [nivelAtividade, setNivelAtividade] = useState<"baixo" | "moderado" | "alto">(
    hidratacao.dadosSaude?.nivelAtividade ?? "moderado"
  );
  const pesoKg = Number(peso.replace(",", "."));
  const alturaCm = Number(altura.replace(",", "."));
  const idadeAnos = Number(idade.replace(",", "."));
  const temp = Number(temperatura.replace(",", "."));
  const umidadePercentual = Number(umidade.replace(",", "."));
  const atividade = niveisAtividade.find((item) => item.valor === nivelAtividade) ?? niveisAtividade[1];
  const metaMl = hidratacao.metaMl ?? 0;
  const restanteMl = Math.max(0, metaMl - hidratacao.consumidoMl);
  const coposRestantes = metaMl > 0 ? Math.ceil(restanteMl / hidratacao.medidaPadraoMl) : 0;
  const progresso = metaMl > 0 ? Math.min((hidratacao.consumidoMl / metaMl) * 100, 100) : 0;

  function calcularMeta() {
    if (!Number.isFinite(pesoKg) || pesoKg <= 0) return 0;

    const base = pesoKg * 35;
    const alturaAjuste = Number.isFinite(alturaCm) && alturaCm > 0 ? Math.max(0, alturaCm - 160) * 3 : 0;
    const idadeAjuste = Number.isFinite(idadeAnos) && idadeAnos >= 60 ? -150 : 0;
    const calorAjuste = Number.isFinite(temp) ? Math.max(0, temp - 24) * 80 : 0;
    const umidadeAjuste = Number.isFinite(umidadePercentual) && umidadePercentual < 35 ? 150 : 0;

    return Math.max(1200, Math.round(base + alturaAjuste + idadeAjuste + calorAjuste + umidadeAjuste + atividade.adicionalMl));
  }

  async function calcularESalvar() {
    const calculada = calcularMeta();

    if (!Number.isFinite(pesoKg) || pesoKg <= 0 || !Number.isFinite(alturaCm) || alturaCm <= 0 || !Number.isFinite(idadeAnos) || idadeAnos <= 0) {
      Alert.alert("Complete seus dados", "Informe peso, altura e idade para calcular a meta de água.");
      return;
    }

    await salvarMetaHidratacao(
      {
        pesoKg,
        alturaCm,
        idade: idadeAnos,
        nivelAtividade,
        temperaturaC: Number.isFinite(temp) ? temp : 25,
        umidadePercentual: Number.isFinite(umidadePercentual) ? umidadePercentual : 62,
      },
      calculada
    );
    Alert.alert("Meta calculada", `Sua meta diária foi definida em ${(calculada / 1000).toFixed(2)} L.`);
  }

  async function registrar() {
    if (metaMl <= 0) {
      Alert.alert("Informe seu peso", "O peso é necessário para calcular a meta diária.");
      return;
    }

    await registrarAguaBebida(metaMl);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.titulo}>Hidratação Inteligente</Text>
        <Text style={styles.subtitulo}>Preencha seus dados para calcular e salvar sua meta diária.</Text>

        <View style={styles.card}>
          <Text style={styles.valor}>{metaMl ? `${(metaMl / 1000).toFixed(2)} L` : "--"}</Text>
          <Text style={styles.label}>Meta diária</Text>
          <View style={styles.barra}><View style={[styles.barraInterna, { width: `${progresso}%` }]} /></View>
          <Text style={styles.texto}>{hidratacao.consumidoMl}/{metaMl || "--"} ml consumidos • {coposRestantes} copos restantes</Text>
        </View>

        <View style={styles.linha}>
          <TextInput style={styles.input} placeholder="Peso kg" placeholderTextColor={colors.muted} value={peso} onChangeText={setPeso} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Altura cm" placeholderTextColor={colors.muted} value={altura} onChangeText={setAltura} keyboardType="numeric" />
        </View>

        <View style={styles.linha}>
          <TextInput style={styles.input} placeholder="Idade" placeholderTextColor={colors.muted} value={idade} onChangeText={setIdade} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Temperatura" placeholderTextColor={colors.muted} value={temperatura} onChangeText={setTemperatura} keyboardType="numeric" />
        </View>

        <View style={styles.linha}>
          <TextInput style={styles.input} placeholder="Umidade %" placeholderTextColor={colors.muted} value={umidade} onChangeText={setUmidade} keyboardType="numeric" />
        </View>

        <Text style={styles.labelForte}>Atividade física</Text>
        <View style={styles.chips}>
          {niveisAtividade.map((item) => (
            <TouchableOpacity key={item.valor} style={[styles.chip, nivelAtividade === item.valor && styles.chipAtivo]} onPress={() => setNivelAtividade(item.valor)}>
              <Text style={[styles.chipTexto, nivelAtividade === item.valor && styles.chipTextoAtivo]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.grid}>
          <View style={styles.info}><Text style={styles.infoValor}>{temperatura}°C</Text><Text style={styles.infoLabel}>Temperatura</Text></View>
          <View style={styles.info}><Text style={styles.infoValor}>{umidade || "--"}%</Text><Text style={styles.infoLabel}>Umidade</Text></View>
          <View style={styles.info}><Text style={styles.infoValor}>online</Text><Text style={styles.infoLabel}>Sensor</Text></View>
          <View style={styles.info}><Text style={styles.infoValor}>agora</Text><Text style={styles.infoLabel}>Atualização</Text></View>
        </View>

        <Botao titulo="Calcular e salvar meta" onPress={calcularESalvar} />
        <View style={styles.espaco} />

        <Text style={styles.labelForte}>Medida padrão</Text>
        <View style={styles.chips}>
          {medidas.map((medida) => (
            <TouchableOpacity key={medida} style={[styles.chip, hidratacao.medidaPadraoMl === medida && styles.chipAtivo]} onPress={() => selecionarMedidaAgua(medida)}>
              <Text style={[styles.chipTexto, hidratacao.medidaPadraoMl === medida && styles.chipTextoAtivo]}>{medida >= 1000 ? `${medida / 1000} L` : `${medida} ml`}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Botao titulo="Registrar água" onPress={registrar} />
      </ScrollView>
    </SafeAreaView>
  );
}

const criarStyles = (colors: AppColors) => StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  content: { padding: 20, paddingBottom: 28 },
  titulo: { color: colors.text, fontSize: 28, fontWeight: "900" },
  subtitulo: { color: colors.muted, fontWeight: "700", marginBottom: 18, marginTop: 6 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, marginBottom: 12, padding: 16 },
  valor: { color: colors.primary, fontSize: 34, fontWeight: "900" },
  label: { color: colors.muted, fontWeight: "900", marginTop: 4 },
  texto: { color: colors.muted, fontWeight: "700", marginTop: 10 },
  barra: { backgroundColor: colors.background, borderRadius: 999, height: 10, marginTop: 14, overflow: "hidden" },
  barraInterna: { backgroundColor: colors.primary, height: "100%" },
  linha: { flexDirection: "row", gap: 10, marginBottom: 12 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, flex: 1, minHeight: 48, paddingHorizontal: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  info: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, padding: 12, width: "48%" },
  infoValor: { color: colors.text, fontSize: 17, fontWeight: "900" },
  infoLabel: { color: colors.muted, fontSize: 12, fontWeight: "800", marginTop: 2 },
  labelForte: { color: colors.text, fontWeight: "900", marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  chipAtivo: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipTexto: { color: colors.muted, fontWeight: "900" },
  chipTextoAtivo: { color: colors.primary },
  espaco: { height: 12 },
});
