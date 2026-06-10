import { CategoriaMissao, Missao, StatusMissao, TipoMissao } from "../types";

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

export function gerarMissoesPersonalizadas(foco: CategoriaMissao, tempoDiario: number) {
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
