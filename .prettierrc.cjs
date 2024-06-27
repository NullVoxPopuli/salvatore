'use strict';

module.exports = {
  overrides: [
    {
      // Lol, JavaScript
      files: [
        '*.js',
        '*.ts',
        '*.cjs',
        '.mjs',
        '.cts',
        '.mts',
        '.cts',
        '.gjs',
        '.gts',
      ],
      options: {
        singleQuote: true,
        trailingComma: 'es5',
      },
    },
  ],
};
