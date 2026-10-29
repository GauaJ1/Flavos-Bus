// Ícones próprios do Flavos Bus (24px, stroke acompanha o peso do texto).
// Nada de emoji como ícone (âncoras design); SVG nativo, recolorido por
// currentColor equivalente (prop cor).
import Svg, { Circle, G, Line, Path } from "react-native-svg";
import * as React from "react";

export interface IconeProps {
  readonly cor: string;
  readonly tamanho?: number;
}

function base(tamanho: number): { viewBox: string; s: number } {
  return { viewBox: "0 0 24 24", s: tamanho };
}

export function IconeAviso({ cor, tamanho = 20 }: IconeProps) {
  const { viewBox, s } = base(tamanho);
  return (
    <Svg width={s} height={s} viewBox={viewBox} fill="none">
      <G aria-hidden>
        <Path
          d="M12 3.5 21.5 20h-19L12 3.5Z"
          stroke={cor}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <Line x1="12" y1="10" x2="12" y2="14.5" stroke={cor} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx="12" cy="17.2" r="0.9" fill={cor} />
      </G>
    </Svg>
  );
}

export function IconeBusca({ cor, tamanho = 20 }: IconeProps) {
  const { viewBox, s } = base(tamanho);
  return (
    <Svg width={s} height={s} viewBox={viewBox} fill="none" aria-hidden>
      <Circle cx="10.5" cy="10.5" r="6" stroke={cor} strokeWidth={1.8} />
      <Line x1="15.2" y1="15.2" x2="20" y2="20" stroke={cor} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function IconeSeta({ cor, tamanho = 16 }: IconeProps) {
  const { viewBox, s } = base(tamanho);
  return (
    <Svg width={s} height={s} viewBox={viewBox} fill="none" aria-hidden>
      <Path d="M4 12h15M13 6l6 6-6 6" stroke={cor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconeRelogio({ cor, tamanho = 16 }: IconeProps) {
  const { viewBox, s } = base(tamanho);
  return (
    <Svg width={s} height={s} viewBox={viewBox} fill="none" aria-hidden>
      <Circle cx="12" cy="12" r="8" stroke={cor} strokeWidth={1.8} />
      <Path d="M12 7.5V12l3 2" stroke={cor} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
