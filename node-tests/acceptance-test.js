const chai = require('chai');
const chaiHttp = require('chai-http');
const { App } = require('ember-cli-addon-tests');
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
              .to.include('var treeDataMap = {')
              .and.to.include('assets/vendor.js')
              .and.to.include('assets/dummy.js');
          });
      });
  });

});
