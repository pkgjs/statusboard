const { execSync } = require('child_process')
const { rm } = require('fs')
const { join } = require('path')

function isGitRepo () {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' })
    return true
  } catch {}
  return false
}

module.exports.gitInit = function gitInit (path) {
  let didInit = false

  try {
    if (isGitRepo()) {
      return false
    }

    execSync('git init', { stdio: 'ignore' })

    didInit = true

    execSync('git checkout -b main', { stdio: 'ignore' })
    execSync('git add -A', { stdio: 'ignore' })
    execSync('git commit -m "Initial commit from @pkgjs/statusboard"', {
      stdio: 'ignore'
    })

    return true
  } catch (e) {
    if (didInit) {
      try {
        rm(join(path, '.git'), { recursive: true, force: true })
      } catch (_) {}
    }
    return false
  }
}
