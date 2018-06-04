const crypto = require('crypto')
const fs = require('fs').promises
const path = require('path')
const ALG = 'aes-256-gcm',
  config = {
    hashB: 32,
    saltB: 16,
    ivB: 16,
    tagB: 16, //Known, not configured
    iter: 750000
  };

function hash(password, slt) {
  const salt = slt ? slt : crypto.randomBytes(config.saltB);
  const hash = crypto.pbkdf2Sync(password, salt, config.iter, config.hashB, 'sha512')
  return Buffer.concat([salt, hash])
}

function encrypt(text, passwd) {
  // Hash the passwd and grab the salt that was generated to store with the file.
  const hashed = hash(passwd) //TODO this is a buffer, ensure thats ok
  const key = hashed.slice(config.saltB);
  const salt = hashed.slice(0, config.saltB);

  // Generate an IV and encrypt using hashed password as key.
  const iv = crypto.randomBytes(config.ivB)
  const cipher = crypto.createCipheriv(ALG, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}


function decrypt(encrypted, passwd) {
  //TODO https://gist.github.com/AndiDittrich/4629e7db04819244e843
  const file = Buffer.from(encrypted, 'base64')

  const salt = file.slice(0, config.saltB);
  const iv = file.slice(config.saltB, config.saltB+config.ivB);
  const tag = file.slice(config.saltB+config.ivB, config.saltB+config.ivB+config.tagB);
  const contents = file.slice(config.saltB+config.ivB+config.tagB);

  // Hash the passwd, but use the file's salt
  const hashed = hash(passwd, salt)
  const key = hashed.slice(config.saltB)

  // Using the given information, decrypt the file.
  const decipher = crypto.createDecipheriv(ALG, key, iv)
  decipher.setAuthTag(tag);
  return decipher.update(contents, 'binary', 'utf8') + decipher.final('utf8');
}

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
      let encryption = encrypt(buff, process.argv[3])
      console.log(encryption)
      let decryption = decrypt(encryption, process.argv[3])
      console.log(decryption)
    });
}

walkDir(process.argv[2], test)