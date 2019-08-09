'use strict'
const path = require('path')
const fs = require('fs-extra')
const cptmpl = require('cptmpl')
const buildjs = require('@wesleytodd/buildjs')
const buildcss = require('@wesleytodd/buildcss')
const octicons = require('@primer/octicons')

module.exports = async function (config, db) {
  const outDir = path.resolve(config.outputDirectory)
  await buildDataFiles(db, config, outDir)
  await buildStaticAssets(config, outDir)
}

async function buildDataFiles (db, config, outDir) {
  const dataSets = {
    projects: [],
    taggedIssues: {},
    activityStats: {
      userActivity: {}
    }
  }

  // Tags we care about
  const issueTags = Object.entries(config.issueTags).map((t) => t[1])

  // Query database for project datak
  await Promise.all(config.projects.map(async (project) => {
    let p = { }

    for await (let { value } of db.readProject(config, project)) {
      switch (value.type) {
        case 'PACKAGE_JSON':
          p.packageName = value.detail.name
          break
        case 'REPO':
          p = Object.assign(p, value.detail)
          break
        case 'PACKUMENT':
          p.latestVersion = value.detail.distTags.latest
          break
        case 'ISSUE':
          // File in tagged issues
          const issue = value.detail
          const labels = issue.labels
          labels.forEach(({ name: label }) => {
            if (issue.state === 'open' && issueTags.includes(label)) {
              dataSets.taggedIssues[label] = dataSets.taggedIssues[label] || []
              dataSets.taggedIssues[label].push(issue)
            }
          })
          break
        case 'ACTIVITY':
          // Tally user activity
          const type = value.detail.type
          const ua = dataSets.activityStats.userActivity
          let user
          switch (type) {
            case 'IssuesEvent':
              user = value.detail.payload.issue.user.login
              ua[user] = (ua[user] || 0) + 1
              break
            case 'PullRequestEvent':
              user = value.detail.payload.pull_request.user.login
              ua[user] = (ua[user] || 0) + 1
              break
            case 'IssueCommentEvent':
              user = value.detail.payload.comment.user.login
              ua[user] = (ua[user] || 0) + 1
              break
          }
          // console.log(value.detail)
          // p.activity.push(value.detail)
          break
        case 'README':
        case 'TRAVIS':
          // ignore for now
          // console.log(value.detail)
          break
        default:
          console.log(value.type)
      }
    }
    dataSets.projects.unshift(p)
  }))

  // Sort and truncate user activity
  dataSets.activityStats.userActivity = Object.fromEntries(Object.entries(dataSets.activityStats.userActivity).sort((v1, v2) => {
    return v1[1] < v2[1] ? 1 : v1[1] === v2[1] ? 0 : -1
  }).slice(0, 30))

  await Promise.all(Object.entries(dataSets).map(([name, data]) => {
    return fs.outputJSON(path.join(outDir, 'data', `${name}.json`), data)
  }))
}

async function buildStaticAssets (config, outDir) {
  const tmplDir = path.join(__dirname, '..', 'template')

  // Output Icons
  await Promise.all(['eye', 'star', 'repo-forked', 'issue-opened'].map((icon) => {
    return fs.outputFile(path.join(outDir, 'icons', `${icon}.svg`), octicons[icon].toSVG({
      xmlns: 'http://www.w3.org/2000/svg'
    }))
  }))

  // Build js
  const jsFile = await buildjs({
    basedir: process.cwd(),
    entries: [path.join(tmplDir, 'js', 'index.js')],
    outputdir: path.relative(process.cwd(), path.join(outDir, 'js')),
    babelify: false
  })

  // Build css files
  const cssFiles = await Promise.all(['index', 'page', 'project-list'].map(async (file) => {
    return '/' + path.relative(outDir, await buildcss({
      basedir: process.cwd(),
      srcfile: path.relative(process.cwd(), path.join(tmplDir, 'css', `${file}.css`)),
      outputdir: path.relative(process.cwd(), path.join(outDir, 'css')),
      outputFilename: `${file}-{{hash}}.css`,
      outputMapFilename: `${file}-{{hash}}.css.map`
    }))
  }))

  // Buld html files
  await cptmpl(path.join(tmplDir, '404.html'), path.join(outDir, '404.html'), config)
  await cptmpl(path.join(tmplDir, 'index.html'), path.join(outDir, 'index.html'), {
    ...config,
    jsFile: '/' + path.relative(outDir, jsFile),
    css: {
      index: cssFiles[0],
      page: cssFiles[1],
      projectList: cssFiles[2]
    }
  }, {
    force: true
  })
}
