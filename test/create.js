'use strict'
const { suite, test, beforeEach, afterEach } = require('mocha')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const { execFileSync } = require('node:child_process')
const inquirer = require('inquirer').default
const create = require('../lib/commands/create')
const cli = require('../lib/cli')

suite('Create command', () => {
  let directory
  let originalPrompt
  let environment
  let answers
  const gitEnv = {
    GIT_AUTHOR_NAME: 'Statusboard test',
    GIT_AUTHOR_EMAIL: 'test@example.com',
    GIT_COMMITTER_NAME: 'Statusboard test',
    GIT_COMMITTER_EMAIL: 'test@example.com',
    GIT_CONFIG_GLOBAL: os.devNull,
    GIT_CONFIG_NOSYSTEM: '1',
    STATUSBOARD_BASE_URL: ''
  }

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'statusboard-create-'))
    environment = Object.fromEntries(Object.keys(gitEnv).map(key => [key, process.env[key]]))
    Object.assign(process.env, gitEnv)
    answers = { defaultLabels: true, orgs: ' pkgjs, ,nodejs, ', repositories: ' pkgjs/statusboard, , ', githubActions: false }
    originalPrompt = inquirer.prompt
    inquirer.prompt = async () => answers
  })

  afterEach(async () => {
    inquirer.prompt = originalPrompt
    for (const [key, value] of Object.entries(environment)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    await fs.rm(directory, { recursive: true, force: true })
  })

  function git (cwd, ...args) {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  }

  test('creates a project via the CLI positional directory without changing the caller repository', async () => {
    const callerHead = git(process.cwd(), 'rev-parse', 'HEAD')
    const app = path.join(directory, 'My Board')
    await cli(() => { throw new Error('Should not build during create') }).parseAsync(['create', app])
    const config = require(path.join(app, 'config.js'))
    assert.deepEqual(config.orgs, ['pkgjs', 'nodejs'])
    assert.deepEqual(config.projects, ['pkgjs/statusboard'])
    assert.equal(Object.hasOwn(config, 'issueLabels'), false)
    const pkg = JSON.parse(await fs.readFile(path.join(app, 'package.json'), 'utf8'))
    assert.equal(pkg.name, 'my-board')
    assert.equal(pkg.private, true)
    assert.equal(pkg.dependencies['@pkgjs/statusboard'], `^${require('../package.json').version}`)
    assert.equal(git(app, 'rev-parse', '--show-toplevel'), app)
    assert.equal(git(app, 'branch', '--show-current'), 'main')
    assert.equal(git(app, 'status', '--porcelain'), '')
    assert.equal(git(process.cwd(), 'rev-parse', 'HEAD'), callerHead)
    await fs.writeFile(path.join(app, '.env'), 'GITHUB_TOKEN=test\n')
    await fs.mkdir(path.join(app, 'data.db'))
    await fs.writeFile(path.join(app, 'data.db', 'test'), 'data')
    assert.equal(git(app, 'status', '--porcelain'), '')
    await fs.mkdir(path.join(app, 'build', 'css'), { recursive: true })
    execFileSync(process.execPath, ['-e', pkg.scripts.clean.slice('node -e "'.length, -1)], { cwd: app })
    await assert.rejects(fs.stat(path.join(app, 'build', 'css')), { code: 'ENOENT' })
    await assert.rejects(fs.stat(path.join(app, '.github')), { code: 'ENOENT' })
  })

  test('supports a prompted path, custom labels and GitHub Pages base paths', async () => {
    answers = { ...answers, path: path.join(directory, 'board'), defaultLabels: false, labels: 'help wanted, , bug, ', githubActions: true }
    await create()
    const config = require(path.join(answers.path, 'config.js'))
    assert.deepEqual(config.issueLabels, ['help wanted', 'bug'])
    assert.equal(config.baseUrl, '')
    const workflow = await fs.readFile(path.join(answers.path, '.github', 'workflows', 'build.yml'), 'utf8')
    assert.match(workflow, /node-version: 22/)
    assert.match(workflow, /STATUSBOARD_BASE_URL: \$\{\{ steps.pages.outputs.base_path \}\}/)
    assert.match(workflow, /path: '\.\/build'/)
  })

  test('preserves an existing nonempty directory', async () => {
    await fs.writeFile(path.join(directory, 'config.js'), 'original')
    await assert.rejects(create({ directory }), /Directory is not empty/)
    assert.equal(await fs.readFile(path.join(directory, 'config.js'), 'utf8'), 'original')
    assert.deepEqual(await fs.readdir(directory), ['config.js'])
  })

  test('rejects an empty directory answer', async () => {
    answers.path = '   '
    await assert.rejects(create(), /Enter a project directory/)
  })

  test('keeps generated files and the repository if the initial commit fails', async () => {
    process.env.GIT_AUTHOR_NAME = ''
    const app = path.join(directory, 'no-identity')
    await create({ directory: app })
    assert.ok((await fs.stat(path.join(app, '.git'))).isDirectory())
    assert.ok((await fs.stat(path.join(app, 'config.js'))).isFile())
    assert.throws(() => git(app, 'rev-parse', '--verify', 'HEAD'))
  })
})
