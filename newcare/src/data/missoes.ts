import { CategoriaMissao, Missao, StatusMissao, TipoMissao } from "../types";

export const ATIVIDADES_ONBOARDING: Record<
  CategoriaMissao,
  {
    id: string;
    titulo: string;
    descricao: string;
    tipo: TipoMissao;
  }[]
> = {
  [CategoriaMissao.Mental]: [
    { id: "mental-respiracao", titulo: "Respiração consciente", descricao: "Faça uma pausa curta para respirar com atenção.", tipo: TipoMissao.Simples },
    { id: "mental-diario", titulo: "Diário de humor", descricao: "Registre como você está se sentindo hoje.", tipo: TipoMissao.Reativa },
    { id: "mental-foco", titulo: "Bloco de foco", descricao: "Faça uma tarefa sem distrações por alguns minutos.", tipo: TipoMissao.Progressiva },
    { id: "mental-pausa", titulo: "Pausa mental", descricao: "Afaste-se das telas e observe o ambiente.", tipo: TipoMissao.Simples },
  ],
  [CategoriaMissao.Fisica]: [
    { id: "fisica-alongamento", titulo: "Alongamento ativo", descricao: "Alongue ombros, pernas e costas.", tipo: TipoMissao.Progressiva },
    { id: "fisica-caminhada", titulo: "Caminhada leve", descricao: "Caminhe em ritmo confortável.", tipo: TipoMissao.Simples },
    { id: "fisica-mobilidade", titulo: "Mobilidade articular", descricao: "Movimente pescoço, ombros, quadril e tornozelos.", tipo: TipoMissao.Progressiva },
    { id: "fisica-postura", titulo: "Ajuste de postura", descricao: "Revise sua postura e faça uma pausa ativa.", tipo: TipoMissao.Reativa },
  ],
  [CategoriaMissao.Lazer]: [
    { id: "lazer-musica", titulo: "Ouvir música", descricao: "Escolha uma música para relaxar de verdade.", tipo: TipoMissao.Simples },
    { id: "lazer-criativo", titulo: "Momento criativo", descricao: "Desenhe, escreva ou crie algo simples.", tipo: TipoMissao.Progressiva },
    { id: "lazer-pausa", titulo: "Pausa de lazer", descricao: "Separe um momento curto para algo prazeroso.", tipo: TipoMissao.Simples },
    { id: "lazer-social", titulo: "Conexão social", descricao: "Envie uma mensagem positiva para alguém.", tipo: TipoMissao.Reativa },
  ],
  [CategoriaMissao.Sono]: [
    { id: "sono-telas", titulo: "Reduzir telas", descricao: "Diminua o uso de telas antes de dormir.", tipo: TipoMissao.Reativa },
    { id: "sono-ambiente", titulo: "Preparar ambiente", descricao: "Organize luz, temperatura e conforto do quarto.", tipo: TipoMissao.Simples },
    { id: "sono-rotina", titulo: "Rotina de desaceleração", descricao: "Faça uma sequência calma antes de deitar.", tipo: TipoMissao.Progressiva },
    { id: "sono-reflexao", titulo: "Fechamento do dia", descricao: "Anote uma coisa boa e uma pendência para amanhã.", tipo: TipoMissao.Simples },
  ],
};

export const MISSOES: Missao[] = [
  {
    id: "1",
    titulo: "Respiração consciente",
    descricao: "Faça 3 minutos de respiração guiada.",
    categoria: CategoriaMissao.Mental,
    tipo: TipoMissao.Simples,
    recompensaXp: 20,
    recompensaMoedas: 5,
    duracaoMinutos: 3,
    status: StatusMissao.Pendente,
    progressoAtual: 0,
    objetivo: 1,
  },
  {
    id: "2",
    titulo: "Alongamento ativo",
    descricao: "Alongue ombros, pernas e costas.",
    categoria: CategoriaMissao.Fisica,
    tipo: TipoMissao.Progressiva,
    recompensaXp: 30,
    recompensaMoedas: 10,
    duracaoMinutos: 5,
    status: StatusMissao.Pendente,
    progressoAtual: 0,
    objetivo: 1,
  },
  {
    id: "3",
    titulo: "Pausa de lazer",
    descricao: "Separe um momento curto para algo prazeroso.",
    categoria: CategoriaMissao.Lazer,
    tipo: TipoMissao.Simples,
    recompensaXp: 15,
    recompensaMoedas: 4,
    duracaoMinutos: 10,
    status: StatusMissao.Pendente,
    progressoAtual: 0,
    objetivo: 1,
  },
  {
    id: "4",
    titulo: "Preparar sono",
    descricao: "Desconecte das telas antes de dormir.",
    categoria: CategoriaMissao.Sono,
    tipo: TipoMissao.Reativa,
    recompensaXp: 25,
    recompensaMoedas: 8,
    duracaoMinutos: 15,
    status: StatusMissao.Pendente,
    progressoAtual: 0,
    objetivo: 1,
  },
];

const RECOMPENSAS_POR_DURACAO: Record<number, { recompensaXp: number; recompensaMoedas: number }> = {
  5: { recompensaXp: 20, recompensaMoedas: 4 },
  10: { recompensaXp: 40, recompensaMoedas: 5 },
  15: { recompensaXp: 60, recompensaMoedas: 8 },
  20: { recompensaXp: 80, recompensaMoedas: 10 },
  25: { recompensaXp: 80, recompensaMoedas: 13 },
  30: { recompensaXp: 80, recompensaMoedas: 15 },
  35: { recompensaXp: 80, recompensaMoedas: 18 },
  40: { recompensaXp: 80, recompensaMoedas: 20 },
  45: { recompensaXp: 80, recompensaMoedas: 23 },
};

export function calcularRecompensasPorDuracao(duracaoMinutos: number) {
  const duracaoSegura = Math.min(45, Math.max(5, Math.round(duracaoMinutos / 5) * 5));

  return RECOMPENSAS_POR_DURACAO[duracaoSegura];
}

export function gerarMissoesPersonalizadas(foco: CategoriaMissao, tempoDiario: number, atividadesSelecionadas: string[] = []) {
  if (atividadesSelecionadas.length > 0) {
    const atividades = Object.entries(ATIVIDADES_ONBOARDING)
      .flatMap(([categoria, atividadesDaCategoria]) =>
        atividadesDaCategoria.map((atividade) => ({
          ...atividade,
          categoria: categoria as CategoriaMissao,
        }))
      )
      .filter((atividade) => atividadesSelecionadas.includes(atividade.id));
    const duracaoBase = Math.max(5, Math.floor(tempoDiario / Math.max(1, atividades.length)));

    return atividades.map((atividade, index) => {
      const duracaoMinutos = duracaoBase + index * 5 <= 45 ? duracaoBase + index * 5 : 45;
      const recompensas = calcularRecompensasPorDuracao(duracaoMinutos);

      return {
        id: `onboarding-${atividade.id}`,
        titulo: atividade.titulo,
        descricao: atividade.descricao,
        categoria: atividade.categoria,
        tipo: atividade.tipo,
        ...recompensas,
        duracaoMinutos,
        status: StatusMissao.Pendente,
        progressoAtual: 0,
        objetivo: 1,
      };
    });
  }

  const limite = tempoDiario <= 10 ? 2 : tempoDiario <= 20 ? 3 : 4;
  const focoPrimeiro = [...MISSOES].sort((a, b) => {
    if (a.categoria === foco && b.categoria !== foco) return -1;
    if (a.categoria !== foco && b.categoria === foco) return 1;
    return a.duracaoMinutos - b.duracaoMinutos;
  });

  return focoPrimeiro.slice(0, limite).map((missao) => ({
    ...missao,
    status: StatusMissao.Pendente,
    progressoAtual: 0,
  }));
}
