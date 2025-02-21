'use strict'

module.exports.Organization = class Organization {
  constructor (org = {}) {
    this.name = typeof org === 'string' ? org : org.name
    this.displayName = org.displayName || this.name
    this.url = org.url
  }
}
