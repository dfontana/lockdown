const fs = require('fs').promises
const path = require('path')
const Crypt = require('./authcrypt')
const ProgressBar = require('./progress')

// Accumulates all non-hidden file paths from a directory
async function walkDir(dir, acc) {
  let files = await fs.readdir(dir)

  // Remove hidden files
  files = files.filter(item => !(/((^|\/)\.\w+$)/g).test(item));

  for(let i = 0; i<files.length; i++) {
    const next = path.join(dir, files[i]);
    const stats = await fs.stat(next);
    if(stats.isDirectory()) {
      acc.push(walkDir(next, acc));
    } else {
      acc.push(next)
    }
  }

  return acc;
}

async function toggleFile(f, passwd, update) {
  const unlock = path.extname(f) === '.cpt' ? true : false;
  let file = null;
  fs.readFile(f)
    .then(buff => {
      if(unlock){
        file = Crypt.decrypt(buff, passwd)
        return f.slice(0, -4);
      }else{
        file = Crypt.encrypt(buff, passwd)
        return f + '.cpt'
      }
    })
    .then(filename => fs.writeFile(filename, file))
    .then(() => fs.unlink(f))
    .then(update)
}

async function run(dir, direction) {
  // Fix path from relative to abs.
  if(!path.isAbsolute(dir)) {
    dir = path.join(process.cwd(), dir)
  }

  // Gather list of files to encrypt
  const stats = await fs.stat(dir)
  const files = stats.isDirectory() ? await walkDir(dir, []) : [dir];

  // Setup progress bar
  const Bar = new ProgressBar();
  let totalProgress = 0;
  let text = 'Encrypting...'
  Bar.init(files.length, text);
  function update() {
    Bar.update(++totalProgress);
  }

  // Hash the password once & pass to cb
  const passwd = 

  // Operate on all your promises.
  await Promise.all(files.map(f => cb(f, passwd, update)))
}

async function validateInput() {
  if(process.arg)
  process.argv[2], process.argv[]
}

validateInput()
  .then(run)
  .catch(console.error)
run()
  .catch(console.error)