# A Project Status Board

A WIP attempt to centralize all the work being done in a community
of GitHub projects.  When you have work spread across multiple repos
and multiple orginizations, it is often hard to track things.  This
is what `@pkgjs/statusboard` aims to solve.

This repository is managed by the [Package Maintenance Working Group](https://github.com/nodejs/package-maintenance), see [Governance](https://github.com/nodejs/package-maintenance/blob/master/Governance.md).


## Example

Example statusboards using `@pkgjs/statusboard`:

- <https://expressjs.github.io/statusboard/> - [Github](https://github.com/expressjs/statusboard)


## Setup

Requires Node.js 22 or newer. The CLI loads `.env` from the current directory
using Node.js's native environment file support. Use `--env <path>` to load a
different file. Existing environment variables take precedence, and the file
is optional when variables are provided by the shell or CI.

Create a project interactively:

```sh
npx @pkgjs/statusboard create my-statusboard
cd my-statusboard
npm install
```

The command asks for organizations, repositories (`owner/repo`), issue labels,
and optional GitHub Actions deployment. It creates `config.js`, `package.json`,
`.gitignore`, and a local Git repository. Choose a new or empty directory;
existing project files are never overwritten.

Set `GITHUB_TOKEN` in your environment or in a local `.env` file, then run:

```sh
npm run build
```

The site is generated in `build/`. Edit `config.js` to customize the board.

If you selected GitHub Actions, push the generated project to a GitHub repository
with a `main` branch and enable **Settings → Pages → Source → GitHub Actions**.
The workflow builds and deploys the site using the repository's Pages base path.
Without Actions, set `baseUrl` in `config.js` to match your hosting path.

## TODO

- Cli logger
- Contribution graph like on github
- Meetings page (pull tag "meeting")
- Typescript support (load typings or if authored in TS)
- People/Teams (specify and display teams, for example the express TC)
- GH CI status
- Pinned projects
