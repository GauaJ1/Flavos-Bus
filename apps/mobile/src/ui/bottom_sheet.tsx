// BottomSheet — FACHADA de plataforma (o Metro escolhe bottom_sheet.native.tsx
// no celular e bottom_sheet.web.tsx na web; o sufixo de plataforma vence este
// base na resolução — por isso as CONSTANTES e PROPS vivem em
// bottom_sheet_tipos.ts: se este base as exportasse, o import circular
// "./bottom_sheet" dentro dos sufixados se resolveria PARA ELES MESMOS).
import type { PropsBottomSheet } from "./bottom_sheet_tipos";

export type { PropsBottomSheet } from "./bottom_sheet_tipos";

// default presente apenas para o TypeScript resolver `import BottomSheet
// from "@/ui/bottom_sheet"` com o tipo correto; nunca roda (a plataforma
// sempre escolhe um sufixado antes de chegar aqui).
export default function BottomSheet(_props: PropsBottomSheet): null {
  throw new Error("importar a implementação da plataforma (.web/.native)");
}
