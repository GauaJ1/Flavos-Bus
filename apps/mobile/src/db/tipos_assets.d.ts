// Declarações para assets não tipados pelo Metro (o require do flavos.sqlite
// devolve um número de AssetRegistry no React Native).
declare module "*.sqlite" {
  const asset: number;
  export default asset;
}
