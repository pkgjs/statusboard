'use strict'
const { loadEnvFile } = require('node:process')

module.exports = function loadEnv (file = '.env') {
  try {
    loadEnvFile(file)
  } catch (error) {
    // An env file is optional when variables are supplied by the environment.
    if (error.code !== 'ENOENT') throw error
  }
}
