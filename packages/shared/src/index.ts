// Pacote compartilhado do Flavos Bus (doc seção 4): tipos e consultas sobre
// o flavos.sqlite, sem dependência de plataforma. O app injeta expo-sqlite;
// a web de depuração injeta sql.js — mesma lógica SQL nas duas pontas.
export * from "./tipos";
export * from "./consultas";
