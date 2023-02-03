function createEmberCLIConfig(forceEnabled = undefined, ownConfig = {}) {
  const isEnabled = forceEnabled ?? !!process.env.ENABLE_BUNDLE_ANALYZER;

  return isEnabled
    ? {
        bundleAnalyzer: {
          enabled: true,
          ...ownConfig,
        },
        fingerprint: {
          enabled: false,
        },
        sourcemaps: { enabled: true },
        autoImport: {
          webpack: createWebpackConfig(isEnabled),
        },
      }
    : {};
}

function createWebpackConfig(forceEnabled) {
  const isEnabled = forceEnabled ?? !!process.env.ENABLE_BUNDLE_ANALYZER;

  return isEnabled
    ? {
        devtool: 'source-map',
        optimization: {
          chunkIds: 'named',
        },
        output: {
          clean: true,
          // Ideally we would tweak the webpack chunk names here like below, to give the user some more understandable names that just random IDs.
          // But the problem is that ember-auto-import and Embroider don't allow for the same config to work for both.
          // filename: 'assets/chunk.[id].js',
          // chunkFilename: 'assets/chunk.[id].js',
        },
      }
    : {};
}

module.exports = {
  createEmberCLIConfig,
  createWebpackConfig,
};
