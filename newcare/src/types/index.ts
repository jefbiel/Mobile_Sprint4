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
  atividadesSelecionadas?: string[];
}

export interface CadastroDados {
  nome: string;
  email: string;
  senha: string;
  paletaAcessibilidade: PaletaAcessibilidadeId;
  foco: CategoriaMissao;
  tempoDiario: number;
  atividadesSelecionadas: string[];
  avatarId?: string;
  missoesPersonalizadas?: Missao[];
}

export interface PreferenciasUsuario {
  notificacoes: boolean;
  lembreteHorario: string;
  metaDiaria: number;
  paletaAcessibilidade: PaletaAcessibilidadeId;
}

export interface AtualizarPerfilDados {
  nome: string;
  email?: string;
  areaDominante: CategoriaMissao;
  tempoDiario?: number;
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
  habitosConfirmados?: boolean;
  avatarId?: string;
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
  metaMl?: number;
  dadosSaude?: DadosSaudeHidratacao;
  calculadoEm?: number;
}

export interface DadosSaudeHidratacao {
  pesoKg: number;
  alturaCm: number;
  idade: number;
  nivelAtividade: "baixo" | "moderado" | "alto";
  temperaturaC: number;
  umidadePercentual: number;
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
