'use strict'
const path = require('path')
const fs = require('fs-extra')
const cptmpl = require('cptmpl')
const buildjs = require('@wesleytodd/buildjs')
const buildcss = require('@wesleytodd/buildcss')
const octicons = require('@primer/octicons')

module.exports = async function (config, data) {
  const tmplDir = path.join(__dirname, '..', '..', 'template')
  const outDir = path.resolve(config.outputDirectory)

  const files = await Promise.all([
    buildData(outDir, data, config),
    buildIcons(outDir, config),
    buildJs(outDir, tmplDir, config),
    buildCss(outDir, tmplDir, config)
  ])

  await buildTemplates(outDir, tmplDir, config, {
    data: files[0],
    icons: files[1],
    js: {
      index: files[2][0]
    },
    css: {
      index: files[3][0],
      page: files[3][1],
      projectList: files[3][2]
    }
  })
}

// Output data files
function buildData (outDir, data, config) {
  return Promise.all(Object.entries(data).map(async ([name, data]) => {
    const outPath = path.join(outDir, 'data', `${name}.json`)
    await fs.outputJSON(outPath, data)
    return `${config.baseUrl}${path.relative(outDir, outPath)}`
  }))
}

// Output SVG Icons
const ICONS = ['eye', 'star', 'repo-forked', 'issue-opened']
function buildIcons (outDir, config) {
  return Promise.all(ICONS.map(async (icon) => {
    const outPath = path.join(outDir, 'icons', `${icon}.svg`)
    const svg = octicons[icon].toSVG({
      xmlns: 'http://www.w3.org/2000/svg'
    })
    await fs.outputFile(outPath, svg)
    return `${config.baseUrl}${path.relative(outDir, outPath)}`
  }))
}

const JS = ['index']
function buildJs (outDir, tmplDir, config) {
  return Promise.all(JS.map(async (file) => {
    const outPath = await buildjs({
      basedir: tmplDir,
      entries: [path.join(tmplDir, 'js', `${file}.js`)],
      outputdir: path.relative(tmplDir, path.join(outDir, 'js')),
      babelify: false
    })
    return `${config.baseUrl}${path.relative(outDir, outPath)}`
  }))
}

const CSS = ['index', 'page', 'project-list']
function buildCss (outDir, tmplDir, config) {
  return Promise.all(CSS.map(async (file) => {
    const outPath = await buildcss({
      basedir: tmplDir,
      srcfile: path.join('css', `${file}.css`),
      outputdir: path.join(outDir, 'css'),
      outputFilename: `${file}-{{hash}}.css`,
      outputMapFilename: `${file}-{{hash}}.css.map`
    })
    return `${config.baseUrl}${path.relative(outDir, outPath)}`
  }))
}

const TEMPLATES = ['index', '404']
function buildTemplates (outDir, tmplDir, config, files) {
  return Promise.all(TEMPLATES.map((file) => {
    const tmplFile = path.join(tmplDir, `${file}.html`)
    const outFile = path.join(outDir, `${file}.html`)
    const data = {
      ...config,
      files
    }
    return cptmpl(tmplFile, outFile, data, {
      force: true
    })
  }))
}
