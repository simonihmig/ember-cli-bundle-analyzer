module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2015,
  },
  plugins: [
    'node'
  ],
  extends: [
    'eslint:recommended',
    'plugin:node/recommended'
  ],
  env: {
    node: true
  },
  rules: {
  },
  overrides: [
    // mocha tests
    {
      files: [
        'node-tests/**/*.js'
      ],
      plugins: [
        'chai-expect',
        'mocha',
      ],
      env: {
        mocha: true
      },
    }
  ]
};
