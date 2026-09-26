'use strict'
const inquirer = require('inquirer').default
const path = require('node:path')
const fs = require('node:fs/promises')
const { gitInit } = require('../git')
const packageJson = require('../../package.json')

async function create (opts = {}) {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'path',
      message: 'Where would you like to create your project?',
      default: 'statusboard',
      when: () => !opts.directory,
      validate: value => value.trim().length > 0 || 'Enter a project directory.'
    },
    {
      type: 'confirm',
      name: 'defaultLabels',
      message: 'Do you want to use the default labels?',
      default: true
    },
    {
      type: 'input',
      name: 'labels',
      message: 'What labels do you want to use (use commas to separate)?',
      when: answers => !answers.defaultLabels
    },
    {
      type: 'input',
      name: 'orgs',
      message: 'What organizations do you want to include (use commas to separate)?'
    },
    {
      type: 'input',
      name: 'repositories',
      message: 'What repositories do you want to include (owner/repo, separated by commas)?',
      validate: value => transformUserInput(value).every(repo => /^[\w.-]+\/[\w.-]+$/.test(repo)) || 'Use owner/repo for each repository.'
    },
    {
      type: 'confirm',
      name: 'githubActions',
      message: 'Do you want to deploy with GitHub Actions?',
      default: false
    }
  ])

  const directory = (opts.directory || answers.path || '').trim()
  if (!directory) throw new Error('Enter a project directory.')
  const appPath = path.resolve(directory)
  await fs.mkdir(appPath, { recursive: true })
  if ((await fs.readdir(appPath)).length) {
    throw new Error(`Directory is not empty: ${appPath}`)
  }

  const config = {
    path: appPath,
    name: path.basename(appPath),
    labels: answers.defaultLabels ? undefined : transformUserInput(answers.labels),
    orgs: transformUserInput(answers.orgs),
    projects: transformUserInput(answers.repositories),
    githubActions: answers.githubActions
  }

  if (config.githubActions) await createBuildAction(config)
  await createConfigFile(config)
  await fs.copyFile(path.join(__dirname, 'template', 'gitignore'), path.join(appPath, '.gitignore'))

  // The generated manifest is fixed apart from the project name and our version.
  const manifest = {
    name: config.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+/, '') || 'statusboard',
    description: 'A dashboard for project status',
    version: '1.0.0',
    private: true,
    type: 'commonjs',
    license: 'MIT',
    engines: packageJson.engines,
    dependencies: { '@pkgjs/statusboard': `^${packageJson.version}` },
    scripts: {
      build: 'statusboard build -C ./config.js',
      buildsite: 'npm run clean && statusboard site -C ./config.js',
      buildindex: 'statusboard index -C ./config.js',
      clean: 'node -e "const fs = require(\'node:fs\'); for (const dir of [\'build/css\', \'build/js\']) fs.rmSync(dir, { recursive: true, force: true })"'
    }
  }
  await fs.writeFile(path.join(appPath, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' })

  if (!gitInit(appPath)) {
    console.warn('Could not create the initial Git commit. Project files are ready; check Git installation and user configuration.')
  }
  console.log(`Created Statusboard in ${appPath}. Run npm install there, set GITHUB_TOKEN, then run npm run build.`)
  if (config.githubActions) {
    console.log('Enable GitHub Pages with GitHub Actions as the source in your repository settings.')
  }
}

async function createConfigFile (config) {
  const fields = {
    ...(config.labels === undefined ? {} : { issueLabels: config.labels }),
    orgs: config.orgs,
    projects: config.projects
  }
  const content = JSON.stringify(fields, null, 2).slice(0, -2)
  const baseUrl = config.githubActions
    ? `\n  baseUrl: process.env.STATUSBOARD_BASE_URL ?? ${JSON.stringify(`/${config.name}`)},`
    : ''
  await fs.writeFile(path.join(config.path, 'config.js'), `'use strict'\nmodule.exports = ${content},${baseUrl}
  github: {
    token: process.env.GITHUB_TOKEN
  }
}
`, { flag: 'wx' })
}

function transformUserInput (input = '') {
  return input.split(',').map(value => value.trim()).filter(Boolean)
}

async function createBuildAction (config) {
  const workflowDir = path.join(config.path, '.github', 'workflows')
  await fs.mkdir(workflowDir, { recursive: true })
  await fs.copyFile(path.join(__dirname, 'template', 'build.yml'), path.join(workflowDir, 'build.yml'))
}

module.exports = create
