// Provider de dados — por plataforma (doc seção 8, "Offline primeiro"):
// · nativo (Expo Go): copia o flavos.sqlite embutido (asset) para o app
//   SQLite do aparelho e abre — sem rede em nenhum passo;
// · web de depuração: expo-sqlite (wa-sqlite wasm) busca o .db do web root —
//   apps/mobile/public/flavos.sqlite é servido em /flavos.sqlite (o sync-db
//   copia para os dois lugares).
// Injeta a FonteDados do @flavos/shared: as MESMAS consultas no app e na web.
import { Platform } from "react-native";
import { Asset } from "expo-asset";
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

function fonteDoBanco(banco: SQLite.SQLiteDatabase): FonteDados {
  return {
    async consulta<T>(sql: string, parametros: ReadonlyArray<string | number> = []) {
      return banco.getAllAsync<T>(sql, [...parametros]);
    },
    async unic<T>(sql: string, parametros: ReadonlyArray<string | number> = []) {
      return banco.getFirstAsync<T>(sql, [...parametros]);
    },
  };
}

async function abrirNativo(): Promise<SQLite.SQLiteDatabase> {
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

async function abrirWeb(): Promise<SQLite.SQLiteDatabase> {
  // web: importoteca do asset para o SQLite do navegador (worker wa-sqlite).
  // forceOverwrite: o navegador guarda a cópia antiga em OPFS — na
  // depuração queremos SEMPRE o dado fresco do asset (nativo já faz isso
  // pois recopia o arquivo a cada abertura).
  await SQLite.importDatabaseFromAssetAsync(
    "flavos.sqlite",
    { assetId: require("../../assets/flavos.sqlite"), forceOverwrite: true },
  );
  return SQLite.openDatabaseAsync("flavos.sqlite");
}

async function preparar(): Promise<Estado> {
  try {
    const banco = Platform.OS === "web" ? await abrirWeb() : await abrirNativo();
    const fonte = fonteDoBanco(banco);
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
