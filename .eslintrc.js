module.exports = {
    extends: 'airbnb-base',
    env: { node: true },
    rules: {
      'no-console': 'off',
      'arrow-parens': 'off',
      'implicit-arrow-linebreak': 'off',
      'import/prefer-default-export': 'off',
      'function-paren-newline': 'off',
      'max-len': ['error', { code: 120 }],
    },
  };
  