'use strict'
/* eslint-env browser */
require('regenerator-runtime/runtime')
const { html } = require('es5-lit-element')
const { render } = require('es5-lit-html')
const config = window.__config || {}

// Import custom elements
require('./page')
require('./project-list')

require('nighthawk')({
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
    const taggedIssues = await (await fetch('data/taggedIssues.json')).json()
    const activity = await (await fetch('data/activityStats.json')).json()

    render(html`
      <statusboard-page title="${config.title}" description="${config.description}" cssFile="${config.css.page}">
        <style>main {display: flex;}</style>
        <main>
          <section>
            <h1>Get Involved</h1>

            ${Object.entries(taggedIssues).map(([tag, issues]) => html`
              <div>
                <h3>${tag}</h3>
                <ul>
                  ${issues.map((issue) => html`
                      <li><a href="${issue.url}">${issue.title}</a></li>
                  `)}
                </ul>
              </div>
            `)}
          </section>

          <section>
            <h1>Top Contributors</h1>
              <ul>
                ${Object.entries(activity.userActivity).map(([user, count]) => html`
                  <li>${user}: ${count} contribution</li>
                `)}
            </ul>
          </section>
        </main>
      </statusboard-page>
    `, document.body)
  })
  .get('/projects', async () => {
    const resp = await fetch('data/projects.json')
    const projects = await resp.json()

    render(html`
      <statusboard-page title="${config.title}" description="${config.description}" cssFile="${config.css.page}">
        <statusboard-project-list .projects=${projects} .cssFile="${config.css.projectList}" />
      </statusboard-page>
    `, document.body)
  })
  .listen()
