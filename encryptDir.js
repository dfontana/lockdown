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

function encryptFile(f) {
  fs.readFile(f)
    .then(buff => {
      try {
        let content = JSON.parse(buff);
        if('iv' in content && 'content' in content && 'tag' in content) {
          content.iv = Buffer.from(content.iv)
          content.tag = Buffer.from(content.tag)
          console.info(`Decrypting ${f}...`);
          try{
            let decryption = decrypt(content, hash(process.argv[3]))
            fs.writeFile(f, JSON.stringify(decryption));
          }catch(err){
            console.log(err)
          }
        }
      }catch(err) {
        console.info(`Encrypting ${f}...`);
        let encryption = encrypt(buff, hash(process.argv[3]))
        fs.writeFile(f, JSON.stringify(encryption));
      }
    });
}

function test(f) {
  fs.readFile(f)
    .then(buff => {
      let encryption = Crypt.encrypt(buff, process.argv[3])
      console.log(encryption)
      let decryption = Crypt.decrypt(encryption, process.argv[3])
      console.log(decryption)
    });
}

walkDir(process.argv[2], test)