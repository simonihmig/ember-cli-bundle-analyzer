'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
const {
  createEmberCLIConfig,
  createWebpackConfig,
} = require('./create-config');

module.exports = function (defaults) {
  const app = new EmberAddon(defaults, {
    // Add options here

    // for our dummy app, we always want to enable us
    ...createEmberCLIConfig(true),
  });

  /*
    This build file specifies the options for the dummy test app of this
    addon, located in `/tests/dummy`
    This build file does *not* influence how the addon or the app using it
    behave. You most likely want to be modifying `./index.js` or app's build file
  */

  const { maybeEmbroider } = require('@embroider/test-setup');
  return maybeEmbroider(app, {
    skipBabel: [
      {
        package: 'qunit',
      },
    ],
    packagerOptions: {
      webpackConfig: {
        ...createWebpackConfig(true),
      },
    },
  });
};
