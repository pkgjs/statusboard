'use strict'
const express = require('express')
const path = require('path')
const buildSite = require('./lib/template')
const cli = require('./lib/cli')
const Config = require('./lib/config')
const db = require('./lib/db')

module.exports = async (_conf) => {
  const config = new Config(_conf)
  const _db = await db(config.db)

  return {
    config,
    buildIndex: () => {
      return db.buildIndex(config, _db)
    },
    buildSite: () => {
      return buildSite(config, _db)
    },
    serve: () => {
      return express()
        .use(config.baseUrl, express.static(config.outputDirectory))
        .use((req, res) => res.sendFile(path.join(config.outputDirectory, '404.html')))
        .listen(config.port, () => console.log(`Server listening on http://localhost:${config.port}`))
    },
    close: () => _db.close()
  }
}

module.exports.db = db
module.exports.template = buildSite
module.exports.cli = cli
module.exports.Config = Config
