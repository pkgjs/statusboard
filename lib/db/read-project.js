'use strict'

module.exports = async function * (db, project, type) {
  let key = `${project.repoOwner}:${project.repoName}:`
  if (type) {
    key += `${type}:`
  }

  const stream = db.createReadStream({
    gte: `${key}`,
    lte: `${key}~`
  })

  for await (const item of stream) {
    yield item
  }
}
