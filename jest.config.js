module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['tests'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!chalk|js-yaml)', // Transform chalk and js-yaml
  ],
  moduleNameMapper: {
    '#ansi-styles': 'node_modules/chalk/source/vendor/ansi-styles/index.js', // Map chalk's internal import
  },
};