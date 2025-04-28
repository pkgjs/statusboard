'use strict'
const GHRAW = 'https://raw.githubusercontent.com/'

module.exports.getPackageJson = async function getPackageJson (project) {
  const resp = await fetch(`${GHRAW}${project.repoOwner}/${project.repoName}/${project.repoBranch}${project.repoDirectory}package.json`)
  if (resp.status !== 200) {
    const e = new Error(`Non-200 Response: ${resp.status}`)
    e.status = resp.status
    e.body = await resp.text()
    throw e
  }
  return resp.json()
}
