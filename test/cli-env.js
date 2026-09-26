'use strict'
const { suite, test, beforeEach, afterEach } = require('mocha')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

suite('CLI environment files', () => {
  let directory

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'statusboard-env-'))
    await fs.writeFile(path.join(directory, 'config.cjs'),
      'module.exports = { tokenFromConfig: process.env.GITHUB_TOKEN }')
  })

  afterEach(async () => {
    await fs.rm(directory, { recursive: true, force: true })
  })

  function runCli (args = [], token) {
    const env = { ...process.env }
    for (const key of ['GITHUB_TOKEN', 'GITHUB_USER', 'GITHUB_PASS', 'GITHUB_2FA']) {
      delete env[key]
    }
    if (token) env.GITHUB_TOKEN = token
    const script = `
      const cli = require(${JSON.stringify(require.resolve('../lib/cli'))})
      cli(async opts => {
        process.stdout.write(JSON.stringify(opts))
        return { buildSite: async () => {} }
      }).parseAsync(['site', '--config', 'config.cjs', ...process.argv.slice(1)])
        .catch(() => { process.exitCode = 1 })
    `
    return JSON.parse(execFileSync(process.execPath, ['-e', script, '--', ...args], {
      cwd: directory,
      env,
      encoding: 'utf8'
    }))
  }

  test('loads the default .env before reading configuration', async () => {
    await fs.writeFile(path.join(directory, '.env'), 'GITHUB_TOKEN="from-file"\n')
    const opts = runCli()
    assert.equal(opts.github.token, 'from-file')
    assert.equal(opts.tokenFromConfig, 'from-file')
  })

  test('honors --env instead of loading the default file', async () => {
    await fs.writeFile(path.join(directory, '.env'), 'GITHUB_TOKEN=default\n')
    await fs.writeFile(path.join(directory, 'custom.env'), 'GITHUB_TOKEN=custom\n')
    const opts = runCli(['--env', 'custom.env'])
    assert.equal(opts.github.token, 'custom')
    assert.equal(opts.tokenFromConfig, 'custom')
  })

  test('preserves variables supplied by the environment', async () => {
    await fs.writeFile(path.join(directory, '.env'), 'GITHUB_TOKEN=from-file\n')
    assert.equal(runCli([], 'from-shell').github.token, 'from-shell')
  })

  test('works without an .env file when the token is supplied externally', () => {
    assert.equal(runCli([], 'from-ci').github.token, 'from-ci')
  })
})
