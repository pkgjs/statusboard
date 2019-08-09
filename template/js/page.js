'use strict'
/* eslint-env browser */
const { LitElement, html } = require('es5-lit-element')

class Page extends LitElement {
  static get properties () {
    return {
      config: { type: Object }
    }
  }
  render () {
    return html`
      <link rel="stylesheet" href="${this.config.files.css.page}" />
      <header class="page-header">
        <h1 class="logo">
          <a href="${this.config.baseUrl}" title="${this.config.title}">${this.config.title}</a>
          <!-- <span class="description">${this.description}</span> -->
        </h1>

        <nav>
          <a href="${this.config.baseUrl}" title="Home">Home</a>
          <a href="${this.config.baseUrl}projects" title="Projects">Projects</a>
          <a href="${this.config.baseUrl}issues" title="Issues">Issues</a>
        </nav>

        <a class="statusboard" title="About @pkgjs/statusboard" href="https://github.com/pkgjs/statusboard" target="_blank">@pkgjs/statusboard</a>
      </header>
      <main class="main-content">
        <slot></slot>
      </main>
      <footer class="page-fotter">
      </footer>
    `
  }
}
customElements.define('statusboard-page', Page)
