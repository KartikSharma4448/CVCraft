// Polyfill TextEncoder/TextDecoder for jsdom (needed by react-router v7)
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Enable React act() environment globally
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
