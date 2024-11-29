const inquirer = require('inquirer')
const path = require('node:path')
const createPackageJson = require('create-package-json')
const fs = require('fs-extra')

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
      message: 'What organizations do you want to include (use commas to separate)'
    },
    {
      type: 'input',
      name: 'repositories',
      message: 'What repositories do you want to include (use commas to separate)'
    },
    {
      type: 'confirm',
      name: 'githubActions',
      message: 'Do you want to use GitHub Pages?',
      default: false
    }
  ])

  config.path = answers.path.trim()
  config.labels = answers.labels?.split(',').map((l) => l.trim()) || []
  config.orgs = answers.orgs?.split(',').map((l) => l.trim()) || []
  config.projects = answers.repositories?.split(',').map((l) => l.trim()) || []
  config.githubActions = answers.githubActions

  const appPath = path.resolve(config.path)
  config.name = path.basename(appPath)

  await fs.ensureDir(appPath)

  await createPackageJson({
    cwd: appPath,
    name: config.name,
    description: 'A dashboard for project status',
    version: '1.0.0',
    dependencies: ['@pkgjs/statusboard'],
    author: null,
    keywords: ["statusboard", "projects"],
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
}

module.exports = create
