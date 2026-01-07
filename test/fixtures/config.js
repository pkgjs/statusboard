'use strict'
const path = require('path')

module.exports = {
  db: path.join(__dirname, 'tmp', 'data.db'),
  baseUrl: '/statusboard',
  outputDirectory: path.join(__dirname, 'tmp'),
  github: {
    token: process.env.GITHUB_TOKEN
  },

  title: 'StatusBoard Test',
  description: 'A test for StatusBoard',
  head: [
    '<link rel="me" href="https://social.lfx.dev/@nodejs" />',
    '<meta name="fediverse:creator" content="@nodejs@social.lfx.dev" />'
  ],
  orgs: [
    'pkgjs'
  ],

  projects: [
    'nodejs/package-maintenance',
    {
      name: 'Express StatusBoard',
      repo: 'expressjs/statusboard'
    }
  ],

  people: [
    {
      name: 'Wes Todd',
      email: 'wes@wesleytodd.com',
      website: 'http://www.github.com/wesleytodd',
      npmUsername: 'wesleytodd',
      githubUsername: 'wesleytodd',
      twitterUsername: 'wesleytodd'
    }
  ]
}
