import fs from './filesystem'
import Chalk from 'chalk'
import * as path from 'path'
import {encrypt, decrypt} from './encryption'
import ProgressBar from './progress'

const FILETYPE = '.cpt'

/**
 * Obtains a list of files found in the tree starting at dir. Files are only
 * returned if they meet the encrypting/decrypting criteria.
 * @param dir File to encrypt (can be a file or directory)
 * @param encrypting Whether we are encrypting or decrypting
 */
async function getFiles(dir: string, encrypting: boolean) {
  if(!path.isAbsolute(dir)) {
    dir = path.join(process.cwd(), dir)
  }
  return await walkDir(dir, encrypting, []);
}

/**
 * Walks the given path recursively adding files to the given array.
 * If encrypting is true, then only files of type FILETYPE are added to this
 * array, otherwise only files not of FILETYPE are added.
 * @param fpath Path being walked
 * @param encrypting Whether we should be grabbing only encrypted 
 *  or non-encrypted files
 * @param acc Array to add found file paths to.
 */
async function walkDir(fpath: string, encrypting: boolean, acc: string[]): Promise<string[]> {
  let stats = await fs.stat(fpath)
  if(stats.isDirectory()) {
    // Path is a directory, explore its contents
    let files = await fs.readdir(fpath)
    for(let i = 0; i < files.length; i++) {
      let f = path.join(fpath, files[i])
      acc = await walkDir(f, encrypting, acc)
    }
  }else{
    // Path is a file, determine if it should be added to list
    let hidden = (/((^|\/)\.\w+$)/g).test(fpath)
    let isFILETYPE = path.extname(fpath) === FILETYPE
    let shouldDecrypt = (!encrypting && isFILETYPE && !hidden)
    let shouldEncrypt = (encrypting && !isFILETYPE && !hidden)
    if(shouldDecrypt || shouldEncrypt){
      acc.push(fpath)
    }
  }
  return acc;
}


/**
 * Reads the given file, performing the given operation, and then replacing that
 * file on disk with the transformed file.
 * @param f Path to file on disk
 * @param op Operation ot perform on the read buffer, before write
 * @param update Function to call after overwrite is complete
 */
function transformFile(f: string, op: Function, update: Function): Promise<void> {
  return fs.readFile(f)
    .then(buff => op(buff, f))
    .then(args => fs.writeFile(...args))
    .then(() => fs.unlink(f))
    .then(update)
}

function cipherDir(encrypting: boolean, op: Function): Function {
  return async function(dir, passwd) {

    // Status Bar
    const Bar = new ProgressBar();
    let text = `   ${ encrypting ? 'Encrypting' : 'Decrypting'}`

    // Ciphering files
    try {
      const files = await getFiles(dir, encrypting)
      if(files.length === 0) {
        throw `   No files to ${text.slice(3,10)}`
      }
      Bar.init(files.length, Chalk.cyan(text));
      await Promise.all(files.map(f => {
        return transformFile(f, op(passwd), async ()=>Bar.add(1))
      }))
    } catch(err) {
      console.error("   "+Chalk.red(err))
    }
  }
}

export const encryptDir = cipherDir(true, (passwd) => function(buff, f) {
  return [f + FILETYPE, encrypt(buff, passwd)]
})

export const decryptDir = cipherDir(false, (passwd) => function(buff, f) {
  return [f.slice(0, -4), decrypt(buff, passwd)]
})