'use strict'
/* eslint-env browser */
const { LitElement, html } = require('es5-lit-element')

class Page extends LitElement {
  static get properties () {
    return {
      title: { type: String },
      discription: { type: String },
      cssFile: { type: String }
    }
  }
  render () {
    return html`
      <link rel="stylesheet" href="${this.cssFile}" />
      <header class="page-header">
        <h1 class="logo">
          <a href="/" title="${this.title}">${this.title}</a>
          <span class="description">${this.description}</span>
        </h1>

        <nav>
          <a href="/projects">Projects</a>
        </nav>
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
