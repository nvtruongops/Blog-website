module.exports = {
  testEnvironment: 'node',
  transformIgnorePatterns: [
    '/node_modules/(?!(@exodus|html-encoding-sniffer)/)'
  ],
  testTimeout: 30000,
  transform: {}
};
