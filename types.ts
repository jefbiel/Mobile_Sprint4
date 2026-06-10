export enum CategoriaMissao {
  Mental = "Mental",
  Fisica = "Fisica",
  Social = "Social",
}

export enum StatusMissao {
  Pendente = "Pendente",
  Concluida = "Concluida",
}

export interface Missao {
  id: string;
  titulo: string;
  descricao: string;
  status: StatusMissao;
  categoria: CategoriaMissao;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  nivel: number;
  xp: number;
  moedas: number;
  streak: number;
  areaDominante: CategoriaMissao;
}