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
    inquirer.prompt = async () => { throw new Error('Must reject the destination before prompting') }
    await assert.rejects(create({ directory }), /Directory is not empty/)
    assert.equal(await fs.readFile(path.join(directory, 'config.js'), 'utf8'), 'original')
    assert.deepEqual(await fs.readdir(directory), ['config.js'])
  })

  test('rejects an empty directory answer', async () => {
    answers.path = '   '
    await assert.rejects(create(), /Enter a project directory/)
  })

  test('creates without prompts using CLI settings and --no-git', async () => {
    inquirer.prompt = async () => { throw new Error('Must not prompt with --yes') }
    const app = path.join(directory, 'automated')
    await cli(() => {}).parseAsync([
      'create', app, '--yes', '--no-git', '--orgs', 'pkgjs,nodejs',
      '--repositories', 'expressjs/express, pkgjs/statusboard',
      '--labels', 'bug, help wanted', '--github-actions'
    ])
    const config = require(path.join(app, 'config.js'))
    assert.deepEqual(config.orgs, ['pkgjs', 'nodejs'])
    assert.deepEqual(config.projects, ['expressjs/express', 'pkgjs/statusboard'])
    assert.deepEqual(config.issueLabels, ['bug', 'help wanted'])
    assert.ok((await fs.stat(path.join(app, '.github', 'workflows', 'build.yml'))).isFile())
    await assert.rejects(fs.stat(path.join(app, '.git')), { code: 'ENOENT' })
  })

  test('uses default values without a terminal or directory argument', async () => {
    execFileSync(process.execPath, [require.resolve('../bin/statusboard'), 'create', '-y', '--no-git'], {
      cwd: directory,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10000
    })
    const app = path.join(directory, 'statusboard')
    const config = require(path.join(app, 'config.js'))
    assert.deepEqual(config.orgs, [])
    assert.deepEqual(config.projects, [])
    assert.equal(Object.hasOwn(config, 'issueLabels'), false)
    await assert.rejects(fs.stat(path.join(app, '.github')), { code: 'ENOENT' })
    await assert.rejects(fs.stat(path.join(app, '.git')), { code: 'ENOENT' })
  })

  test('prompts only for missing interactive settings and preserves explicit empty labels', async () => {
    inquirer.prompt = async questions => {
      const asked = questions.filter(question => !question.when || question.when({})).map(question => question.name)
      assert.deepEqual(asked, ['repositories'])
      return { repositories: 'pkgjs/statusboard' }
    }
    const app = path.join(directory, 'interactive')
    await cli(() => {}).parseAsync(['create', app, '--no-git', '--orgs', 'pkgjs', '--labels', '', '--no-github-actions'])
    const config = require(path.join(app, 'config.js'))
    assert.deepEqual(config.issueLabels, [])
    assert.deepEqual(config.projects, ['pkgjs/statusboard'])
    await assert.rejects(fs.stat(path.join(app, '.github')), { code: 'ENOENT' })
  })

  test('rejects invalid repository options before prompting or creating files', async () => {
    inquirer.prompt = async () => { throw new Error('Must validate supplied options first') }
    const app = path.join(directory, 'invalid')
    await assert.rejects(create({ directory: app, repositories: 'missing-owner' }), /Use owner\/repo/)
    await assert.rejects(fs.stat(app), { code: 'ENOENT' })
  })

  test('rejects a file as the destination without changing it or prompting', async () => {
    const target = path.join(directory, 'existing-file')
    await fs.writeFile(target, 'keep this file')
    inquirer.prompt = async () => { throw new Error('Must reject the destination before prompting') }
    await assert.rejects(create({ directory: target }), { code: 'ENOTDIR' })
    assert.equal(await fs.readFile(target, 'utf8'), 'keep this file')
  })

  test('does not create directories when the user cancels the configuration prompts', async () => {
    const app = path.join(directory, 'nested', 'cancelled')
    const cancelled = new Error('User cancelled')
    inquirer.prompt = async () => { throw cancelled }
    await assert.rejects(create({ directory: app }), error => error === cancelled)
    assert.deepEqual(await fs.readdir(directory), [])
  })

  test('preserves files added to the destination while prompting', async () => {
    const app = path.join(directory, 'changed')
    inquirer.prompt = async () => {
      await fs.mkdir(app)
      await fs.writeFile(path.join(app, 'config.js'), 'created while prompting')
      return answers
    }
    await assert.rejects(create({ directory: app }), /Directory is not empty/)
    assert.deepEqual(await fs.readdir(app), ['config.js'])
    assert.equal(await fs.readFile(path.join(app, 'config.js'), 'utf8'), 'created while prompting')
  })

  test('accepts repeated list options and preserves special characters in labels', async () => {
    const app = path.join(directory, 'repeated-options')
    const label = 'needs "review" \\ documentation\nnext line'
    await cli(() => {}).parseAsync([
      'create', app, '--yes', '--no-git',
      '--orgs', 'pkgjs, nodejs', '--orgs', 'expressjs',
      '--repositories', 'pkgjs/statusboard', '--repositories', 'nodejs/node,',
      '--labels', label, '--labels', 'bug, '
    ])
    const config = require(path.join(app, 'config.js'))
    assert.deepEqual(config.orgs, ['pkgjs', 'nodejs', 'expressjs'])
    assert.deepEqual(config.projects, ['pkgjs/statusboard', 'nodejs/node'])
    assert.deepEqual(config.issueLabels, [label, 'bug'])
  })

  test('uses the directory name for Pages locally and the configured base path in CI', async () => {
    const app = path.join(directory, 'local-board')
    await create({ directory: app, yes: true, git: false, githubActions: true })
    const configFile = path.join(app, 'config.js')
    for (const [basePath, expected] of [[undefined, '/local-board'], ['/deployed-repo', '/deployed-repo'], ['', '']]) {
      if (basePath === undefined) delete process.env.STATUSBOARD_BASE_URL
      else process.env.STATUSBOARD_BASE_URL = basePath
      delete require.cache[require.resolve(configFile)]
      assert.equal(require(configFile).baseUrl, expected)
    }
  })

  test('builds a site through the CLI using a generated project and local indexed data', async function () {
    this.timeout(20000)
    const app = path.join(directory, 'generated-site')
    process.env.STATUSBOARD_BASE_URL = '/published-board'
    await cli(() => {}).parseAsync([
      'create', app, '--yes', '--no-git', '--repositories', 'example/project',
      '--labels', 'help wanted', '--github-actions'
    ])
    // Seed the same records the indexer stores, without making network requests.
    const seed = `
      const statusboard = require(${JSON.stringify(require.resolve('../'))})
      ;(async () => {
        const board = await statusboard(require('./config.js'))
        const project = board.config.projects[0]
        try {
          await board.db.put('example:project:REPO', {
            type: 'REPO', project, detail: { url: 'https://github.com/example/project' }
          })
          await board.db.put('example:project:ISSUE:1', {
            type: 'ISSUE', project, detail: {
              state: 'OPEN', number: 1, title: 'An indexed issue',
              url: 'https://github.com/example/project/issues/1',
              labels: [{ name: 'help wanted', color: '008800' }]
            }
          })
          await board.db.put('example:project:COMMIT:1', {
            type: 'COMMIT', project, detail: {
              date: new Date().toISOString(),
              author: { login: 'contributor', avatarUrl: 'https://example.com/avatar.png' }
            }
          })
        } finally {
          await board.close()
        }
      })().catch(error => { console.error(error); process.exitCode = 1 })
    `
    const options = { cwd: app, stdio: ['ignore', 'pipe', 'pipe'], timeout: 10000 }
    execFileSync(process.execPath, ['-e', seed], options)
    execFileSync(process.execPath, [require.resolve('../bin/statusboard'), 'site', '-C', './config.js'], options)

    const output = path.join(app, 'build')
    const readJson = async name => JSON.parse(await fs.readFile(path.join(output, 'data', `${name}.json`), 'utf8'))
    assert.equal((await readJson('projects'))[0].repo, 'example/project')
    assert.equal((await readJson('labeledIssues'))['help wanted'][0].issue.title, 'An indexed issue')
    assert.equal((await readJson('userActivity')).contributor.activityCount, 1)
    assert.ok((await fs.stat(path.join(output, '404.html'))).isFile())
    const html = await fs.readFile(path.join(output, 'index.html'), 'utf8')
    const assets = [...html.matchAll(/(?:src|href)="(\/published-board\/[^" ]+\.(?:js|css))"/g)]
    assert.ok(assets.length >= 2, 'HTML should reference the generated JavaScript and stylesheet')
    for (const [, asset] of assets) {
      assert.ok((await fs.stat(path.join(output, asset.slice('/published-board/'.length)))).size > 0)
    }
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
