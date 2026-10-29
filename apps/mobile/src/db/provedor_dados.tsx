// Provider de dados do app: copia o flavos.sqlite embutido (asset) para o
// local de bancos do expo-sqlite e abre 100% offline (doc seção 8,
// "Offline primeiro"). Injeta a FonteDados do @flavos/shared nas telas.
import { Asset } from "expo-asset";
// SDK 58: a API clássica (documentDirectory/copyAsync) vive em /legacy
import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { FonteDados, InfoFeed } from "@flavos/shared";
import { contarLinhas, infoDoFeed } from "@flavos/shared";

type Estado =
  | { fase: "carregando" }
  | { fase: "pronto"; fonte: FonteDados; feed: InfoFeed; linhas: number }
  | { fase: "erro"; mensagem: string };

const Contexto = createContext<Estado>({ fase: "carregando" });

async function abrirBancoLocal(): Promise<SQLite.SQLiteDatabase> {
  const [asset] = await Asset.loadAsync(require("../../assets/flavos.sqlite"));
  if (!asset?.localUri && !asset?.uri) {
    throw new Error("asset flavos.sqlite não encontrado no bundle");
  }
  const pastaSQLite = `${FileSystem.documentDirectory ?? ""}SQLite`;
  await FileSystem.makeDirectoryAsync(pastaSQLite, { intermediates: true }).catch(() => undefined);
  const destino = `${pastaSQLite}/flavos.sqlite`;
  await FileSystem.copyAsync({ from: asset.localUri ?? asset.uri, to: destino });
  return SQLite.openDatabaseAsync("flavos.sqlite");
}

async function preparar(): Promise<Estado> {
  try {
    const banco = await abrirBancoLocal();
    const fonte: FonteDados = {
      async consulta<T>(sql: string, parametros: ReadonlyArray<string | number> = []) {
        return banco.getAllAsync<T>(sql, [...parametros]);
      },
      async unic<T>(sql: string, parametros: ReadonlyArray<string | number> = []) {
        return banco.getFirstAsync<T>(sql, [...parametros]);
      },
    };
    const linhas = await contarLinhas(fonte);
    const feed = await infoDoFeed(fonte);
    return { fase: "pronto", fonte, feed, linhas };
  } catch (erro) {
    return {
      fase: "erro",
      mensagem: erro instanceof Error ? erro.message : String(erro),
    };
  }
}

export function ProvedorDeDados({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ fase: "carregando" });
  useEffect(() => {
    void preparar().then(setEstado);
  }, []);
  return <Contexto.Provider value={estado}>{children}</Contexto.Provider>;
}

export function useDados(): Estado {
  return useContext(Contexto);
}
