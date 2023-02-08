# ember-cli-bundle-analyzer

![CI](https://github.com/simonihmig/ember-cli-bundle-analyzer/workflows/CI/badge.svg)
[![Ember Observer Score](https://emberobserver.com/badges/ember-cli-bundle-analyzer.svg)](https://emberobserver.com/addons/ember-cli-bundle-analyzer)
[![npm version](https://badge.fury.io/js/ember-cli-bundle-analyzer.svg)](https://badge.fury.io/js/ember-cli-bundle-analyzer)

An Ember CLI addon to analyze the size and contents of your app's bundled output, using an interactive zoomable treemap.

View the [interactive Demo](https://raw.githack.com/simonihmig/ember-cli-bundle-analyzer/master/docs/demo.html)

![Screenshot of analyzer output](docs/screen.png)

This helps you to

- analyze which individual modules make it into your final bundle
- find out how big each contained module is
- find modules that got there by mistake
- optimize your bundle size

It uses [source-map-explorer](https://github.com/danvk/source-map-explorer) under the hood,
and wraps it in an Ember CLI addon to make it easy to use.

Given that it works based on source maps, it is agnostic to the actual bundling tool used, be it pure Ember CLI (which is based on `broccoli-concat`), Ember CLI with ember-auto-import (which makes it a mix of `broccoli-concat` and `webpack`) or even Embroider.
The only condition is that _proper_ source maps are generated.

## Compatibility

- Ember CLI v3.28 or above
- Node.js v16 or above
- works with ember-auto-import and Embroider, as long as source maps are properly enabled

## Quick Start

To get you going _quickly_, follow these steps:

1. Install the addon:

   ```
   ember install ember-cli-bundle-analyzer
   ```

2. Setup your `ember-cli-build.js`:

   ```diff
   const EmberApp = require('ember-cli/lib/broccoli/ember-app');
   +const {
   +  createEmberCLIConfig,
   +} = require('ember-cli-bundle-analyzer/create-config');

   module.exports = function (defaults) {
     const app = new EmberApp(defaults, {
       // your other options are here
       // ...
   +    ...createEmberCLIConfig(),
     });

     return app.toTree();
   };
   ```

3. Launch your local server in analyze-mode:

   ```sh
   ENABLE_BUNDLE_ANALYZER=true ember serve --prod
   ```

4. Open [http://localhost:4200/\_analyze](http://localhost:4200/_analyze)

For more detailed instructions, read the following chapters...

## Setup

Two things need to be in place for this addon to work correctly: it needs to have a [config](#Config) that at least enables it, and _proper_ [source maps](#source-maps) need to be enabled for the EmberCLI build pipeline.

While it is possible to provide these settings manually, the addon provides some recommended presets that you can apply using `createEmberCLIConfig`:

```js
// ember-cli-build.js
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const {
  createEmberCLIConfig,
} = require('ember-cli-bundle-analyzer/create-config');

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    // your other options are here
    // ...
    ...createEmberCLIConfig(),
  });

  return app.toTree();
};
```

If you are using Embroider, then this should cover you:

```js
// ember-cli-build.js
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const {
  createEmberCLIConfig,
  createWebpackConfig,
} = require('ember-cli-bundle-analyzer/create-config');

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    // your other options are here
    // ...
    ...createEmberCLIConfig(),
  });

  return require('@embroider/compat').compatBuild(app, Webpack, {
    // your Embroider options...
    packagerOptions: {
      webpackConfig: {
        // any custom webpack options you might have
        ...createWebpackConfig(),
      },
    },
  });
};
```

With this config, when the environment variable `ENABLE_BUNDLE_ANALYZER` is set, it will enable the addon and apply required options to both Ember CLI and ember-auto-import to fully enable source maps with the required fidelity level.

> The reason the addon is not enabled by default is that it would be pointless if not having proper source maps fully enabled as well. And this might not be what you want by default, as generating full source maps comes at a cost of increased build times. On top of that you might also want to analyze the bundles only in production mode.

Note that this might override some of your existing custom settings for source maps or ember-auto-import if you have those. So if that does not work for you, you can either try to deep merge the configs as in the following example, or provide your own explicit configs based of what [`createEmberCLIConfig` provides](./create-config.js).

```js
// ember-cli-build.js
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const {
  createEmberCLIConfig,
} = require('ember-cli-bundle-analyzer/create-config');
const { defaultsDeep } = require('ember-cli-lodash-subset');

module.exports = function (defaults) {
  const app = new EmberApp(
    defaults,
    defaultsDeep(
      {
        // your other options are here
        // ...
      },
      createEmberCLIConfig()
    )
  );

  return app.toTree();
};
```

### Config

You can customize the precessing by setting any of the following configs into the `'bundleAnalyzer'` key of your
`ember-cli-build.js`:

- `enabled` (boolean): set to `true` to enable the addon. `false` by default.

- `ignoreTestFiles` (boolean): by default it will exclude all test files from the output. Set this to `false` to include
  them.

- `ignore` (string | string[]): add files to ignore. Glob patterns are supported, e.g. `*-fastboot.js`.

### Source maps

The bundle size output that you see coming from this addon can only be as good as the underlying source maps are. For [source-map-explorer](https://github.com/danvk/source-map-explorer) to correctly process those, they should have the full source code included inline (which is the `sourcesContent` field in a `.map` file).

For the `broccoli-concat` based part of Ember CLI (processing the app itself as well as all v1 addons), enabling source maps using `sourcemaps: { enabled: true },` in `ember-cli-config.js` will be enough.
For any `webpack` based build (be it ember-auto-import or Embroider), the default settings will _not_ be enough. The only setting that works reliably is enabling high-fidelity source maps using `devtool: 'source-map'`.

Again, for enabling source maps with the recommended options, using the `createEmberCLIConfig()` helper as mentioned above is recommended.

For further information consider these resources:

- [Enabling source maps in Ember CLI](https://cli.emberjs.com/release/advanced-use/asset-compilation/#sourcemaps)
- [Adding custom webpack config to ember-auto-import](https://github.com/ef4/ember-auto-import#customizing-build-behavior)
- [Adding custom webpack config to Embroider](https://github.com/embroider-build/embroider#options)
- [webpack's devtool](https://webpack.js.org/configuration/devtool/)

## Usage

You need to have the addon and source maps enabled as described under [Setup](#setup). When following the recommended approach of using `createEmberCLIConfig` to apply the addon provided presets, then opting into the bundle-analyzer enabled mode is done by enabling the `ENABLE_BUNDLE_ANALYZER` environment flag when starting your local dev server. Most likely you will also want to analyze the production mode build, to exclude any debugging code. So the final invocation would be:

```sh
ENABLE_BUNDLE_ANALYZER=true ember serve --prod
```

After startup this addon adds a custom middleware listening to the `/_analyze` URL path. So just open [http://localhost:4200/\_analyze](http://localhost:4200/_analyze) in your web browser to access the analyzer output.

While it processes the data a loading screen might appear, after which the final output should display.

Live reloading is supported, so whenever you change a project file the output will be re-computed and updated automatically.

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

This project is licensed under the [MIT License](LICENSE.md).
