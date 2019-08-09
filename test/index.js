'use strict'
require('dotenv').config()
const { describe, it } = require('mocha')
const path = require('path')
const pkg = require('../package.json')
const { db, template } = require('../')

const CONFIG = {
  ...require('../docs/config'),
  db: path.join(__dirname, '..', 'docs', 'data.db'),
  outputDirectory: path.join(__dirname, '..', 'docs'),
  github: {
    token: process.env.GHTOKEN
  }
}

describe(pkg.name, function () {
  it.skip('should build the index', async function () {
    this.timeout(0)
    await db.buildIndex(CONFIG)
  })

  it('should build a web page from a template', async function () {
    this.timeout(0)
    await template(CONFIG, db)
  })

  /*
  it('should create a list of the most active user', async function () {
    const userActivity = {}
    for await (let item of db.readIndex(CONFIG, 'ACTIVITY')) {
      const type = item.value.detail.type

      // Dont count watch/fork events
      if (![
        'IssuesEvent',
        'PullRequestEvent',
        'IssueCommentEvent'
      ].includes(type)) {
        continue
      }

      // Get the user based on the type
      let user
      switch (type) {
        case 'IssuesEvent':
          user = item.value.detail.payload.issue.user.login
          break
        case 'PullRequestEvent':
          user = item.value.detail.payload.pull_request.user.login
          break
        case 'IssueCommentEvent':
          user = item.value.detail.payload.comment.user.login
          break
      }
      userActivity[user] = (userActivity[user] || 0) + 1
    }

    // Sort by number and truncate
    console.log(Object.fromEntries(Object.entries(userActivity).sort((v1, v2) => {
      return v1[1] < v2[1] ? 1 : v1[1] === v2[1] ? 0 : -1
    }).slice(0, 10)))
  })

  it('should create a list of issues by tag', async function () {
    const issuesTypes = {}
    for await (let item of db.readIndex(CONFIG, 'ISSUE')) {
      const issue = item.value.detail
      const labels = issue.labels

      labels.forEach(({ name: label }) => {
        if ([
          CONFIG.issueTags.goodFirstIssue,
          CONFIG.issueTags.helpWanted,
          CONFIG.issueTags.discuss,
          CONFIG.issueTags.topPriority
        ].includes(label) && issue.state === 'open') {
          issuesTypes[label] = issuesTypes[label] || []
          issuesTypes[label].push(item.value.detail)
        }
      })
    }
    console.log(Object.keys(issuesTypes).reduce((obj, type) => {
      obj[type] = issuesTypes[type].length
      return obj
    }, {}))
  })
  */
})
