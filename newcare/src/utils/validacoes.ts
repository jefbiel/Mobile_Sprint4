export const LIMITE_NOME = 50;
export const LIMITE_EMAIL = 50;
export const LIMITE_SENHA = 16;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizarEmail(email: string) {
  return email.trim().toLowerCase();
}

export function emailValido(email: string) {
  const emailNormalizado = normalizarEmail(email);

  return emailNormalizado.length <= LIMITE_EMAIL && EMAIL_REGEX.test(emailNormalizado);
}
