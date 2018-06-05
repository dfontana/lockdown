const fs = require('fs').promises
const path = require('path')
const Crypt = require('./authcrypt')

let walkDir = async (dir, cb) => {
  let files = await fs.readdir(dir);
  // Remove hidden files
  files = files.filter(item => !(/((^|\/)\.\w+$)/g).test(item));
  files.map(async f => {
    let next = path.join(dir, f);
    let stats = await fs.stat(next);
    if(stats.isDirectory()) {
      walkDir(next, cb);
    } else {
      cb(next);
    }
  })
}

function toggleFile(f) {
  const unlock = path.extname(f) === '.cpt' ? true : false;
  fs.readFile(f)
    .then(buff => {
      if(unlock){
        const file = Crypt.decrypt(buff, process.argv[3])
        fs.writeFile(f.slice(0, -4), file);
        fs.unlink(f);
      }else{
        const file = Crypt.encrypt(buff, process.argv[3])
        fs.writeFile(f + '.cpt', file);
        fs.unlink(f);
      }
    })
}

let run = async (dir, cb) => {
  // Fix path from relative to abs.
  if(!path.isAbsolute(dir)) {
    dir = path.join(process.cwd(), dir)
  }

  // Check if the path is a file or directory
  let stats = await fs.stat(dir);
  if(!stats.isDirectory()) {
    cb(dir)
  }else{
    walkDir(dir, cb)
  }
}

run(process.argv[2], toggleFile)
  .catch(err => {
    console.error(err);
  })