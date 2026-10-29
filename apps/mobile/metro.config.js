// Metro configurado para monorepo pnpm com node-linker=hoisted (receita
// oficial do Expo) e com .sqlite como asset: o flavos.sqlite viaja no bundle
// e o app abre 100% offline (doc seção 5, "Offline primeiro").
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// .sqlite: o banco embutido (o app é offline). .wasm: expo-sqlite na web de
// depuração carrega wa-sqlite.wasm (doc expo-sqlite, suporte web).
config.resolver.assetExts.push("sqlite", "wasm");

module.exports = config;
