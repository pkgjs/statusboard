'use strict'
/* eslint-env browser */
const { LitElement, html } = require('es5-lit-element')

class ProjectList extends LitElement {
  static get properties () {
    return {
      config: { type: Object },
      projects: { type: Object }
    }
  }

  render () {
    return html`
      <link rel="stylesheet" href="${this.config.files.css.projectList}" />
      <main>
        <h2>Projects</h2>
          <table class="project-list">
          ${this.projects.map((project) => html`
            <tr>
              <td>
                <a href="https://www.github.com/${project.repoOwner}" target="_blank">${project.repoOwner}</a>
                / <a href="${(project.repoDetails && project.repoDetails.url) || `https://www.github.com/${project.repoOwner}/${project.repoName}`}" target="_blank">${project.repoName}</a>
              </td>
              <td title="Stars">
                <a href="https://npmjs.org/package/${project.packageName}">
                  <img src="https://badgen.net/github/stars/${project.repo}?color=yellow" />
                </a>
              </td>
              <td title="Watchers">
                <a href="https://www.github.com/${project.repo}">
                  <img src="https://badgen.net/github/watchers/${project.repo}" />
                </a>
              </td>
              <td title="Issues">
                <a href="https://www.github.com/${project.repo}">
                  <img src="https://badgen.net/github/open-issues/${project.repo}" />
                </a>
              </td>
              <td title="PRs">
                <a href="https://www.github.com/${project.repo}">
                  <img src="https://badgen.net/github/open-prs/${project.repo}" />
                </a>
              </td>
              <td title="commits">
                <a href="https://www.github.com/${project.repo}">
                  <img src="https://badgen.net/github/commits/${project.repo}" />
                </a>
              </td>
              <td title="License">
                <a href="https://www.github.com/${project.repo}">
                  <img src="https://badgen.net/github/license/${project.repo}" />
                </a>
              </td>
              <td title="Contributors">
                <a href="https://www.github.com/${project.repo}">
                  <img src="https://badgen.net/github/contributors/${project.repo}" />
                </a>
              </td>
              <td>
                ${project.packageJson && (html`
                  <a href="https://npmjs.org/package/${project.packageName}">
                    <img src="https://badgen.net/npm/v/${project.packageName}" />
                  </a>
                `)}
              </td>
              <td>
                ${project.packageJson && (html`
                  <a href="https://npmjs.org/package/${project.packageName}">
                    <img src="https://badgen.net/npm/dm/${project.packageName}" />
                  </a>
                `)}
              </td>
            </tr>
          `)}
        </table>
      </main>
    `
  }
}
customElements.define('statusboard-project-list', ProjectList)
