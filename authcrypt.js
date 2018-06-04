// Assistance from: https://gist.github.com/AndiDittrich/4629e7db04819244e843
const crypto = require('crypto')
const cfg = {
  hashB: 32,
  saltB: 16,
  ivB: 16,
  tagB: 16, //Known, not cfgured
  alg: 'aes-256-gcm',
  iter: 750000
}

function hash(password, slt) {
  const salt = slt ? slt : crypto.randomBytes(cfg.saltB)
  const hash = crypto.pbkdf2Sync(password, salt, cfg.iter, cfg.hashB, 'sha512')
  return Buffer.concat([salt, hash])
}

module.exports = {
  encrypt: (text, passwd) => {
    // Hash, splitting salt and key.
    const hashed = hash(passwd)
    const salt = hashed.slice(0, cfg.saltB)
    const key = hashed.slice(cfg.saltB)
  
    // Generate an IV and encrypt using hashed password as key.
    const iv = crypto.randomBytes(cfg.ivB)
    const cipher = crypto.createCipheriv(cfg.alg, key, iv)
    const coded = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return Buffer.concat([salt, iv, tag, coded]).toString('base64')
  },

  decrypt: (encrypted, passwd) => {
    const file = Buffer.from(encrypted, 'base64')
    
    // Break buffer into parts
    const salt = file.slice(0, cfg.saltB)
    const iv = file.slice(cfg.saltB, cfg.saltB+cfg.ivB)
    const tag = file.slice(cfg.saltB+cfg.ivB, cfg.saltB+cfg.ivB+cfg.tagB)
    const contents = file.slice(cfg.saltB+cfg.ivB+cfg.tagB)
  
    // Hash the passwd, but use the file's salt
    const hashed = hash(passwd, salt)
    const key = hashed.slice(cfg.saltB)
  
    // Using the given information, decrypt the buffer.
    const decipher = crypto.createDecipheriv(cfg.alg, key, iv)
    decipher.setAuthTag(tag)
    return decipher.update(contents, 'binary', 'utf8') + decipher.final('utf8')
  }
}