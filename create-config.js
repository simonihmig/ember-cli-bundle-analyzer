function createEmberCLIConfig(forceEnabled = undefined, ownConfig = {}) {
  const isEnabled = forceEnabled ?? !!process.env.ENABLE_BUNDLE_ANALYZER;

  return isEnabled
    ? {
        bundleAnalyzer: {
          enabled: true,
          ...ownConfig,
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
        },
      }
    : {};
}

module.exports = {
  createEmberCLIConfig,
  createWebpackConfig,
};
