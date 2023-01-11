function createEmberCLIConfig(enabled) {
  const isEnabled = enabled ?? !!process.env.ENABLE_BUNDLE_ANALYZER;

  return isEnabled
    ? {
        'bundleAnalyzer': {
          enabled: true,
        },
        sourcemaps: { enabled: true },
        autoImport: {
          webpack: createWebpackConfig(isEnabled),
        },
      }
    : {};
}

function createWebpackConfig(enabled) {
  const isEnabled = enabled ?? !!process.env.ENABLE_BUNDLE_ANALYZER;

  return isEnabled
    ? {
        devtool: 'source-map',
      }
    : {};
}

module.exports = {
  createEmberCLIConfig,
  createWebpackConfig,
};