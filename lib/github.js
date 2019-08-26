'use strict'
const inquirer = require('inquirer')
const fetch = require('node-fetch')
const Octokit = require('@octokit/rest')
  .plugin(require('@octokit/plugin-throttling'))
  .plugin(require('@octokit/plugin-retry'))

module.exports =
async function getOctokit (opts = {}) {
  let {
    token,
    username,
    password,
    tfatoken,
    log,
    onAbuseLimit,
    onRateLimit
  } = opts

  let prompts = {}
  if (!token && !(username || password)) {
    prompts = await inquirer.prompt([{
      name: 'token',
      message: 'Token (leave blank to use username/password auth):',
      when: !token && !(username && password)
    }, {
      name: 'username',
      message: 'Username:',
      default: username,
      when: !username
    }, {
      name: 'password',
      message: 'Password:',
      type: 'password',
      default: password,
      when: !password
    }])

    token = token || prompts.token
    username = username || prompts.username
    password = password || prompts.password
  }

  let auth
  if (token) {
    auth = token
  } else if (username && password) {
    auth = {
      username,
      password,
      on2fa: async function on2fa () {
        let { otp } = await inquirer.prompt({
          name: 'otp',
          message: '2FA Token (otp):',
          when: !tfatoken
        })
        // If passed initially, null out so if we need
        // a second tfa token it will be prompted for
        otp = otp || tfatoken
        tfatoken = null
        return otp
      }
    }
  }

  log = log || console

  const octokit = Octokit({
    auth,
    throttle: {
      onAbuseLimit: onAbuseLimit || ((err) => {
        log.error(err)
      }),
      onRateLimit: onRateLimit || ((err, options) => {
        log.error(err)
        return options.request.retryCount < 2
      })
    }
  })

  return octokit
}

const Repo = module.exports.Repo =
class Repo {
  constructor (owner, repo = {}) {
    this.owner = owner
    this.name = repo.name
    this.url = repo.html_url
    this.description = repo.description
    this.created = repo.created_at
    this.updated = repo.updated_at
    this.pushed = repo.pushed_at
    this.stars = repo.stargazers_count
    this.watchers = repo.watchers_count
    this.forks = repo.forks
    this.openIssues = repo.open_issues
    this.license = repo.license && (repo.license.spdx_id || repo.license.name)
    this.language = repo.language
    this.homepage = repo.homepage
  }
}

module.exports.getRepo =
async function getRepo (octokit, owner, repo) {
  const resp = await octokit.repos.get({ owner, repo })
  if (resp.status !== 200) {
    const e = new Error('Failed to load repo')
    e.code = 'GET_REPO_FAILED'
    e.status = resp.status
    Error.captureStackTrace(e, module.exports.getRepo)
    throw e
  }

  return new Repo(owner, resp.data)
}

const Issue = module.exports.Issue =
class Issue {
  constructor (owner, repo, issue = {}) {
    this.owner = owner
    this.repo = repo
    this.number = issue.number
    this.isPullRequest = !!issue.pull_request
    this.url = issue.html_url
    this.state = issue.state
    this.title = issue.title
    this.description = issue.description
    this.createdAt = issue.created_at
    this.updatedAt = issue.updated_at
    this.closedAt = issue.closed_at
    this.mergedAt = issue.merged_at
    this.labels = issue.labels.map((l) => {
      return {
        name: l.name,
        color: l.color
      }
    })
    this.assignee = issue.assignee && {
      login: issue.assignee.login,
      avatarUrl: issue.assignee.avatar_url,
      url: issue.assignee.html_url
    }
    this.author = issue.user && {
      login: issue.user.login,
      avatarUrl: issue.user.avatar_url,
      url: issue.user.html_url
    }
  }
}

module.exports.getRepoIssues =
async function * getRepoIssues (octokit, owner, repo) {
  const pullOpts = octokit.issues.listForRepo.endpoint.merge({
    owner,
    repo,
    state: 'all'
  })
  for await (const resp of octokit.paginate.iterator(pullOpts)) {
    if (resp.status !== 200) {
      const e = new Error('Failed to load repo issues')
      e.code = 'GET_REPO_ISSUES_FAILED'
      e.status = resp.status
      Error.captureStackTrace(e, module.exports.getRepoIssues)
      throw e
    }

    for (let i of resp.data) {
      yield new Issue(owner, repo, i)
    }
  }
}

const Activity = module.exports.Activity =
class Activity {
  constructor (owner, repo, activity = {}) {
    this.owner = owner
    this.repo = repo
    this.id = activity.id
    this.type = activity.type
    this.createdAt = activity.created_at
    this.actor = activity.actor && {
      login: activity.actor.login,
      avatarUrl: activity.actor.avatar_url,
      url: activity.actor.url
    }
    this.payload = activity.payload
  }
}

module.exports.getRepoActivity =
async function * getRepoActivity (octokit, owner, repo) {
  const eventsOpts = octokit.activity.listRepoEvents.endpoint.merge({
    owner,
    repo
  })
  for await (const resp of octokit.paginate.iterator(eventsOpts)) {
    if (resp.status !== 200) {
      const e = new Error('Failed to load repo activity')
      e.code = 'GET_REPO_ACTIVITY_FAILED'
      e.status = resp.status
      throw e
    }

    for (let a of resp.data) {
      yield new Activity(owner, repo, a)
    }
  }
}

module.exports.getReadme =
async function getReadme (octokit, owner, repo) {
  const resp = await octokit.repos.getReadme({ owner, repo })
  if (resp.status !== 200) {
    const e = new Error('Failed to load readme')
    e.code = 'GET_README_FAILED'
    e.status = resp.status
    Error.captureStackTrace(e, module.exports.getReadme)
    throw e
  }

  return (await fetch(resp.data.download_url)).text()
}

module.exports.getOrgRepos =
async function * getOrgRepos (octokit, org) {
  const resp = await octokit.repos.listForOrg({ org })
  if (resp.status !== 200) {
    const e = new Error('Failed to load org repos')
    e.code = 'GET_ORG_REPOS_FAILED'
    e.status = resp.status
    Error.captureStackTrace(e, module.exports.listOrgRepos)
    throw e
  }

  for (var r of resp.data) {
    yield new Repo(org, r)
  }
}

const Commit = module.exports.Commit =
class Commit {
  constructor (owner, repo, commit = {}) {
    this.owner = owner
    this.repo = repo
    this.nodeId = commit.node_id
    this.sha = commit.sha
    this.author = commit.author || (commit.commit.author && commit.commit.author.email)
  }
}

module.exports.getRepoCommits =
async function * getRepoCommits (octokit, owner, repo) {
  const commitsOpts = octokit.repos.listCommits.endpoint.merge({
    owner,
    repo
  })
  for await (const resp of octokit.paginate.iterator(commitsOpts)) {
    if (resp.status !== 200) {
      const e = new Error('Failed to load repo commits')
      e.code = 'GET_REPO_COMMITS_FAILED'
      e.status = resp.status
      throw e
    }

    for (let i = 0; i < resp.data.length; i++) {
      yield new Commit(owner, repo, resp.data[i])
    }
  }
}
