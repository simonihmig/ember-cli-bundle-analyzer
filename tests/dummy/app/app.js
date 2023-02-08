import Application from '@ember/application';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from 'dummy/config/environment';
import { sum } from 'lodash-es';

// just some dummy code to consume lodash imports via ember-auto-import
const operands = [1, 2];
console.log(`the sum of ${operands.join(' and ')} is ${sum(operands)}`);

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}

loadInitializers(App, config.modulePrefix);
