const assert = require('assert')
const { it, describe } = require('mocha')
const { Project } = require('../lib/project')

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
