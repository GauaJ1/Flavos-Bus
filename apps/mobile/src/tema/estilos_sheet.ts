// ESTILOS do BottomSheet M3 (docked/standard) — função PURA compartilhada.
// A : container surfaceContainerLow, cantos topo 28 (extra-large.top),
// alça 32×4 onSurfaceVariant, elevação level1 (única sombra real do app).
// Faixa da alça 48dp = decisão do projeto aprovada no Portão A.
import type { PaletaM3 } from "./tokens.ts";
import { estadoM3, forma, m3_medidas } from "./tokens.ts";

export function estiloBottomSheet(papeis: PaletaM3, sombra: { shadowColor: string; shadowOpacity: number; shadowRadius: number; shadowOffset: { width: number; height: number } }) {
  return {
    painel: {
      backgroundColor: papeis.surfaceContainerLow,
      borderTopLeftRadius: m3_medidas.bottomSheet.cantosSuperiores,
      borderTopRightRadius: m3_medidas.bottomSheet.cantosSuperiores,
      borderWidth: 0,
      // elevação level1: a ÚNICA sombra do app
      ...sombra,
      elevation: m3_medidas.bottomSheet.elevacao,
    },
    alcaArea: {
      minHeight: m3_medidas.bottomSheet.alcaFaixa,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    alca: {
      width: m3_medidas.bottomSheet.alcaLargura,
      height: m3_medidas.bottomSheet.alcaAltura,
      borderRadius: forma.full,
      backgroundColor: papeis.onSurfaceVariant,
    },
    dica: {
      color: papeis.onSurfaceVariant,
      fontSize: 11,
      marginTop: 2,
    },
    conteudo: {
      flex: 1,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    arrastando: { opacity: 1 - estadoM3.arrastado },
  };
}
