'use strict'

module.exports = async function * (db) {
  for await (const item of db.createReadStream()) {
    yield item
  }
}
