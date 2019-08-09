'use strict'
const github = require('./github')
const files = require('./files')
const npm = require('./npm')

module.exports = async function * loadProject (proj, config) {
  const project = new Project(proj)

  const octokit = await github(config.github)

  const repo = await github.getRepo(octokit, project.repoOwner, project.repoName)
  const pkg = await files.getPackageJson(project.repoOwner, project.repoName, project.primaryBranch)

  // In case the package name was not specified, get it from the package.json
  project.packageName = project.packageName || pkg.name

  yield projectDetail('REPO', project, repo)
  yield projectDetail('PACKAGE_JSON', project, pkg)

  yield projectDetail(
    'README',
    project,
    await github.getReadme(octokit, project.repoOwner, project.repoName, project.primaryBranch)
  )

  yield projectDetail(
    'TRAVIS',
    project,
    await files.getTravisConfig(project.repoOwner, project.repoName, project.primaryBranch)
  )

  yield projectDetail(
    'PACKUMENT',
    project,
    await npm.getPackument(project.packageName)
  )

  for await (let issue of github.getRepoIssues(octokit, project.repoOwner, project.repoName)) {
    yield projectDetail('ISSUE', project, issue)
  }

  for await (let activity of github.getRepoActivity(octokit, project.repoOwner, project.repoName)) {
    yield projectDetail('ACTIVITY', project, activity)
  }
}

function projectDetail (type, project, detail) {
  return { type, project, detail }
}

const Project = module.exports.Project =
class Project {
  constructor (proj) {
    let p = proj
    if (typeof proj === 'string') {
      const [repoOwner, repoName] = proj.split('/')
      p = { repoOwner, repoName }
    }

    this.repoOwner = p.repoOwner
    this.repoName = p.repoName
    this.primaryBranch = p.primaryBranch || 'master'
    this.repoDirectory = p.repoDirectory || ''
  }
}
