'use strict'
const pacote = require('pacote')
const { Manifest, Packument } = require('./models/npm')

module.exports.getPackument = async function getNpmPackument (packageName) {
  const resp = await pacote.packument(packageName)
  return new Packument(resp)
}

module.exports.getManifest = async function getNpmManifest (packageName) {
  const resp = await pacote.manifest(packageName)
  return new Manifest(resp)
}
