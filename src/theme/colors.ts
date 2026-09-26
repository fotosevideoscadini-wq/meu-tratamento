/**
 * Paleta de cores do "Meu Tratamento".
 * Estes são os TOKENS DE DESIGN — todas as telas devem consumir
 * cores a partir daqui (via useTheme()), nunca com valores fixos
 * espalhados pelo código. Isso permite trocar a identidade visual
 * inteira alterando apenas este arquivo.
 */

export const palette = {
  // Azuis (marca / textos principais)
  blueDark: "#16324F",
  blueDark2: "#1E3A5F",
  blue: "#2E6BB4",
  blueLight: "#D6E8FB",

  // Turquesa/verde (ações positivas — "Tomei")
  teal: "#1FA98D",
  tealLight: "#D6F5EE",

  // Amarelo/laranja ("Adiar")
  amber: "#F5A524",
  amberLight: "#FDEBD0",

  // Vermelho/coral ("Pular")
  coral: "#E15554",
  coralLight: "#FBDCDB",

  // Roxo (IA)
  purple: "#7C5CBF",
  purpleLight: "#E9E1F7",

  // Neutros
  white: "#FFFFFF",
  gray50: "#F7F8FA",
  gray100: "#EEF1F4",
  gray200: "#E2E6EB",
  gray300: "#C7CDD6",
  gray500: "#8A93A1",
  gray700: "#4B5563",
  gray900: "#1F2430",
  black: "#0B0D12",
};

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  ai: string;
  aiLight: string;
  disabled: string;
};

export const lightColors: ThemeColors = {
  background: palette.gray50,
  surface: palette.white,
  surfaceAlt: palette.gray100,
  textPrimary: palette.blueDark,
  textSecondary: palette.gray700,
  border: palette.gray200,
  primary: palette.blue,
  primaryLight: palette.blueLight,
  success: palette.teal,
  successLight: palette.tealLight,
  warning: palette.amber,
  warningLight: palette.amberLight,
  danger: palette.coral,
  dangerLight: palette.coralLight,
  ai: palette.purple,
  aiLight: palette.purpleLight,
  disabled: palette.gray300,
};

export const darkColors: ThemeColors = {
  background: "#0F1420",
  surface: "#161C2B",
  surfaceAlt: "#1E2536",
  textPrimary: "#F2F5F9",
  textSecondary: "#B8C0CC",
  border: "#2B3348",
  primary: "#5B9BE0",
  primaryLight: "#233A55",
  success: "#3FCBA9",
  successLight: "#123A32",
  warning: "#F5B043",
  warningLight: "#3D2E10",
  danger: "#EB7674",
  dangerLight: "#3B1C1C",
  ai: "#A78BE0",
  aiLight: "#2E2545",
  disabled: "#3A4256",
};
