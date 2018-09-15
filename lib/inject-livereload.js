const { Document, Node } = require('node-html-light');

module.exports = function injectLivereload(html) {
  let baseUrl = process.env.EMBER_CLI_INJECT_LIVE_RELOAD_BASEURL || '/';
  let url = `${baseUrl}ember-cli-live-reload.js`;
  let tag = `<script src="${url}" type="text/javascript"></script>`;

  const document = Document.fromString(html);
  document.head().appendChild(Node.fromString(tag));

  return document.toHtml();
};
