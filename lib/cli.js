'use strict'
const yargs = require('yargs/yargs')
const dotenv = require('dotenv')
const path = require('path')

const SHARED_OPTIONS = {
  db: {
    alias: 'd',
    description: 'Path to database',
    type: 'string'
  },
  baseUrl: {
    alias: 'b',
    description: 'Set a base url where the content will be served',
    type: 'string'
  },
  output: {
    alias: 'o',
    description: 'Output directory',
    type: 'string'
  },
  env: {
    alias: 'e',
    description: 'Load .env file',
    default: '.env',
    type: 'string'
  },
  config: {
    alias: 'C',
    description: 'Path to a config file',
    type: 'string'
  }
}

function createBoard (create, argv) {
  if (argv.env) {
    dotenv.config(argv.env || '.env')
  }

  const opts = {}

  // If config file, load it
  if (argv.config) {
    Object.assign(opts, require(path.resolve(argv.config)))
  }

  let github
  if (process.env.GITHUB_TOKEN) {
    github = {
      token: process.env.GITHUB_TOKEN
    }
  } else if (process.env.GITHUB_USER && process.env.GITHUB_PASS) {
    github = {
      username: process.env.GITHUB_USER,
      password: process.env.GITHUB_PASS,
      tfatoken: process.env.GITHUB_2FA
    }
  }
  opts.github = github

  if (argv.db) {
    opts.db = argv.db
  }

  if (argv.baseUrl) {
    opts.baseUrl = argv.baseUrl
  }

  if (argv.output) {
    opts.outputDirectory = argv.output
  }

  return create(opts)
}

module.exports = (create, builder, argv) => {
  if (Array.isArray(builder)) {
    argv = builder
    builder = null
  }

  let cli = yargs()

    .command('create', 'Create a StatusBoard', {}, async (argv) => {
      console.log('Coming soon!')
    })

    .command('build', 'Index and build board', SHARED_OPTIONS, async (argv) => {
      // Create the statusboard instance
      const board = await createBoard(create, argv)

      // Build out the index
      await board.buildIndex()

      // Write out the template
      await board.buildSite()
    })

    .command('index', 'Index projects', SHARED_OPTIONS, async (argv) => {
      // Create the statusboard instance
      const board = await createBoard(create, argv)

      // Build out the index
      await board.buildIndex()
    })

    .command('site', 'Builds site from existing database', SHARED_OPTIONS, async (argv) => {
      // Create the statusboard instance
      const board = await createBoard(create, argv)

      // Build out the index
      await board.buildSite()
    })

    .command('serve', 'Serve the statusboard site', Object.assign(SHARED_OPTIONS, {
      port: {
        description: 'Port to serve site on',
        default: 5005,
        type: 'number'
      },
      watch: {
        description: 'Build and watch files',
        default: false,
        type: 'boolean'
      }
    }), async (argv) => {
      // Create the statusboard instance
      const board = await createBoard(create, argv)
      if (argv.watch) {
        await board.buildSite()
      }

      board.serve()
    })

    .command('clean', 'Cleans up database', SHARED_OPTIONS, async (argv) => {
      // Create the statusboard instance
      const board = await createBoard(create, argv)

      for await (const { key, value: item } of board.db.createReadStream()) {
        let present = false
        board.config.projects.forEach((p) => {
          present = present || item.project.repo === p.repo
        })
        !present && board.config.orgs.forEach((o) => {
          present = present || item.project.repoOwner === o.name
        })
        if (!present) {
          console.log(key)
          await board.db.del(key)
        }
      }
    })
    .help()

  // Extend or override with builder
  if (typeof builder === 'function') {
    cli = builder(cli)
  }

  // Only parse if we are passed args
  if (argv) {
    return cli.parse(argv)
  }

  return cli
}
