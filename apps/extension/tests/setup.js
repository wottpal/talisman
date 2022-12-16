/* eslint-env es2021 */
const chrome = require("sinon-chrome")
const { Crypto } = require("@peculiar/webcrypto")
const { TextEncoder, TextDecoder } = require("util")

global.crypto = new Crypto()
// This is required because the main library we've used to mock webextension-polyfill (jest-webextension-mock) does not provide a mock for the windows property
// so we use sinon-chrome for that instead. In order to be compatible with webextension-polyfill, we wrap the create method in a promise. It may be necessary
// to do this for other methods if they are used in tests.

global.chrome.windows = {
  ...chrome.windows,
  create: (...args) => new Promise((resolve) => resolve(chrome.windows.create(...args))),
}
global.browser.windows = global.chrome.windows

process.env.VERSION = process.env.npm_package_version

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
