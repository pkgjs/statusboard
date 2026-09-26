const assert = require('assert')
const { Organization } = require('../lib/organization')
const { Project } = require('../lib/project')
const { Manifest, Packument } = require('../lib/npm')
const { describe, it } = require('mocha')

describe('Organization', function () {
  it('should create an organization with a name string', function () {
    const org = new Organization('TestOrg')
    assert.strictEqual(org.name, 'TestOrg')
    assert.strictEqual(org.displayName, 'TestOrg')
    assert.strictEqual(org.url, undefined)
  })

  it('should create an organization with an object', function () {
    const org = new Organization({ name: 'TestOrg', displayName: 'Test Organization', url: 'http://test.org' })
    assert.strictEqual(org.name, 'TestOrg')
    assert.strictEqual(org.displayName, 'Test Organization')
    assert.strictEqual(org.url, 'http://test.org')
  })

  it('should use name as displayName if displayName is not provided', function () {
    const org = new Organization({ name: 'TestOrg' })
    assert.strictEqual(org.name, 'TestOrg')
    assert.strictEqual(org.displayName, 'TestOrg')
    assert.strictEqual(org.url, undefined)
  })

  it('should handle empty object input', function () {
    const org = new Organization({})
    assert.strictEqual(org.name, undefined)
    assert.strictEqual(org.displayName, undefined)
    assert.strictEqual(org.url, undefined)
  })

  it('should handle no input', function () {
    const org = new Organization()
    assert.strictEqual(org.name, undefined)
    assert.strictEqual(org.displayName, undefined)
    assert.strictEqual(org.url, undefined)
  })
})

describe('Project', () => {
  it('should initialize with a string repo', () => {
    const proj = new Project('owner/repo')
    assert.strictEqual(proj.repo, 'owner/repo')
    assert.strictEqual(proj.repoOwner, 'owner')
    assert.strictEqual(proj.repoName, 'repo')
    assert.strictEqual(proj.name, 'owner/repo')
    assert.strictEqual(proj.repoBranch, undefined)
    assert.strictEqual(proj.repoDirectory, '/')
    assert.strictEqual(proj.packageName, null)
  })

  it('should throw an error if the repo format is invalid', () => {
    assert.throws(() => new Project('owner'), {
      name: 'Error',
      message: 'Invalid repo format. It should be in the format "repoOwner/repoName".'
    })
  })

  it('should initialize with an object containing repo', () => {
    const proj = new Project({ repo: 'owner/repo' })
    assert.strictEqual(proj.repo, 'owner/repo')
    assert.strictEqual(proj.repoOwner, 'owner')
    assert.strictEqual(proj.repoName, 'repo')
    assert.strictEqual(proj.name, 'owner/repo')
    assert.strictEqual(proj.repoBranch, undefined)
    assert.strictEqual(proj.repoDirectory, '/')
    assert.strictEqual(proj.packageName, null)
  })

  it('should initialize with an object containing repoOwner and repoName', () => {
    const proj = new Project({ repoOwner: 'owner', repoName: 'repo' })
    assert.strictEqual(proj.repo, 'owner/repo')
    assert.strictEqual(proj.repoOwner, 'owner')
    assert.strictEqual(proj.repoName, 'repo')
    assert.strictEqual(proj.name, 'owner/repo')
    assert.strictEqual(proj.repoBranch, undefined)
    assert.strictEqual(proj.repoDirectory, '/')
    assert.strictEqual(proj.packageName, null)
  })

  it('should initialize with an object containing only repoName', () => {
    const proj = new Project({ repoName: 'repo' })
    assert.strictEqual(proj.repo, undefined)
    assert.strictEqual(proj.repoOwner, undefined)
    assert.strictEqual(proj.repoName, 'repo')
    assert.strictEqual(proj.name, undefined)
    assert.strictEqual(proj.repoBranch, undefined)
    assert.strictEqual(proj.repoDirectory, '/')
    assert.strictEqual(proj.packageName, null)
  })

  it('should initialize with an object containing all properties', () => {
    const proj = new Project({
      name: 'customName',
      repo: 'owner/repo',
      repoBranch: 'main',
      repoDirectory: '/src'
    })
    assert.strictEqual(proj.repo, 'owner/repo')
    assert.strictEqual(proj.repoOwner, 'owner')
    assert.strictEqual(proj.repoName, 'repo')
    assert.strictEqual(proj.name, 'customName')
    assert.strictEqual(proj.repoBranch, 'main')
    assert.strictEqual(proj.repoDirectory, '/src')
    assert.strictEqual(proj.packageName, null)
  })
})

describe('Manifest', function () {
  it('should correctly initialize with given manifest data', function () {
    const manifestData = {
      name: 'test-package',
      version: '1.0.0',
      dependencies: { dep1: '^1.0.0' },
      optionalDependencies: { optDep1: '^1.0.0' },
      devDependencies: { devDep1: '^1.0.0' },
      peerDependencies: { peerDep1: '^1.0.0' },
      bundleDependencies: { bundleDep1: '^1.0.0' },
      bin: { bin1: 'bin1.js' }
    }

    const manifest = new Manifest(manifestData)

    assert.strictEqual(manifest.name, manifestData.name)
    assert.strictEqual(manifest.version, manifestData.version)
    assert.deepStrictEqual(manifest.dependencies, manifestData.dependencies)
    assert.deepStrictEqual(manifest.optionalDependencies, manifestData.optionalDependencies)
    assert.deepStrictEqual(manifest.devDependencies, manifestData.devDependencies)
    assert.deepStrictEqual(manifest.peerDependencies, manifestData.peerDependencies)
    assert.deepStrictEqual(manifest.bundleDependencies, manifestData.bundleDependencies)
    assert.deepStrictEqual(manifest.bin, manifestData.bin)
  })

  it('should handle missing optional fields', function () {
    const manifestData = {
      name: 'test-package',
      version: '1.0.0'
    }

    const manifest = new Manifest(manifestData)

    assert.strictEqual(manifest.name, manifestData.name)
    assert.strictEqual(manifest.version, manifestData.version)
    assert.strictEqual(manifest.dependencies, undefined)
    assert.strictEqual(manifest.optionalDependencies, undefined)
    assert.strictEqual(manifest.devDependencies, undefined)
    assert.strictEqual(manifest.peerDependencies, undefined)
    assert.strictEqual(manifest.bundleDependencies, undefined)
    assert.strictEqual(manifest.bin, undefined)
  })
})

describe('Packument', function () {
  it('should create an instance with the correct properties', function () {
    const packumentData = {
      name: 'example-package',
      distTags: { latest: '1.0.0' },
      modified: '2023-10-01T00:00:00.000Z',
      versions: { '1.0.0': {} }
    }

    const packument = new Packument(packumentData)

    assert.strictEqual(packument.name, 'example-package')
    assert.deepStrictEqual(packument.distTags, { latest: '1.0.0' })
    assert.strictEqual(packument.modified, '2023-10-01T00:00:00.000Z')
    assert.deepStrictEqual(packument.versions, { '1.0.0': {} })
  })

  it('should handle dist-tags correctly', function () {
    const packumentData = {
      name: 'example-package',
      'dist-tags': { latest: '1.0.0' },
      modified: '2023-10-01T00:00:00.000Z',
      versions: { '1.0.0': {} }
    }

    const packument = new Packument(packumentData)

    assert.deepStrictEqual(packument.distTags, { latest: '1.0.0' })
  })
})
