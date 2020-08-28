# A Project Status Board

A WIP attempt to centralize all the work being done in a community
of GitHub projects.  When you have work spread across multiple repos
and multiple orginizations, it is often hard to track things.  This
is what `@pkgjs/statusboard` aims to solve.

This repository is managed by the [Package Maintenance Working Group](https://github.com/nodejs/package-maintenance), see [Governance](https://github.com/nodejs/package-maintenance/blob/master/Governance.md).


## Example

https://expressjs.github.io/statusboard/

## TODO

- Cli logger
- ~~Pull commit activity~~
- ~~Clean up template~~
- `create` command to setup a new project
- ~~GH actions for building/publishing ([see express](https://github.com/expressjs/statusboard/blob/1de8da96746deb1952ecc0c22427f81083e022c9/.github/workflows/build.yml))~~ https://github.com/pkgjs/gh-pages
- Contribution graph like on github
- Meetings page (pull tag "meeting")
- ~~Orginizations (pull all repos from an org)~~
- Typescript support (load typings or if authored in TS)
- People/Teams (specify and display teams, for example the express TC)
- GH CI status
- Pinned projects

## Setup

WARNING: work in process, the following doesn't work yet, but soon!

The easiest way to create a status board for your project is using Github Pages.  To get started, create a new repo for your project and clone it
to your development machine.  In the new directory run the following:

```
# Creates a statusboard project
# @TODO make this command actually work as it does not right now
$ npx @pkgjs/statusboard create

# Setup your config in `index.js
# Then commit your work
$ git commit -am "statusboard setup"

# Create an orphan branch for our builds
$ git checkout --orphan gh-pages

# Remove the files we dont need here
$ git rm -rf .

# Create a .nojekyll file, this turns off pesky github pages stuff
$ touch .nojekyll
$ git commit --am "github pages initial commit"

# Now we setup the branch as a working tree on the master branch
$ git checkout master
$ mkdir build
$ git worktree add build gh-pages

# Now we can run the index and build
$ npm run build

# Now we should have a site in ./build, we can
# commit and push the branches now
$ cd build && git add . && git commit -m "our new statuspage" && git push
```
