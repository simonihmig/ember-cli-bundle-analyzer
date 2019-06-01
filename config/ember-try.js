'use strict';

const getChannelURL = require('ember-source-channel-url');

module.exports = function() {
  return Promise.all([
    getChannelURL('release'),
    getChannelURL('beta'),
    getChannelURL('canary')
  ]).then((urls) => {
    return {
      command: 'yarn test',
      useYarn: true,
      scenarios: [
        {
          name: 'ember-2.13',
          env: {
            EMBER_OPTIONAL_FEATURES: JSON.stringify({ 'jquery-integration': true })
          },
          npm: {
            devDependencies: {
              '@ember/jquery': '^0.6.0',
              'ember-cli': '~2.13.0',
              'ember-source': '~2.13.0',
            }
          }
        },
        {
          name: 'ember-lts-2.18',
          env: {
            EMBER_OPTIONAL_FEATURES: JSON.stringify({ 'jquery-integration': true })
          },
          npm: {
            devDependencies: {
              '@ember/jquery': '^0.6.0',
              'ember-cli': '~2.18.0',
              'ember-source': '~2.18.0',
            }
          }
        },
        {
          name: 'ember-lts-3.4',
          npm: {
            devDependencies: {
              'ember-cli': '~3.4.0',
              'ember-source': '~3.4.0'
            }
          }
        },
        {
          name: 'ember-lts-3.8',
          npm: {
            devDependencies: {
              'ember-cli': '~3.8.0',
              'ember-source': '~3.8.0'
            }
          }
        },
        {
          name: 'ember-release',
          npm: {
            devDependencies: {
              'ember-cli': 'ember-cli/ember-cli#latest',
              'ember-source': urls[0]
            }
          }
        },
        {
          name: 'ember-beta',
          npm: {
            devDependencies: {
              'ember-cli': 'ember-cli/ember-cli#beta',
              'ember-source': urls[1]
            }
          }
        },
        {
          name: 'ember-canary',
          npm: {
            devDependencies: {
              'ember-cli': 'ember-cli/ember-cli#master',
              'ember-source': urls[2]
            }
          }
        },
        // The default `.travis.yml` runs this scenario via `npm test`,
        // not via `ember try`. It's still included here so that running
        // `ember try:each` manually or from a customized CI config will run it
        // along with all the other scenarios.
        {
          name: 'ember-default',
          npm: {
            devDependencies: {}
          }
        }
      ]
    };
  });
};
