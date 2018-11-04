const chai = require('chai');
const chaiHttp = require('chai-http');
const { App } = require('ember-cli-addon-tests');
const tmp = require('tmp');

const { expect } = chai;
const port = 4444;
const baseUrl = `http://localhost:${port}`;

chai.use(chaiHttp);

describe('acceptance', function() {
  let app;

  this.timeout(120000);

  before(function() {
    app = new App(process.cwd());
    return app.startServer({
      port: port
    });
  });

  after(function() {
    return app.stopServer();
  });

  it('_analyze shows loading page', function() {
    return chai.request(baseUrl)
      .get('/_analyze')
      .then((res) => {
        expect(res).to.have.status(200)
          .and.be.html;
        expect(res.text).to.include('Analyzing your bundles');
      });
  });

  it('_analyze/compute redirects to computed stats', function() {
    return chai.request(baseUrl)
      .get('/_analyze/compute')
      .then((res) => {
        expect(res).to.redirectTo(`${baseUrl}/_analyze`);
      })
      .then(() => {
        return chai.request(baseUrl)
          .get('/_analyze')
          .then((res) => {
            expect(res).to.have.status(200)
              .and.be.html;

            expect(res.text)
              .to.include('<script>var SUMMARY = {')
              .and.to.include('"label": "assets/dummy.js');
          });
      });
  });

  it('_analyze/compute shows error page', function() {
    let origPath = process.env.CONCAT_STATS_PATH;
    // setting a different stats path will cause a rejected promise during computation
    process.env.CONCAT_STATS_PATH = tmp.dirSync().name;
    return chai.request(baseUrl)
      .get('/_analyze/compute')
      .then((res) => {
        expect(res).to.have.status(200)
          .and.be.html;
        expect(res.text).to.include('Dang! Looks like no stats are available.');
      })
      .then(
        () => process.env.CONCAT_STATS_PATH = origPath,
        () => process.env.CONCAT_STATS_PATH = origPath
      );
  });

});
