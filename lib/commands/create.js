const inquirer = require('inquirer')
const path = require('node:path')
const createPackageJson = require('create-package-json')
const fs = require('fs-extra')
const { gitInit } = require('../git.js')

async function create (opts) {
  const { directory } = opts

  const config = {
    path: directory,
    name: undefined,
    labels: [],
    orgs: [],
    projects: [],
    githubActions: false
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'path',
      message: 'Where would you like to create your project?',
      default: 'statusboard',
      when: () => !config.path
    },
    {
      type: 'confirm',
      name: 'defaultLabels',
      message: 'Do you want use default labels?',
      default: true
    },
    {
      type: 'input',
      name: 'labels',
      message: 'What labels do you want to use (use commas to separate)',
      when: (answers) => !answers.defaultLabels
    },
    {
      type: 'input',
      name: 'orgs',
      message:
        'What organizations do you want to include (use commas to separate)'
    },
    {
      type: 'input',
      name: 'repositories',
      message:
        'What repositories do you want to include (use commas to separate)'
    },
    {
      type: 'confirm',
      name: 'githubActions',
      message: 'Do you want deploy with GitHub Actions?',
      default: false
    }
  ])

  config.path = answers.path.trim()

  config.labels = transformUserInput(answers.labels)
  config.orgs = transformUserInput(answers.orgs)
  config.projects = transformUserInput(answers.repositories)
  config.githubActions = answers.githubActions

  const appPath = path.resolve(config.path)
  config.name = path.basename(appPath)
  config.path = appPath

  await fs.ensureDir(appPath)

  await createPackageJson({
    cwd: appPath,
    name: config.name,
    description: 'A dashboard for project status',
    version: '1.0.0',
    dependencies: ['@pkgjs/statusboard'],
    author: null,
    keywords: ['statusboard', 'projects'],
    repository: null,
    type: 'commonjs',
    private: true,
    license: 'MIT',
    main: 'config.js',
    devDependencies: null,
    scripts: {
      build: 'statusboard build -C ./config.js',
      buildsite: 'npm run clean && statusboard site -C ./config.js',
      buildindex: 'statusboard index -C ./config.js',
      clean: 'rm -rf build/css build/js'
    }
  })

  await createConfigFile(config)

  gitInit(appPath)
}

async function createConfigFile (config) {
  const configFile = path.join(config.path, 'config.js')

  const configJs = `module.exports = {${
    config.labels.length >= 1
      ? `\n  issueLabels: ${JSON.stringify(config.labels)},`
      : ''
  }${config.orgs.length >= 1 ? `\n  orgs: ${JSON.stringify(config.orgs)},` : ''}${
    config.projects.length >= 1
      ? `\n  projects: ${JSON.stringify(config.projects)},`
      : ''
  }
  github: {
    token: process.env.GITHUB_TOKEN
  }
}
`

  await fs.writeFile(configFile, configJs)
}

function transformUserInput(input) {
  if (input?.length === 0) {
    return []
  }

  return input?.split(",").map((l) => l.trim()) || []
}

module.exports = create
