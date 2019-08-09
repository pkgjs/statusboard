'use strict'

module.exports.Person = class Person {
  constructor (person = {}) {
    this.name = typeof person === 'string' ? person : person.name
    this.description = person.description
    this.email = person.email
    this.website = person.website
    this.npmUsername = person.npmUsername
    this.githubUsername = person.githubUsername
    this.twitterUsername = person.twitterUsername
  }
}
