const inquirer = require('inquirer')
const path = require('node:path')
const createPackageJson = require('create-package-json')

async function create (opts) {
  const { directory } = opts
  let projectPath = directory

  if (!projectPath) {
    const res = await inquirer.prompt([
      {
        type: 'input',
        name: 'path',
        message: 'Where would you like to create your project?',
        default: 'statusboard'
      }
    ])

    projectPath = res.path.trim()
  }

  const appPath = path.resolve(projectPath)
  let projectName = path.basename(appPath)

  const pkg = await createPackageJson(
    {
      name: projectName,
      description: '"A dashboard for project status',
      version: '1.0.0',
      dependencies: ['@pkgjs/statusboard'],
      author: null,
      keywords: null,
      repository: null,
      type: 'commonjs',
      private: true,
      cwd: appPath,
      license: 'MIT',
      main: 'config.js',
      devDependencies: null,
      scrips: {
        build: 'statusboard build -C ./config',
        buildsite: 'npm run clean && statusboard site -C ./config',
        buildindex: 'statusboard index -C ./config',
        clean: 'rm -rf build/css build/js'
      }
    },
    {}
  )

  console.log(pkg)
  console.log(projectPath, projectName)
}

module.exports = create
