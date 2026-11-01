// FONTES — pilha por plataforma (A1 do dono). ARQUIVO SEPARADO de tokens.ts
// para que os testes node:test possam importar tokens.ts (cores/escala)
// SEM carregar react-native (fora do Metro o package tem syntax de Flow).
// NENHUM componente define fontFamily literal — fonteNumeros vem daqui
// (reexportado por theme.ts).
import { Platform, type TextStyle } from "react-native";

const pilhaFontes = Platform.select({
  web: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  // Android/iOS: sem fontFamily nomeado — usa a fonte do sistema
  default: undefined,
}) as string | undefined;

export const fonteNumeros: TextStyle = {
  fontFamily: pilhaFontes,
  fontVariant: ["tabular-nums"],
  fontWeight: "700",
};
