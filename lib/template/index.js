'use strict'
const { readProject } = require('../db')

module.exports = async function (config, db) {
  const { projects, indicies, template } = config
  const accumulator = {}

  // Run through the projects, and for each
  // item run each index builder
  await Promise.all(projects.map(async (project) => {
    for await (let { value } of readProject(db, project)) {
      await Promise.all(Object.keys(indicies).map(async (index) => {
        accumulator[index] = await indicies[index](accumulator[index], config, value)
      }))
    }
  }))

  await template(config, accumulator)
}
