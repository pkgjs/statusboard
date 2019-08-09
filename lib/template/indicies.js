'use strict'

module.exports = {
  projects: async (data, config, { type, project, detail }) => {
    if (!['REPO', 'PACKAGE_JSON', 'PACKUMENT', 'TRAVIS'].includes(type)) {
      return data
    }

    data = data || []
    const existing = data.find((p) => p.repo === project.repo)
    const proj = existing || { ...project }
    switch (type) {
      case 'TRAVIS':
        proj.travis = detail
        break
      case 'PACKAGE_JSON':
        proj.packageJson = detail
        break
      case 'REPO':
        proj.repoDetails = detail
        break
      case 'PACKUMENT':
        proj.packument = detail
        break
    }
    // When adding for the first time, unshift it (maintains order),
    // otherwise we are just modifying it in place
    if (!existing) {
      data.unshift(proj)
    }

    return data
  },

  userActivity: async (data, config, { type, project, detail }) => {
    if (type !== 'ACTIVITY') {
      return data
    }

    data = data || {}
    let user
    switch (detail.type) {
      case 'IssuesEvent':
        user = detail.payload.issue.user.login
        data[user] = (data[user] || 0) + 1
        break
      case 'PullRequestEvent':
        user = detail.payload.pull_request.user.login
        data[user] = (data[user] || 0) + 1
        break
      case 'IssueCommentEvent':
        user = detail.payload.comment.user.login
        data[user] = (data[user] || 0) + 1
        break
    }

    // Keep sorted and no longer than 30 users
    data = Object.fromEntries(Object.entries(data).sort((v1, v2) => {
      return v1[1] < v2[1] ? 1 : v1[1] === v2[1] ? 0 : -1
    }).slice(0, 30))

    return data
  },

  labeledIssues: async (data, config, { type, project, detail }) => {
    if (type !== 'ISSUE' || detail.state !== 'open') {
      return data
    }

    const labelNames = config.issueLabels.map((label) => label.name)
    return detail.labels.reduce((labels, label) => {
      // Check that it is a label we care about
      if (!labelNames.includes(label.name)) {
        return
      }

      labels[label.name] = labels[label.name] || []
      labels[label.name].push({ ...detail, project })
      return labels
    }, data || {})
  }
}
