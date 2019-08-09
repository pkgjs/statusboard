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
      <h2>Projects</h2>
      <table class="project-list">
        ${this.projects.map((project) => html`
          <tr>
            <td>
              <a href="https://www.github.com/${project.repoOwner}" target="_blank">${project.repoOwner}</a>
              / <a href="${project.repoDetails.url}" target="_blank">${project.repoName}</a>
            </td>
            <td title="Stars">
              ${project.stars || '0'}
              <img class="octicon" src="${this.config.baseUrl}icons/star.svg">
            </td>
            <td title="Watchers">
              ${project.watchers || '0'}
              <img class="octicon" src="${this.config.baseUrl}icons/eye.svg">
            </td>
            <td title="Open Issues">
              ${project.openIssues || '0'}
              <img class="octicon" src="${this.config.baseUrl}icons/issue-opened.svg">
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
            <td>
              ${project.travis && (html`
                <a href="https://travis-ci.org/${project.owner}/${project.name}">
                  <img src="https://badgen.net/travis/${project.owner}/${project.name}" />
                </a>
              `)}
            </td>
          </tr>
        `)}
      </table>
    `
  }
}
customElements.define('statusboard-project-list', ProjectList)
