'use strict'
const { request } = require('undici')
const yaml = require('js-yaml')
const GHRAW = 'https://raw.githubusercontent.com/'

module.exports.getPackageJson = async function getPackageJson (project) {
  const resp = await request(`${GHRAW}${project.repoOwner}/${project.repoName}/${project.repoBranch}${project.repoDirectory}package.json`)
  if (resp.statusCode !== 200) {
    const e = new Error(`Non-200 Response: ${resp.statusCode}`)
    e.status = resp.statusCode
    e.body = await resp.body.text()
    throw e
  }
  return resp.body.json()
}

module.exports.getTravisConfig = async function getTravisConfig (project) {
  const resp = await request(`${GHRAW}${project.repoOwner}/${project.repoName}/${project.repoBranch}${project.repoDirectory}.travis.yml`)

  if (resp.statusCode !== 200) {
    const e = new Error(`Non-200 Response: ${resp.statusCode}`)
    e.status = resp.statusCode
    e.body = await resp.body.text()
    throw e
  }

  const travisTxt = await resp.body.text()

  return yaml.safeLoad(travisTxt)
}
