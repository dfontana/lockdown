const fs = require('./filesystem')
const chalk = require('chalk')
const path = require('path')
const Crypt = require('./encryption')
const ProgressBar = require('./progress')

const FILETYPE = '.cpt'

/**
 * Walks the given directory recursively adding file paths to the given array.
 * If encrypting is true, then only files of type FILETYPE are added to this
 * array, otherwise only files not of FILETYPE are added.
 * @param {String} dir Path to directory being walked
 * @param {Boolean} encrypting Whether we should be grabbing only encrypted 
 *  or non-encrypted files
 * @param {Array} acc Array to add found file paths to.
 */
async function walkDir(dir, encrypting, acc) {
  // Stat dir. If its a file, push and return. Else continue.
  // const stats = await fs.stat(dir);
  // if(!stats.isDirectory()) {
  //   acc.push(dir)
  //   return;
  // }

  // Get files that are not hidden and fulfuill encrypting requirement
  let files = await fs.readdir(dir)
  files = files.map(f => path.join(dir, f))
  files = files.filter(async item => {
    let hidden = (/((^|\/)\.\w+$)/g).test(item)
    let isFILETYPE = path.extname(item) === FILETYPE
    let stats = await fs.stat(item)
    if(stats.isDirectory()) { return true; }
    return encrypting ? (!isFILETYPE && !hidden) : (isFILETYPE && !hidden)
  });

  // Explore each file in current directory
  for(let i = 0; i<files.length; i++) {
    // const next = path.join(dir, files[i]);
    // acc.push(walkDir(next, encrypting, acc));
    const stats = await fs.stat(files[i]);
    if(stats.isDirectory()) {
      acc = await walkDir(files[i], encrypting, acc);
    } else {
      acc.push(files[i])
    }
  }
  return acc;
}

/**
 * Reads the given file, performing the given operation, and then replacing that
 * file on disk with the transformed file.
 * @param {String} f Path to file on disk
 * @param {Function} op Operation ot perform on the read buffer, before write
 * @param {Function} update Function to call after overwrite is complete
 */
async function transformFile(f, op, update) {
  fs.readFile(f)
    .then(buff => op(buff, f))
    .then(args => fs.writeFile(...args))
    .then(() => fs.unlink(f))
    .then(update)
}

async function getFiles(dir, encrypting) {
  if(!path.isAbsolute(dir)) {
    dir = path.join(process.cwd(), dir)
  }
  const stats = await fs.stat(dir)
  if (stats.isDirectory()){
    return await walkDir(dir, encrypting, [])
  }else{
    return [dir];
  }
}

function cipherDir(op) {
  return async function(dir, passwd) {
    const ENCRYPTING = op.name === 'encryptOp';

    // Status Bar
    const Bar = new ProgressBar();
    let totalProgress = 0;
    async function update(){
      Bar.update(++totalProgress);
    }
    let text = `   ${ ENCRYPTING ? 'Encrypting' : 'Decrypting'}`

    // Ciphering files
    try {
      const files = await getFiles(dir, ENCRYPTING)
      if(files.length === 0) {
        throw `No files to ${op.name.slice(0,7)}`
      }
      Bar.init(files.length, chalk.cyan(text));
      await Promise.all(files.map(f => {
        return transformFile(f, op(passwd), update)
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