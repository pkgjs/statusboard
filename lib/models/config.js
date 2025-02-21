const { Label } = require('./label')
const { Organization } = require('./organization')
const { Person } = require('./person')
const { Project } = require('./project')
const builder = require('../template/builder')
const indicies = require('../../template/indicies')

const DEFAULTS = {
  db: 'data.db',
  outputDirectory: 'build',
  baseUrl: '',
  port: 5005,
  template: builder,
  indicies,
  title: 'StatusBoard',
  description: 'Project StatusBoard',
  issueLabels: ['top priority', 'good first issue', 'help wanted', 'discussion', 'meeting']
}

module.exports.defaults = DEFAULTS

module.exports.Config = class Config {
  constructor (opts = {}) {
    // StatusBoard build/index configuration
    this.db = opts.db || DEFAULTS.db
    this.outputDirectory = opts.outputDirectory || DEFAULTS.outputDirectory
    this.baseUrl = opts.baseUrl || DEFAULTS.baseUrl
    this.port = opts.port || DEFAULTS.port
    this.indicies = opts.indicies || DEFAULTS.indicies
    this.template = opts.template || DEFAULTS.template

    // Service auth/options
    this.github = opts.github || false

    // All the dynamic stuff for a project
    this.title = opts.title || DEFAULTS.title
    this.description = opts.description || DEFAULTS.description

    // Orgs
    this.orgs = (opts.orgs || [])
      .map((org) => new Organization(org))

    // Projects
    this.projects = (opts.projects || [])
      .map((proj) => new Project(proj))

    // Issue/PR Labels
    this.issueLabels = (opts.issueLabels || DEFAULTS.issueLabels)
      .map((label) => new Label(label))

    // People
    this.people = (opts.people || [])
      .map((person) => new Person(person))
  }
}
