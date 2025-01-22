'use strict'
const yaml = require('js-yaml')
const GHRAW = 'https://raw.githubusercontent.com/'

module.exports.getPackageJson = async function getPackageJson (project) {
  const resp = await fetch(`${GHRAW}${project.repoOwner}/${project.repoName}/${project.repoBranch}${project.repoDirectory}package.json`)
  if (resp.status !== 200) {
    const e = new Error(`Non-200 Response: ${resp.status}`)
    e.status = resp.status
    e.body = await resp.text()
    throw e
  }
  return resp.json()
}

module.exports.getTravisConfig = async function getTravisConfig (project) {
  const resp = await fetch(`${GHRAW}${project.repoOwner}/${project.repoName}/${project.repoBranch}${project.repoDirectory}.travis.yml`)
  if (resp.status !== 200) {
    const e = new Error(`Non-200 Response: ${resp.status}`)
    e.status = resp.status
    e.body = await resp.text()
    throw e
  }
  const travisTxt = await resp.text()
  return yaml.safeLoad(travisTxt)
}
