'use strict'

module.exports.Project = class Project {
  /**
   * Constructs a new Project instance.
   *
   * @param {object|string} proj - The project information. It can be a string in the format "repoOwner/repoName" or an object with the following properties:
   * @param {string} [proj.repo] - The repository in the format "repoOwner/repoName".
   * @param {string} [proj.repoOwner] - The owner of the repository.
   * @param {string} [proj.repoName] - The name of the repository.
   * @param {string} [proj.name] - The name of the project.
   * @param {string} [proj.repoBranch] - The branch of the repository.
   * @param {string} [proj.repoDirectory] - The directory of the repository.
   */
  constructor (proj) {
    let repo
    let repoOwner
    let repoName
    if (typeof proj === 'string') {
      [repoOwner, repoName] = proj.split('/')

      if (!repoOwner || !repoName) {
        throw new Error('Invalid repo format. It should be in the format "repoOwner/repoName".')
      }

      repo = proj
    } else if (proj?.repo) {
      [repoOwner, repoName] = proj.repo.split('/')
      repo = proj.repo
      repoOwner = proj.repoOwner || repoOwner
      repoName = proj.repoName || repoName
    } else {
      if (proj?.repoOwner && proj?.repoName) {
        repo = `${proj.repoOwner}/${proj.repoName}`
      }
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
