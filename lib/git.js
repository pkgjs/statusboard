'use strict'
const { execFileSync } = require('node:child_process')

module.exports.gitInit = function gitInit (directory) {
  const options = { cwd: directory, stdio: 'ignore' }
  try {
    execFileSync('git', ['init', '-b', 'main'], options)
    execFileSync('git', ['add', '-A'], options)
    execFileSync('git', ['commit', '-m', 'Initial commit from @pkgjs/statusboard'], options)
    return true
  } catch {
    // Keep the repository and generated files if Git identity is not configured.
    return false
  }
}
