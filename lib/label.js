'use strict'

module.exports.Label = class Label {
  constructor (label = {}) {
    this.name = typeof label === 'string' ? label : label.name
    this.description = label.description
    this.color = label.color
  }
}
