'use strict'
const { suite, test, beforeEach, afterEach } = require('mocha')
const assert = require('assert')
const os = require('os')
const path = require('path')
const fs = require('node:fs/promises')
const level = require('level')
const github = require('../lib/github')
const files = require('../lib/files')
const npm = require('../lib/npm')
const buildIndex = require('../lib/db/build-index')
const { Project } = require('../lib/project')
const indices = require('../template/indicies')

suite('Private package indexing', () => {
  let db
  let directory
  let pkg
  let npmCalls
  let restore
  const prefix = 'example:sample:'

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'statusboard-index-'))
    db = level(directory, { valueEncoding: 'json' })
    pkg = { name: 'sample', version: '1.0.0' }
    npmCalls = 0
    restore = []
    function stub (object, key, value) {
      const original = object[key]
      restore.push(() => { object[key] = original })
      object[key] = value
    }
    stub(github, 'getRepo', async () => ({ branch: 'main' }))
    for (const method of ['getRepoIssues', 'getRepoActivity', 'getRepoCommits']) {
      stub(github, method, async function * () {})
    }
    stub(files, 'getPackageJson', async () => pkg)
    stub(npm, 'getPackument', async () => {
      npmCalls++
      return { name: pkg.name, versions: { [pkg.version]: {} } }
    })
    stub(npm, 'getManifest', async () => {
      npmCalls++
      return { name: pkg.name, version: pkg.version }
    })
  })

  afterEach(async () => {
    for (const reset of restore) reset()
    await db.close()
    await fs.rm(directory, { recursive: true, force: true })
  })

  function index () {
    return buildIndex({
      github: { token: 'unused-test-token' },
      projects: [new Project('example/sample')],
      orgs: []
    }, db)
  }

  async function assertNoNpmMetadata () {
    for (const type of ['PACKUMENT', 'PACKAGE_MANIFEST']) {
      await assert.rejects(db.get(`${prefix}${type}`), err => err.notFound)
    }
    let projects
    for await (const { key, value } of db.createReadStream()) {
      projects = await indices.projects(projects, {}, key, value)
    }
    const project = projects.find(project => project.repo === 'example/sample')
    assert.strictEqual(project.packageJson.private, true)
    assert.strictEqual(project.packument, undefined)
    assert.ok(project.repoDetails)
  }

  test('removes stale npm metadata when a public package becomes private', async () => {
    await index()
    assert.strictEqual(npmCalls, 2)
    assert.ok(await db.get(`${prefix}PACKUMENT`))
    assert.ok(await db.get(`${prefix}PACKAGE_MANIFEST`))
    await db.put('example:other:PACKUMENT', { name: 'other' })

    pkg.private = true
    await index()
    await assertNoNpmMetadata()
    assert.strictEqual(npmCalls, 2)
    assert.deepStrictEqual(await db.get('example:other:PACKUMENT'), { name: 'other' })

    // Reindexing a private package should be safe after the records are gone.
    await index()
    await assertNoNpmMetadata()
    assert.strictEqual(npmCalls, 2)

    pkg.private = false
    pkg.version = '2.0.0'
    await index()
    assert.strictEqual(npmCalls, 4)
    assert.strictEqual((await db.get(`${prefix}PACKAGE_MANIFEST`)).detail.version, '2.0.0')
    assert.ok((await db.get(`${prefix}PACKUMENT`)).detail.versions['2.0.0'])
  })

  test('indexes a new private package without fetching npm metadata', async () => {
    pkg.private = true
    await index()
    await assertNoNpmMetadata()
    assert.strictEqual(npmCalls, 0)
  })
})
