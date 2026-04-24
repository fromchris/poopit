module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Reanimated 4 moved its babel plugin into react-native-worklets.
    // This plugin must be listed last.
    plugins: ["react-native-worklets/plugin"],
  };
};
