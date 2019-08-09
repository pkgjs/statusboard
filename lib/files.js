'use strict'
const fetch = require('node-fetch')
const yaml = require('js-yaml')
const GHRAW = 'https://raw.githubusercontent.com/'

module.exports.getPackageJson = async function getPackageJson (owner, repo, branch = 'master') {
  return (await fetch(`${GHRAW}${owner}/${repo}/${branch}/package.json`)).json()
}

module.exports.getTravisConfig = async function getTravisConfig (owner, repo, branch = 'master') {
  const travisTxt = await (await fetch(`${GHRAW}${owner}/${repo}/${branch}/.travis.yml`)).text()
  return yaml.safeLoad(travisTxt)
}
