const fs = require('fs').promises
const chalk = require('chalk')
const path = require('path')
const Crypt = require('./authcrypt')
const ProgressBar = require('./progress')

const FILETYPE = '.cpt'

// Accumulates all non-hidden file paths from a directory
async function walkDir(dir, encrypting, acc) {
  let files = await fs.readdir(dir)

  // Filter out hidden files and those not for optype
  files = files.filter(item => {
    let hidden = (/((^|\/)\.\w+$)/g).test(item)
    let isFILETYPE = path.extname(item) === FILETYPE
    return encrypting ? (!isFILETYPE && !hidden) : (isFILETYPE && !hidden)
  });

  for(let i = 0; i<files.length; i++) {
    const next = path.join(dir, files[i]);
    const stats = await fs.stat(next);
    if(stats.isDirectory()) {
      acc.push(walkDir(next, encrypting, acc));
    } else {
      acc.push(next)
    }
  }

  return acc;
}

async function overwriteFile(f, op, update) {
  fs.readFile(f)
    .then(buff => op(buff, f))
    .then(args => fs.writeFile(...args))
    .then(() => fs.unlink(f))
    .then(update)
}

async function getFiles(dir, encrypting) {
  // Fix path from relative to abs.
  if(!path.isAbsolute(dir)) {
    dir = path.join(process.cwd(), dir)
  }

  // Gather list of files to encrypt
  const stats = await fs.stat(dir)
  return stats.isDirectory() ? await walkDir(dir, encrypting, []) : [dir];
}

function cipherDir(op) {
  return async function(dir, passwd) {
    const ENCRYPTING = op.name === 'encryptOp';
    const Bar = new ProgressBar();
    let totalProgress = 0;
    async function update(){
      Bar.update(++totalProgress);
    }
    let text = `   ${ ENCRYPTING ? 'Encrypting' : 'Decrypting'}`

    try {
      const files = await getFiles(dir, ENCRYPTING)
      if(files.length === 0) {
        throw `No files to ${op.name.slice(0,7)}`
      }
      Bar.init(files.length, chalk.cyan(text));
      await Promise.all(files.map(f => {
        return overwriteFile(f, op(passwd), update)
      }))
    } catch(err) {
      console.error(chalk.red(err))
    }
  }
}

function encryptOp(passwd) {
  return async function(buff, f) {
    return [f + FILETYPE, Crypt.encrypt(buff, passwd)]
  }
}

function decryptOp(passwd) {
  return async function(buff, f) {
    return [f.slice(0, -4), Crypt.decrypt(buff, passwd)]
  }
}

module.exports = { 
  encryptDir: cipherDir(encryptOp),
  decryptDir: cipherDir(decryptOp)
}