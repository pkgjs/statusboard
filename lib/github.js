'use strict'
const inquirer = require('inquirer')
const { retry } = require('@octokit/plugin-retry')
const { throttling } = require('@octokit/plugin-throttling')
const { Octokit } = require('@octokit/rest')

const OctokitRest = Octokit
  .plugin(retry, throttling)

const { graphql } = require('@octokit/graphql')

const repoQuerySnip = `{
  name
  url
  description
  createdAt
  updatedAt
  pushedAt
  stargazers {
    totalCount
  }
  watchers {
    totalCount
  }
  forks {
    totalCount
  }
  issues(states: OPEN) {
    totalCount
  }
  licenseInfo {
    name
  }
  primaryLanguage {
    name
  }
  homepageUrl
  defaultBranchRef {
    name
  }
}`

const issueQuerySnip = `pageInfo {
  hasNextPage
  endCursor
}
edges {
  node {
    __typename
    number
    url
    state
    title
    bodyText
    createdAt
    updatedAt
    closedAt
    labels(first: 10) {
      nodes {
        color
        name
      }
    }
    assignees(first: 1) {
      nodes {
        login
        avatarUrl
        url
      }
    }
    author {
      login
      url
      avatarUrl
    }
  }
}`

module.exports =
async function getOctokit (opts = {}) {
  let {
    token,
    log,
    onSecondaryRateLimit,
    onRateLimit
  } = opts

  let prompts = {}
  if (!token) {
    prompts = await inquirer.prompt([{
      name: 'token',
      message: 'Token:'
    }])

    token = token || prompts.token
  }

  const auth = token
  const authGraphQL = `token ${token}`

  log = log || console

  const octokit = new OctokitRest({
    auth,
    throttle: {
      onSecondaryRateLimit: onSecondaryRateLimit || ((err) => {
        log.error(err)
      }),
      onRateLimit: onRateLimit || ((err, options) => {
        log.error(err)
        return options.request.retryCount < 2
      })
    }
  })

  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: authGraphQL
    }
  })

  return [octokit, graphqlWithAuth]
}

const Repo = module.exports.Repo =
class Repo {
  constructor (owner, repo = {}) {
    this.owner = owner
    this.name = repo.name
    this.url = repo.url
    this.description = repo.description
    this.created = repo.createdAt
    this.updated = repo.updatedAt
    this.pushed = repo.pushedAt
    this.stars = repo.stargazers.totalCount
    this.watchers = repo.watchers.totalCount
    this.forks = repo.forks.totalCount
    this.openIssues = repo.issues.totalCount
    this.license = repo.licenseInfo && (repo.licenseInfo.spdx_id || repo.licenseInfo.name)
    this.language = repo.primaryLanguage ? repo.primaryLanguage.name : repo.primaryLanguage
    this.homepage = repo.homepageUrl
    this.branch = repo.defaultBranchRef.name
  }
}

module.exports.getRepo =
 async function getRepo (graphQL, owner, repo) {
   try {
     const resp = await graphQL({
       query: `query($org: String!, $repo: String!) {
        repository(owner: $org, name: $repo)
        ${repoQuerySnip}
      }`,
       org: owner,
       repo
     })
     return new Repo(owner, resp.repository)
   } catch (error) {
     error.code = 'GET_REPO_FAILED'
     Error.captureStackTrace(error, module.exports.getRepo)
     throw error
   }
 }

const Issue = module.exports.Issue =
class Issue {
  constructor (owner, repo, issue = {}) {
    this.owner = owner
    this.repo = repo
    this.number = issue.number
    this.isPullRequest = !!(issue.__typename === 'PullRequest')
    this.url = issue.url
    this.state = issue.state
    this.title = issue.title
    this.description = issue.bodyText
    this.createdAt = issue.createdAt
    this.updatedAt = issue.updatedAt
    this.closedAt = issue.closedAt
    this.mergedAt = issue.mergedAt
    this.labels = issue.labels.nodes.map((l) => {
      return {
        name: l.name,
        color: l.color
      }
    })
    let assignee = issue.assignees.nodes[0]
    if (!assignee) {
      assignee = null
    }
    this.assignee = assignee
    this.author = issue.author && {
      login: issue.author.login,
      avatarUrl: issue.author.avatarUrl,
      url: issue.author.url
    }
  }
}

async function getRemainingPullRequests (graphQL, owner, repo, cursor) {
  try {
    const resp = await graphQL({
      query: `query ($org: String!, $repo: String!, $cursor: String!) {
        organization(login: $org) {
          repository(name: $repo) {
            pullRequests(first: 100, after: $cursor, orderBy: {field: CREATED_AT, direction: DESC}) {
              ${issueQuerySnip}
            }
          }
        }
      }
      `,
      org: owner,
      repo,
      cursor
    })
    const { pageInfo, edges } = resp.organization.repository.pullRequests
    const pullRequests = !pageInfo.hasNextPage ? edges : edges.concat(await getRemainingPullRequests(graphQL, owner, repo, pageInfo.endCursor))
    return pullRequests
  } catch (error) {
    error.code = 'GET_REPO_PRS_FAILED'
    Error.captureStackTrace(error, module.exports.getRepoIssues)
    throw error
  }
}

async function getPullRequests (graphQL, owner, repo) {
  try {
    const resp = await graphQL({
      query: `query ($org: String!, $repo: String!) {
        organization(login: $org) {
          repository(name: $repo) {
            pullRequests(first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
              ${issueQuerySnip}
            }
          }
        }
      }`,
      org: owner,
      repo
    })
    const { pageInfo, edges } = resp.organization.repository.pullRequests
    const pullRequests = !pageInfo.hasNextPage ? edges : edges.concat(await getRemainingPullRequests(graphQL, owner, repo, pageInfo.endCursor))
    return pullRequests
  } catch (error) {
    error.code = 'GET_REPO_PRS_FAILED'
    Error.captureStackTrace(error, module.exports.getRepoIssues)
    throw error
  }
}

async function getRemainingIssues (graphQL, owner, repo, cursor) {
  try {
    const resp = await graphQL({
      query: `query ($org: String!, $repo: String!, $cursor: String!) {
        organization(login: $org) {
          repository(name: $repo) {
            issues(first: 100, after: $cursor, orderBy: {field: CREATED_AT, direction: DESC}) {
              ${issueQuerySnip}
            }
          }
        }
      }
      `,
      org: owner,
      repo,
      cursor
    })
    const { pageInfo, edges } = resp.organization.repository.issues
    const issues = !pageInfo.hasNextPage ? edges : edges.concat(await getRemainingIssues(graphQL, owner, repo, pageInfo.endCursor))
    return issues
  } catch (error) {
    error.code = 'GET_REPO_ISSUES_FAILED'
    Error.captureStackTrace(error, module.exports.getRepoIssues)
    throw error
  }
}

module.exports.getRepoIssues =
  async function * getRepoIssues (graphQL, owner, repo) {
    try {
      const resp = await graphQL({
        query: `query ($org: String!, $repo: String!) {
          organization(login: $org) {
            repository(name: $repo) {
              issues(first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
                ${issueQuerySnip}
              }
            }
          }
        }`,
        org: owner,
        repo
      })
      const { pageInfo, edges } = resp.organization.repository.issues
      const issues = !pageInfo.hasNextPage ? edges : edges.concat(await getRemainingIssues(graphQL, owner, repo, pageInfo.endCursor))

      issues.push.apply(issues, await getPullRequests(graphQL, owner, repo))

      for (const i of issues) {
        yield new Issue(owner, repo, i.node)
      }
    } catch (error) {
      error.code = 'GET_REPO_ISSUES_FAILED'
      Error.captureStackTrace(error, module.exports.getRepoIssues)
      throw error
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

    for (const a of resp.data) {
      yield new Activity(owner, repo, a)
    }
  }
}

module.exports.getReadme =
  async function getReadme (graphQL, owner, repo) {
    try {
      const resp = await graphQL({
        query: ` query($org: String!, $repo: String!) {
          repository(name: $repo, owner: $org) {
            object(expression: "master:README.md") {
              ... on Blob {
                text
              }
            }
            altLower: object(expression: "master:readme.md") {
              ... on Blob {
                text
              }
            }
            altUpper: object(expression: "master:Readme.md") {
              ... on Blob {
                text
              }
            }
          }
        }
        `,
        org: owner,
        repo
      })
      let readmeText
      Object.values(resp.repository).forEach(element => {
        if (element !== null) {
          readmeText = element.text
        }
      })
      return readmeText
    } catch (error) {
      error.code = 'GET_README_FAILED'
      Error.captureStackTrace(error, module.exports.getReadme)
      throw error
    }
  }

async function getRemainingRepos (graphQL, org, cursor) {
  try {
    const resp = await graphQL({
      query: `query($org: String!, $cursor: String!)
      {
        organization(login: $org) {
          repositories(first: 100, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes
            ${repoQuerySnip}
          }
        }
      }`,
      org,
      cursor
    })

    const { pageInfo, nodes } = resp.organization.repositories
    const repos = !pageInfo.hasNextPage ? nodes : nodes.concat(await getRemainingRepos(graphQL, org, pageInfo.endCursor))

    return repos
  } catch (error) {
    error.code = 'GET_ORG_REPOS_FAILED'
    Error.captureStackTrace(error, module.exports.getOrgRepos)
    throw error
  }
}

module.exports.getOrgRepos =
  async function * getOrgRepos (graphQL, org) {
    try {
      const resp = await graphQL({
        query: `query($org: String!)
        {
          organization(login: $org) {
            repositories(first: 100) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes
              ${repoQuerySnip}
            }
          }
        }`,
        org
      })

      const { pageInfo, nodes } = resp.organization.repositories
      const repos = !pageInfo.hasNextPage ? nodes : nodes.concat(await getRemainingRepos(graphQL, org, pageInfo.endCursor))

      for (const r of repos) {
        yield new Repo(org, r)
      }
    } catch (error) {
      error.code = 'GET_ORG_REPOS_FAILED'
      Error.captureStackTrace(error, module.exports.getOrgRepos)
      throw error
    }
  }

const Commit = module.exports.Commit =
class Commit {
  constructor (owner, repo, commit = {}) {
    this.owner = owner
    this.repo = repo
    this.nodeId = commit.id
    this.sha = commit.oid
    this.message = commit.message
    this.url = commit.url
    this.date = new Date(commit.authoredDate)

    let author = commit.author.user || commit.committer
    if (!author) {
      author = {
        login: commit.author.email
      }
    }
    this.author = author
  }
}

async function getRemainingCommits (graphQL, owner, repo, cursor, branch) {
  try {
    const resp = await graphQL({
      query: `query ($org: String!, $repo: String!, $cursor: String!, $branch: String!) {
        repository(name: $repo, owner: $org) {
          object(expression: $branch) {
            ... on Commit {
              history(first: 100, after: $cursor) {
                nodes {
                  id
                  oid
                  message
                  url
                  authoredDate
                  author {
                    email
                    user {
                      login
                      id
                      avatarUrl
                      url
                      isSiteAdmin
                    }
                  }
                }
                pageInfo {
                  endCursor
                  hasNextPage
                }
              }
            }
          }
        }
      }
      `,
      org: owner,
      repo,
      cursor,
      branch
    })
    const { pageInfo, nodes } = resp.repository.object.history
    const commits = !pageInfo.hasNextPage ? nodes : nodes.concat(await getRemainingCommits(graphQL, owner, repo, pageInfo.endCursor, branch))

    return commits
  } catch (error) {
    error.code = 'GET_REPO_COMMITS_FAILED'
    throw (error)
  }
}

module.exports.getRepoCommits =
async function * getRepoCommits (graphQL, owner, repo, branch) {
  try {
    const resp = await graphQL({
      query: `query ($org: String!, $repo: String!, $branch: String!) {
        repository(name: $repo, owner: $org) {
          object(expression: $branch) {
            ... on Commit {
              history(first: 100) {
                nodes {
                  id
                  oid
                  message
                  url
                  authoredDate
                  author {
                    email
                    user {
                      login
                      id
                      avatarUrl
                      url
                      isSiteAdmin
                    }
                  }
                }
                pageInfo {
                  endCursor
                  hasNextPage
                }
              }
            }
          }
        }
      }
      `,
      org: owner,
      repo,
      branch
    })
    const { pageInfo, nodes } = resp.repository.object.history
    const commits = !pageInfo.hasNextPage ? nodes : nodes.concat(await getRemainingCommits(graphQL, owner, repo, pageInfo.endCursor, branch))

    for (const c of commits) {
      yield new Commit(owner, repo, c)
    }
  } catch (error) {
    error.code = 'GET_REPO_COMMITS_FAILED'
    throw (error)
  }
}
