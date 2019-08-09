'use strict'
/* eslint-disable */
/* eslint-env browser */
require('regenerator-runtime/runtime')
const { html } = require('es5-lit-element')
const { render } = require('es5-lit-html')
const config = window.__config || {}

// Import custom elements
require('./page')
require('./project-list')

require('nighthawk')({
  base: config.baseUrl,
  queryParser: require('querystring').parse
})
  .use((req, res, next) => {
    // Handle the 404 page redirects
    if (req.query && req.query.__path) {
      return res.redirect(req.query.__path)
    }
    next()
  })
  .get('/', async () => {
    const taggedIssues = await (await fetch(`${config.baseUrl}data/labeledIssues.json`)).json()
    const userActivity = await (await fetch(`${config.baseUrl}data/userActivity.json`)).json()

    render(html`
      <statusboard-page .config="${config}">
        <style>main {display: flex;}</style>
        <main>
          <section>
            <h1><a href="${config.baseUrl}issues">Top Issues</a></h1>

            ${Object.entries(taggedIssues).map(([tag, issues]) => html`
              <div class="issues-list">
                <h3><a href="${config.baseUrl}issues/${tag}">${tag}</a></h3>
                <ul>
                  ${issues.slice(0, 3).map((issue) => html`
                      <li>
                        <span class="project-link">
                          <a href="https://www.github.com/${issue.project.repoOwner}" target="_blank">${issue.project.repoOwner}</a>
                          / <a href="${issue.project.repo}" target="_blank">${issue.project.repoName}</a>
                        </span>
                        : <a href="${issue.url}" target="_blank">${issue.title}</a>
                      </li>
                  `)}
                </ul>
              </div>
            `)}
          </section>

          <section class="users-list">
            <h1>Top Contributors</h1>
            <ul>
              ${Object.entries(userActivity).map(([user, count]) => html`
                <li><a href="https://www.github.com/${user}" target="_blank">@${user}</a>: ${count} contribution</li>
              `)}
            </ul>
          </section>
        </main>
      </statusboard-page>
    `, document.body)
  })
  .get('/projects', async () => {
    const projects = await (await fetch(`${config.baseUrl}data/projects.json`)).json()
    render(html`
      <statusboard-page .config="${config}">
        <statusboard-project-list .projects=${projects} .config="${config}" />
      </statusboard-page>
    `, document.body)
  })
  .get('/issues', async () => {
    const taggedIssues = await (await fetch(`${config.baseUrl}data/labeledIssues.json`)).json()
    const userActivity = await (await fetch(`${config.baseUrl}data/userActivity.json`)).json()

    render(html`
      <statusboard-page .config="${config}">
        <h1>Issues</h1>
        <main>
          ${Object.entries(taggedIssues).map(([tag, issues]) => html`
            <section>
              <h1><a href="${config.baseUrl}issues/${tag}">${tag}</a></h1>

              <div class="issues-list">
                <ul>
                  ${issues.map((issue) => html`
                      <li>
                        <span class="project-link">
                          <a href="https://www.github.com/${issue.project.repoOwner}" target="_blank">${issue.project.repoOwner}</a>
                          / <a href="${issue.project.repo}" target="_blank">${issue.project.repoName}</a>
                        </span>
                        : <a href="${issue.url}" target="_blank">${issue.title}</a>
                      </li>
                  `)}
                </ul>
              </div>
            </section>
          `)}
        </main>
      </statusboard-page>
    `, document.body)
  })
  .get('/issues/:label', async (req, res) => {
    render(html`
      <statusboard-page .config="${config}">
        <h1>Issues: ${req.params.label}</h1>
      </statusboard-page>
    `, document.body)
  })
  .listen()
