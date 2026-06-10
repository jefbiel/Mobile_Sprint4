import { useState } from "react";
import { Alert, FlatList, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { CardMissao } from "../components/CardMissao";
import { useApp } from "../context/AppContext";
import { CategoriaMissao, StatusMissao, TipoMissao } from "../types";
import { AppColors } from "../../constants/theme";
import { Botao } from "../components/Botao";
import { BrandHeader } from "../components/BrandHeader";

const categorias = [
  { label: "Mental", valor: CategoriaMissao.Mental },
  { label: "Física", valor: CategoriaMissao.Fisica },
  { label: "Lazer", valor: CategoriaMissao.Lazer },
  { label: "Sono", valor: CategoriaMissao.Sono },
];

const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"];
const meses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function formatarDataISO(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function dataRelativa(dias: number) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return formatarDataISO(data);
}

function formatarDataCurta(dataISO: string) {
  const [ano, mes, dia] = dataISO.split("-");
  if (!ano || !mes || !dia) return dataISO;
  return `${dia}/${mes}`;
}

function dataPorISO(dataISO: string) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function dataValida(dataISO: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) return false;
  const data = dataPorISO(dataISO);
  return !Number.isNaN(data.getTime()) && formatarDataISO(data) === dataISO;
}

function horarioValido(horario: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(horario);
}

function diasDoMes(mesVisivel: Date) {
  const ano = mesVisivel.getFullYear();
  const mes = mesVisivel.getMonth();
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const dias = Array.from({ length: primeiroDia }, () => null as number | null);

  for (let dia = 1; dia <= totalDias; dia += 1) {
    dias.push(dia);
  }

  while (dias.length % 7 !== 0) {
    dias.push(null);
  }

  return dias;
}

export function HabitosScreen() {
  const { colors, missoes, completarMissao, adicionarMissao } = useApp();
  const styles = criarStyles(colors);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState(CategoriaMissao.Mental);
  const [duracao, setDuracao] = useState("5");
  const [dataAgendada, setDataAgendada] = useState(dataRelativa(0));
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [mesCalendario, setMesCalendario] = useState(dataPorISO(dataRelativa(0)));
  const [horarioLembrete, setHorarioLembrete] = useState("08:00");
  const [lembreteAtivo, setLembreteAtivo] = useState(true);
  const hoje = dataRelativa(0);
  const pendentes = missoes.filter((m) => m.status === StatusMissao.Pendente);
  const missoesConcluidas = missoes.filter((m) => m.status === StatusMissao.Concluida);
  const agendaHoje = pendentes
    .filter((m) => m.dataAgendada === hoje)
    .sort((a, b) => (a.horarioLembrete ?? "23:59").localeCompare(b.horarioLembrete ?? "23:59"));
  const concluidas = missoes.filter((m) => m.status === StatusMissao.Concluida).length;
  const metadeConcluida = missoes.length > 0 && concluidas >= Math.ceil(missoes.length / 2);

  async function criarMissao() {
    const tituloLimpo = titulo.trim();
    const descricaoLimpa = descricao.trim();
    const duracaoMinutos = Number(duracao);

    if (!tituloLimpo || !descricaoLimpa) {
      Alert.alert("Complete os campos", "Informe título e descrição da nova missão.");
      return;
    }

    if (!Number.isFinite(duracaoMinutos) || duracaoMinutos < 1) {
      Alert.alert("Duração inválida", "Informe uma duração de pelo menos 1 minuto.");
      return;
    }

    if (!dataValida(dataAgendada)) {
      Alert.alert("Data inválida", "Use o formato AAAA-MM-DD, por exemplo 2026-05-23.");
      return;
    }

    if (lembreteAtivo && !horarioValido(horarioLembrete)) {
      Alert.alert("Horário inválido", "Use o formato HH:MM, por exemplo 08:30.");
      return;
    }

    await adicionarMissao({
      titulo: tituloLimpo,
      descricao: descricaoLimpa,
      categoria,
      tipo: TipoMissao.Simples,
      recompensaXp: Math.min(50, Math.max(10, duracaoMinutos * 5)),
      recompensaMoedas: Math.min(20, Math.max(3, Math.ceil(duracaoMinutos / 2))),
      duracaoMinutos,
      dataAgendada,
      horarioLembrete: lembreteAtivo ? horarioLembrete : undefined,
      lembreteAtivo,
    });

    setTitulo("");
    setDescricao("");
    setCategoria(CategoriaMissao.Mental);
    setDuracao("5");
    selecionarData(dataRelativa(0), false);
    setHorarioLembrete("08:00");
    setLembreteAtivo(true);
    Alert.alert("Missão adicionada", "Sua nova missão entrou na lista de pendentes.");
  }

  function selecionarData(dataISO: string, fecharCalendario = true) {
    setDataAgendada(dataISO);
    setMesCalendario(dataPorISO(dataISO));
    if (fecharCalendario) setCalendarioAberto(false);
  }

  function mudarMesCalendario(delta: number) {
    setMesCalendario((atual) => new Date(atual.getFullYear(), atual.getMonth() + delta, 1));
  }

  function concluirMissao(id: string) {
    const missao = missoes.find((item) => item.id === id);
    completarMissao(id);
    if (missao?.status === StatusMissao.Pendente) {
      Alert.alert("Missão concluída", `Você ganhou ${missao.recompensaXp} XP.`);
    }
  }

  function renderCalendario() {
    const dias = diasDoMes(mesCalendario);
    const ano = mesCalendario.getFullYear();
    const mes = mesCalendario.getMonth();
    const semanas: (number | null)[][] = [];

    for (let index = 0; index < dias.length; index += 7) {
      semanas.push(dias.slice(index, index + 7));
    }

    return (
      <View style={styles.calendarioBox}>
        <View style={styles.calendarioHeader}>
          <TouchableOpacity style={styles.calendarioNav} onPress={() => mudarMesCalendario(-1)}>
            <Text style={styles.calendarioNavTexto}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.calendarioMes}>
            {meses[mes]} {ano}
          </Text>
          <TouchableOpacity style={styles.calendarioNav} onPress={() => mudarMesCalendario(1)}>
            <Text style={styles.calendarioNavTexto}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calendarioSemanaLinha}>
          {diasSemana.map((dia, index) => (
            <Text key={`${dia}-${index}`} style={styles.calendarioSemana}>
              {dia}
            </Text>
          ))}
        </View>

        <View style={styles.calendarioGrade}>
          {semanas.map((semana, semanaIndex) => (
            <View key={`semana-${semanaIndex}`} style={styles.calendarioLinha}>
              {semana.map((dia, diaIndex) => {
                const dataISO = dia ? formatarDataISO(new Date(ano, mes, dia)) : "";
                const selecionado = dataISO === dataAgendada;
                const eHoje = dataISO === hoje;

                return (
                  <View key={`${dataISO}-${semanaIndex}-${diaIndex}`} style={styles.calendarioCelula}>
                    <TouchableOpacity
                      style={[
                        styles.calendarioDia,
                        !dia && styles.calendarioDiaVazio,
                        eHoje && styles.calendarioDiaHoje,
                        selecionado && styles.calendarioDiaSelecionado,
                      ]}
                      disabled={!dia}
                      onPress={() => selecionarData(dataISO)}
                    >
                      <Text
                        style={[
                          styles.calendarioDiaTexto,
                          eHoje && styles.calendarioDiaTextoHoje,
                          selecionado && styles.calendarioDiaTextoSelecionado,
                        ]}
                      >
                        {dia ?? ""}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  }

  function renderAgendaHoje() {
    return (
      <View style={styles.agendaBox}>
        <View style={styles.agendaHeader}>
          <View>
            <Text style={styles.extraTitulo}>Agenda de hoje</Text>
            <Text style={styles.agendaData}>{formatarDataCurta(hoje)}</Text>
          </View>
          <Text style={styles.agendaContador}>{agendaHoje.length}</Text>
        </View>

        {agendaHoje.length === 0 ? (
          <Text style={styles.listaVazia}>Nenhuma missão agendada para hoje.</Text>
        ) : (
          agendaHoje.map((item) => (
            <View key={item.id} style={styles.agendaItem}>
              <Text style={styles.agendaHora}>{item.horarioLembrete ?? "--:--"}</Text>
              <View style={styles.agendaConteudo}>
                <Text style={styles.agendaTitulo}>{item.titulo}</Text>
                <Text style={styles.agendaDescricao}>
                  {item.lembreteAtivo ? "Lembrete ativo" : "Sem lembrete"} • {item.duracaoMinutos} min
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  }

  function renderAdicionarMissao() {
    return (
      <View style={styles.extraBox}>
        <Text style={styles.extraTitulo}>Adicionar nova missão</Text>
        <Text style={styles.extraTexto}>
          {metadeConcluida
            ? "Você já concluiu metade das missões. Crie um novo desafio para continuar evoluindo."
            : `Complete pelo menos metade das missões para liberar novas tarefas (${concluidas}/${Math.ceil(missoes.length / 2)}).`}
        </Text>

        {metadeConcluida && (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Título da missão"
              placeholderTextColor={colors.muted}
              value={titulo}
              onChangeText={setTitulo}
            />
            <TextInput
              style={[styles.input, styles.inputDescricao]}
              placeholder="Descrição"
              placeholderTextColor={colors.muted}
              value={descricao}
              onChangeText={setDescricao}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Duração em minutos"
              placeholderTextColor={colors.muted}
              value={duracao}
              onChangeText={setDuracao}
              keyboardType="numeric"
            />

            <View style={styles.linhaCampos}>
              <TouchableOpacity
                style={[styles.input, styles.inputMetade, styles.dataBotao]}
                onPress={() => setCalendarioAberto((aberto) => !aberto)}
              >
                <Text style={styles.dataRotulo}>Data</Text>
                <Text style={styles.dataValor}>{formatarDataCurta(dataAgendada)}</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.inputMetade]}
                placeholder="Horário HH:MM"
                placeholderTextColor={colors.muted}
                value={horarioLembrete}
                onChangeText={setHorarioLembrete}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            {calendarioAberto && renderCalendario()}

            <View style={styles.atalhosData}>
              <TouchableOpacity style={styles.atalhoData} onPress={() => selecionarData(dataRelativa(0))}>
                <Text style={styles.atalhoDataTexto}>Hoje</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.atalhoData} onPress={() => selecionarData(dataRelativa(1))}>
                <Text style={styles.atalhoDataTexto}>Amanhã</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.lembreteLinha}>
              <View>
                <Text style={styles.lembreteTitulo}>Lembrete</Text>
                <Text style={styles.lembreteTexto}>Mostrar na agenda da missão</Text>
              </View>
              <Switch
                value={lembreteAtivo}
                onValueChange={setLembreteAtivo}
                trackColor={{ false: colors.border, true: colors.primarySoft }}
                thumbColor={lembreteAtivo ? colors.primary : colors.muted}
              />
            </View>

            <View style={styles.categorias}>
              {categorias.map((item) => (
                <TouchableOpacity
                  key={item.valor}
                  style={[styles.chip, categoria === item.valor && styles.chipAtivo]}
                  onPress={() => setCategoria(item.valor)}
                >
                  <Text style={[styles.chipTexto, categoria === item.valor && styles.chipTextoAtivo]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Botao titulo="Incluir missão" onPress={criarMissao} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BrandHeader compact />
      <Text style={styles.titulo}>Missões</Text>
      <Text style={styles.subtitulo}>Acompanhe status, categoria, duração e recompensa.</Text>

      <FlatList
        data={pendentes}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            {renderAgendaHoje()}
            {renderAdicionarMissao()}
            <Text style={styles.listaTitulo}>Pendentes</Text>
            {pendentes.length === 0 && (
              <Text style={styles.listaVazia}>Nenhuma missão pendente no momento.</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View>
            <Text style={styles.status}>
              {item.status === StatusMissao.Concluida ? "Concluída" : "Pendente"} • {item.categoria} • {item.duracaoMinutos} min
              {item.dataAgendada ? ` • ${formatarDataCurta(item.dataAgendada)}` : ""}
              {item.horarioLembrete ? ` às ${item.horarioLembrete}` : ""}
            </Text>
            <CardMissao missao={item} onPress={concluirMissao} />
          </View>
        )}
        ListFooterComponent={
          <View style={styles.concluidasBox}>
            <Text style={styles.listaTitulo}>Concluídas</Text>
            {missoesConcluidas.length === 0 ? (
              <Text style={styles.listaVazia}>As missões concluídas aparecerão aqui.</Text>
            ) : (
              missoesConcluidas.map((item) => (
                <View key={item.id}>
                  <Text style={styles.status}>
                    Concluída • {item.categoria} • {item.duracaoMinutos} min
                    {item.dataAgendada ? ` • ${formatarDataCurta(item.dataAgendada)}` : ""}
                    {item.horarioLembrete ? ` às ${item.horarioLembrete}` : ""}
                  </Text>
                  <CardMissao missao={item} onPress={concluirMissao} />
                </View>
              ))
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const criarStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    paddingTop: 56,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
  },
  subtitulo: {
    color: colors.muted,
    marginTop: 4,
    marginBottom: 16,
  },
  status: {
    color: colors.secondary,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "capitalize",
  },
  extraBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
    padding: 16,
    shadowColor: colors.secondary,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  agendaBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
    padding: 16,
    shadowColor: colors.secondary,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  agendaHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  agendaData: {
    color: colors.muted,
    fontWeight: "700",
    marginTop: 2,
  },
  agendaContador: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    color: colors.primary,
    fontWeight: "900",
    minWidth: 34,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 7,
    textAlign: "center",
  },
  agendaItem: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
  },
  agendaHora: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900",
    width: 54,
  },
  agendaConteudo: {
    flex: 1,
  },
  agendaTitulo: {
    color: colors.text,
    fontWeight: "900",
  },
  agendaDescricao: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  listaTitulo: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  listaVazia: {
    color: colors.muted,
    marginBottom: 16,
  },
  concluidasBox: {
    marginTop: 10,
    marginBottom: 28,
  },
  extraTitulo: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  extraTexto: {
    color: colors.muted,
    marginTop: 6,
    marginBottom: 14,
  },
  form: {
    gap: 10,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    padding: 13,
  },
  inputDescricao: {
    minHeight: 74,
    textAlignVertical: "top",
  },
  linhaCampos: {
    flexDirection: "row",
    gap: 10,
  },
  inputMetade: {
    flex: 1,
  },
  dataBotao: {
    justifyContent: "center",
    minHeight: 50,
  },
  dataRotulo: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  dataValor: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },
  calendarioBox: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  calendarioHeader: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  calendarioNav: {
    alignItems: "center",
    backgroundColor: colors.secondarySoft,
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  calendarioNavTexto: {
    color: colors.secondary,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 26,
  },
  calendarioMes: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  calendarioSemanaLinha: {
    flexDirection: "row",
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  calendarioGrade: {
    gap: 5,
  },
  calendarioLinha: {
    flexDirection: "row",
    gap: 4,
  },
  calendarioSemana: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    flex: 1,
    textAlign: "center",
  },
  calendarioCelula: {
    alignItems: "center",
    flex: 1,
  },
  calendarioDia: {
    alignItems: "center",
    borderRadius: 14,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  calendarioDiaVazio: {
    opacity: 0,
  },
  calendarioDiaHoje: {
    borderColor: colors.secondary,
    borderWidth: 1,
  },
  calendarioDiaSelecionado: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  calendarioDiaTexto: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  calendarioDiaTextoHoje: {
    color: colors.secondary,
  },
  calendarioDiaTextoSelecionado: {
    color: "#fff",
  },
  atalhosData: {
    flexDirection: "row",
    gap: 8,
  },
  atalhoData: {
    backgroundColor: colors.secondarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  atalhoDataTexto: {
    color: colors.secondary,
    fontWeight: "800",
  },
  lembreteLinha: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },
  lembreteTitulo: {
    color: colors.text,
    fontWeight: "900",
  },
  lembreteTexto: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  categorias: {
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
  },
  chipTextoAtivo: {
    color: colors.primary,
  },
});
