'use strict'

module.exports.Project = class Project {
  constructor (proj) {
    let repo
    let repoOwner
    let repoName
    if (typeof proj === 'string') {
      [repoOwner, repoName] = proj.split('/')
      repo = proj
    } else if (proj.repo && (!proj.repoOwner || !proj.repoName)) {
      [repoOwner, repoName] = proj.repo.split('/')
      repo = proj.repo
      repoOwner = proj.repoOwner || repoOwner
      repoName = proj.repoName || repoName
    } else if (!proj.repo && proj.repoOwner && proj.repoName) {
      repo = `${proj.repoOwner}/${proj.repoName}`
      repoOwner = proj.repoOwner
      repoName = proj.repoName
    }

    this.name = proj.name || repo
    this.repo = repo
    this.repoOwner = repoOwner
    this.repoName = repoName
    this.repoBranch = proj.repoBranch
    this.repoDirectory = proj.repoDirectory || '/'
    this.packageName = null
  }
}
