'use strict'
const path = require('path')
const level = require('level')
const fs = require('fs-extra')
const buildIndex = require('./build-index')
const readProject = require('./read-project')

let _db
module.exports = connect
async function connect (dbPath) {
  if (_db && _db.isClosed()) {
    _db = null
  }

  const dbp = dbPath || 'data.db'
  await fs.ensureDir(path.dirname(dbp))
  _db = _db || level(dbp, {
    valueEncoding: 'json'
  })
  return _db
}

module.exports.buildIndex = buildIndex
module.exports.readProject = readProject
