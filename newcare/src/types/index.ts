import { PaletaAcessibilidadeId } from "../../constants/theme";

export enum StatusMissao {
  Pendente = "pendente",
  Concluida = "concluida",
}

export enum CategoriaMissao {
  Mental = "mental",
  Fisica = "fisica",
  Lazer = "lazer",
  Sono = "sono",
}

export enum TipoMissao {
  Simples = "simples",
  Progressiva = "progressiva",
  Reativa = "reativa",
}

export interface OnboardingPerfil {
  foco: CategoriaMissao;
  tempoDiario: number;
  nivelAtual: "iniciante" | "intermediario" | "avancado";
}

export interface PreferenciasUsuario {
  notificacoes: boolean;
  lembreteHorario: string;
  metaDiaria: number;
  paletaAcessibilidade: PaletaAcessibilidadeId;
}

export interface AtualizarPerfilDados {
  nome: string;
  areaDominante: CategoriaMissao;
  preferencias: PreferenciasUsuario;
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
  onboardingCompleto: boolean;
  perfil?: OnboardingPerfil;
  preferencias: PreferenciasUsuario;
  conquistas: string[];
  diasPerfeitos: number;
}

export interface HidratacaoDiaria {
  data: string;
  medidaPadraoMl: number;
  consumidoMl: number;
  metaBatida: boolean;
}

export interface Missao {
  id: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaMissao;
  tipo: TipoMissao;
  recompensaXp: number;
  recompensaMoedas: number;
  duracaoMinutos: number;
  dataAgendada?: string;
  horarioLembrete?: string;
  lembreteAtivo?: boolean;
  status: StatusMissao;
  progressoAtual: number;
  objetivo: number;
}

export type NovaMissaoDados = Omit<
  Missao,
  "id" | "status" | "progressoAtual" | "objetivo"
>;

export interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  desbloqueada: boolean;
}
