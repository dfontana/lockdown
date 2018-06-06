/**
 * Provides backfills for versions of node (like LTS 8)
 * that do not have the experiemental promise API for FS.
 * Only exposes the necessary operations in this package.
 */
const { promisify } = require ('util')
let fs = require('fs').promises

if(fs === undefined) {
  fs = require('fs')
  
  // Backfill needed operations
  fs.stat = promisify(fs.stat)
  fs.readdir = promisify(fs.readdir)
  fs.writeFile = promisify(fs.writeFile)
  fs.readFile = promisify(fs.readFile)
  fs.unlink = promisify(fs.unlink)
}

module.exports = {
  stat: fs.stat,
  readdir: fs.readdir,
  writeFile: fs.writeFile,
  readFile: fs.readFile,
  unlink: fs.unlink,
}