'use strict'

const { Config, defaults } = require('./models/config')

module.exports = function (opts) {
  return new Config(opts)
}

module.exports.Config = Config
module.exports.defaults = defaults
