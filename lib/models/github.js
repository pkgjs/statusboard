module.exports.Repo = class Repo {
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
  }
}

module.exports.Issue = class Issue {
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

module.exports.Activity = class Activity {
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

module.exports.Commit = class Commit {
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
