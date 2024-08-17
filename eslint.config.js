const pluginJs = require('@eslint/js');
const pluginReact = require('eslint-plugin-react');
const globals = require('globals');
module.exports = [
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  { files: ['server/**/*.js'], languageOptions: { sourceType: 'commonjs', globals: globals.node } },
  { files: ['*.js'], languageOptions: { sourceType: 'commonjs', globals: globals.node } },
  { files: ['frontend/**/*.{js,mjs,cjs,jsx}'], languageOptions: { sourceType: 'module', globals: globals.browser } }
];
