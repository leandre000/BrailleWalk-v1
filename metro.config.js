const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push(
  'db',
  'mp3',
  'ttf',
  'obj',
  'png',
  'jpg'
);

// Configure platform extensions for web
config.resolver.platforms = ['web', 'ios', 'android'];

// Add source extensions
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json', 'cjs', 'mjs');

module.exports = config;

