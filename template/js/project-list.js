'use strict'
/* eslint-env browser */
const { LitElement, html } = require('es5-lit-element')

class ProjectList extends LitElement {
  static get properties () {
    return {
      cssFile: { type: String },
      projects: { type: Object }
    }
  }
  render () {
    return html`
      <link rel="stylesheet" href="${this.cssFile}" />
      <h2>Projects</h2>
      <table class="project-list">
        ${this.projects.map((project) => html`
          <tr>
            <td>
              <a href="${project.homepage || project.url}">${project.packageName}</a>
            </td>
            <td title="Stars">
              ${project.stars}
              <img class="octicon" src="/icons/star.svg">
            </td>
            <td title="Watchers">
              ${project.watchers}
              <img class="octicon" src="/icons/eye.svg">
            </td>
            <td title="Open Issues">
              ${project.openIssues}
              <img class="octicon" src="/icons/issue-opened.svg">
            </td>
            <td>
              <a href="https://npmjs.org/package/${project.packageName}">
                <img src="https://badgen.net/npm/v/${project.packageName}" />
              </a>
            </td>
            <td>
              <a href="https://npmjs.org/package/${project.packageName}">
                <img src="https://badgen.net/npm/dm/${project.packageName}" />
              </a>
            </td>
            <td>
              <a href="https://travis-ci.org/${project.owner}/${project.name}">
                <img src="https://badgen.net/travis/${project.owner}/${project.name}" />
              </a>
            </td>
          </tr>
        `)}
      </table>
    `
  }
}
customElements.define('statusboard-project-list', ProjectList)
