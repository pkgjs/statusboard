'use strict'
const github = require('../github')
const files = require('../files')
const npm = require('../npm')

module.exports = async function buildIndex (config, db) {
  for await (let evt of iterateProjects(config)) {
    let { type, project, detail } = evt
    let key = `${project.repoOwner}:${project.repoName}:${type}`
    switch (type) {
      case 'ISSUE':
        key += `:${detail.number}`
        break
      case 'ACTIVITY':
        key += `:${detail.id}`
        break
      case 'ERROR':
        console.log(evt)
        break
    }

    console.log(key)
    await db.put(key, evt)
  }
}

async function * iterateProjects (config) {
  for (let proj of config.projects) {
    for await (let evt of loadProject(proj, config)) {
      yield evt
    }
  }
}

async function * loadProject (project, config) {
  const octokit = await github(config.github)

  let repo
  try {
    repo = await github.getRepo(octokit, project.repoOwner, project.repoName)
  } catch (e) {
    yield projectDetail('ERROR', project, e)
  }

  let pkg
  try {
    pkg = await files.getPackageJson(project)
  } catch (e) {
    yield projectDetail('ERROR', project, e)
  }

  // In case the package name was not specified, get it from the package.json
  if (!project.packageName && pkg) {
    project.packageName = pkg.name
  }

  // We do this now because then the project has a packageName
  if (repo) {
    yield projectDetail('REPO', project, repo)
  }

  // If we found a package.json we think it is a node package
  if (pkg) {
    yield projectDetail('PACKAGE_JSON', project, pkg)

    try {
      yield projectDetail(
        'PACKUMENT',
        project,
        await npm.getPackument(project.packageName)
      )
    } catch (e) {
      yield projectDetail('ERROR', project, e)
    }
  }

  try {
    yield projectDetail(
      'README',
      project,
      await github.getReadme(octokit, project.repoOwner, project.repoName, project.primaryBranch)
    )
  } catch (e) {
    yield projectDetail('ERROR', project, e)
  }

  try {
    yield projectDetail(
      'TRAVIS',
      project,
      await files.getTravisConfig(project)
    )
  } catch (e) {
    yield projectDetail('ERROR', project, e)
  }

  try {
    for await (let issue of github.getRepoIssues(octokit, project.repoOwner, project.repoName)) {
      yield projectDetail('ISSUE', project, issue)
    }
  } catch (e) {
    yield projectDetail('ERROR', project, e)
  }

  try {
    for await (let activity of github.getRepoActivity(octokit, project.repoOwner, project.repoName)) {
      yield projectDetail('ACTIVITY', project, activity)
    }
  } catch (e) {
    yield projectDetail('ERROR', project, e)
  }
}

function projectDetail (type, project, detail) {
  return { type, project, detail }
}
