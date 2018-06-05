const fs = require('fs').promises
const path = require('path')
const Crypt = require('./authcrypt')

let walkDir = async (dir, cb) => {
  if(!path.isAbsolute(dir)) {
    dir = path.join(__dirname, dir)
  }
  let files = await fs.readdir(dir);
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
        buff = buff.toString('utf8')
        const file = Crypt.decrypt(buff, process.argv[3])
        fs.writeFile(f.slice(0, -4), file);
        fs.unlink(f);
      }else{
        const file = Crypt.encrypt(buff, process.argv[3])
        fs.writeFile(f + '.cpt', file);
        fs.unlink(f);
      }
    });
}

walkDir(process.argv[2], toggleFile)