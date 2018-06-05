var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = '3zTvzr3p67VC61jmV54rIYu1545x4TlY', //32
    iv = crypto.randomBytes(16),
    fs = require('fs'),
    Readable = require('stream').Readable

var s = new Readable
    s.push('beep')
    s.push(null)  

var encrypt = crypto.createCipheriv(algorithm, password, iv);
var decrypt = crypto.createDecipheriv(algorithm, password, iv)

s.pipe(encrypt)
//  .pipe(process.stdout)
 .pipe(decrypt)
 .pipe(process.stdout)