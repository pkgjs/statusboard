'use strict'
const { readFullIndex } = require('../db')

module.exports = async function (config, db) {
  const { indicies, template } = config
  const accumulator = {}

  // Read full index
  for await (let { key, value } of readFullIndex(db)) {
    await Promise.all(Object.keys(indicies).map(async (index) => {
      accumulator[index] = await indicies[index](accumulator[index], config, key, value)
    }))
  }

  await template(config, accumulator)
}
