module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // SDK 58: expo-router não exporta mais "./babel" — o preset expo aplica
    // o router automaticamente (app.json → plugins: ["expo-router"]).
  };
};
