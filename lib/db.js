'use strict'
const level = require('level')
const loadProject = require('./project')
const { Project } = loadProject

module.exports.buildIndex = async function (config) {
  const db = connect(config.db)
  await buildIndex(config, db)
  await db.close()
}

module.exports.readIndex = async function * (config, type) {
  const db = connect(config.db)
  for await (let item of readIndex(config, db, type)) {
    yield item
  }
  await db.close()
}

module.exports.readProject = async function * (config, proj, type) {
  const db = connect(config.db)
  const project = new Project(proj)
  for await (let item of readProject(db, project, type)) {
    yield item
  }
}

let _db
function connect (db) {
  if (_db && _db.isClosed()) {
    _db = null
  }

  _db = _db || level(db || 'projects.db', {
    valueEncoding: 'json'
  })
  return _db
}

async function * readIndex (config, db, type) {
  for (let proj of config.projects) {
    const project = new Project(proj)
    for await (let item of readProject(db, project, type)) {
      yield item
    }
  }
}

async function * readProject (db, project, type) {
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

async function buildIndex (config, db) {
  for await (let evt of iterateProjects(config.projects, config)) {
    let { type, project, detail } = evt
    let key = `${project.repoOwner}:${project.repoName}:${type}`
    switch (type) {
      case 'ISSUE':
        key += `:${detail.number}`
        break
      case 'ACTIVITY':
        key += `:${detail.id}`
        break
    }

    await db.put(key, evt)
  }
}

async function * iterateProjects (projects, config) {
  for (let pkg of projects) {
    for await (let evt of loadProject(pkg, config)) {
      yield evt
    }
  }
}
