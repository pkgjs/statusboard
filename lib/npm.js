'use strict'
const pacote = require('pacote')

const Packument = module.exports.Packument =
class Packument {
  constructor (packument) {
    this.name = packument.name
    this.distTags = packument.distTags || packument['dist-tags']
    this.modified = packument.modified
    this.versions = packument.versions
  }
}

module.exports.getPackument = async function getNpmPackument (packageName) {
  const resp = await pacote.packument(packageName)
  return new Packument(resp)
}

const Manifest = module.exports.Manifest =
class Manifest {
  constructor (manifest) {
    this.name = manifest.name
    this.version = manifest.version
    this.dependencies = manifest.dependencies
    this.optionalDependencies = manifest.optionalDependencies
    this.devDependencies = manifest.devDependencies
    this.peerDependencies = manifest.peerDependencies
    this.bundleDependencies = manifest.bundleDependencies
    this.bin = manifest.bin
  }
}
module.exports.getManifest = async function getNpmManifest (packageName) {
  const resp = await pacote.manifest(packageName)
  return new Manifest(resp)
}
