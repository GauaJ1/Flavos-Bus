// TemaProvider (fatia 3, B4): carrega o modo (sistema/claro/escuro) do
// flavos_usuario.db, expõe { modo, aoEscolherModo } e persiste na troca.
// useTema() (theme.ts) lê este contexto — ÚNICO caminho de cor dos
// componentes; nenhum componente novo chama useColorScheme direto (grep).
// Enquanto o banco abre, o modo é "sistema" (sem piscar inventado: é o
// mesmo default do resolverEscuro).
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SQLiteDatabase } from "expo-sqlite";
import { abrirBancoUsuario, gravarPreferencia, lerPreferencia } from "@/db/usuario";
import { CHAVE_MODO_TEMA, validarModo, type ModoTema } from "@/tema/modo";

interface EstadoTema {
  /** modo escolhido pelo usuário (default: sistema até o banco responder). */
  readonly modo: ModoTema;
  readonly aoEscolherModo: (modo: ModoTema) => void;
  /** false enquanto o banco não respondeu (para o Sobre avisar honesto). */
  readonly pronto: boolean;
}

const Contexto = createContext<EstadoTema>({ modo: "sistema", aoEscolherModo: () => undefined, pronto: false });

export function TemaProvider({ children }: { children: ReactNode }) {
  const [banco, setBanco] = useState<SQLiteDatabase | null>(null);
  const [modo, setModo] = useState<ModoTema>("sistema");
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      try {
        const b = await abrirBancoUsuario();
        const salvo = validarModo(await lerPreferencia(b, CHAVE_MODO_TEMA));
        if (!vivo) return;
        setBanco(b);
        setModo(salvo);
        setPronto(true);
      } catch {
        if (vivo) setPronto(true); // sem banco: segue com "sistema", avisável
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const valor = useMemo<EstadoTema>(
    () => ({
      modo,
      pronto,
      aoEscolherModo: (novo) => {
        setModo(novo); // muda NA HORA (prova Playwright: clicar Escuro e ler fundo)
        const b = banco;
        if (b) void gravarPreferencia(b, CHAVE_MODO_TEMA, novo);
      },
    }),
    [modo, pronto, banco],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useModoTema(): EstadoTema {
  return useContext(Contexto);
}
