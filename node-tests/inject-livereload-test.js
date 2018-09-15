const { expect } = require('chai');
const injectLivereload = require('../lib/inject-livereload');

const html = '<html><head><title>Test</title></head><body><h1>Test</h1></body></html>';

describe('injectLivereload', function() {

  afterEach(function() {
    delete process.env.EMBER_CLI_INJECT_LIVE_RELOAD_BASEURL;
  });

  it('injects script tag', function() {
    let result = injectLivereload(html);
    let expected = '<html><head><title>Test</title>' +
      '<script src="/ember-cli-live-reload.js" type="text/javascript"></script>' +
      '</head><body><h1>Test</h1></body></html>';
    expect(result).to.equal(expected);
  });

  it('supports environment var from ember-cli-inject-live-reload', function() {
    process.env.EMBER_CLI_INJECT_LIVE_RELOAD_BASEURL = '/custom/';

    let result = injectLivereload(html);
    let expected = '<html><head><title>Test</title>' +
      '<script src="/custom/ember-cli-live-reload.js" type="text/javascript"></script>' +
      '</head><body><h1>Test</h1></body></html>';
    expect(result).to.equal(expected);
  });
});