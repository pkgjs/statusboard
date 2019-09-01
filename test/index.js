'use strict'
require('dotenv').config()
const { suite, test, before } = require('mocha')
const assert = require('assert')
const fs = require('fs-extra')
const pkg = require('../package.json')
const statusboard = require('../')
const { Config } = statusboard

// These tests require a github token
assert(process.env.GITHUB_TOKEN, `
Tests require GITHUB_TOKEN to be a valid GitHub personal token.
See: https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line

Then run:

  $ echo "GITHUB_TOKEN=<your token>" > .env
`)

const CONFIG = require('./fixtures/config')
suite(pkg.name, () => {
  before(async () => {
    await fs.remove(CONFIG.outputDirectory)
  })

  test('Configure a statusboard instance', async () => {
    const board = await statusboard(CONFIG)
    assert.strictEqual(board.config.db, CONFIG.db)
    assert.strictEqual(board.config.outputDirectory, CONFIG.outputDirectory)
    assert.strictEqual(board.config.baseUrl, Config.defaults.baseUrl)
    assert.strictEqual(board.config.title, CONFIG.title)
    assert.strictEqual(board.config.description, CONFIG.description)

    assert.strictEqual(board.config.orgs.length, CONFIG.orgs.length)
    assert.strictEqual(board.config.orgs[0].name, CONFIG.orgs[0])

    assert.strictEqual(board.config.projects.length, CONFIG.projects.length)

    assert.strictEqual(board.config.projects[0].name, CONFIG.projects[0])
    assert.strictEqual(board.config.projects[0].repo, CONFIG.projects[0])
    assert.strictEqual(board.config.projects[0].repoOwner, CONFIG.projects[0].split('/')[0])
    assert.strictEqual(board.config.projects[0].repoName, CONFIG.projects[0].split('/')[1])

    assert.strictEqual(board.config.projects[1].name, CONFIG.projects[1].name)
    assert.strictEqual(board.config.projects[1].repo, CONFIG.projects[1].repo)
    assert.strictEqual(board.config.projects[1].repoOwner, CONFIG.projects[1].repo.split('/')[0])
    assert.strictEqual(board.config.projects[1].repoName, CONFIG.projects[1].repo.split('/')[1])

    assert(board.config.issueLabels.length > 0)
    assert.strictEqual(board.config.people.length, CONFIG.people.length)

    // Check exposed interface a little
    assert.strictEqual(typeof board.buildIndex, 'function')
    assert.strictEqual(typeof board.buildSite, 'function')
    assert.strictEqual(typeof board.close, 'function')
  })

  test('Building the statusboard index', async function () {
    this.timeout(0)
    const board = await statusboard(CONFIG)
    await board.buildIndex()
  })

  test('should build a web page from a template', async function () {
    this.timeout(0)
    const board = await statusboard(CONFIG)
    await board.buildSite()
  })
})
