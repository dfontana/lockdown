"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const cfg = {
    hashB: 32,
    saltB: 16,
    ivB: 16,
    tagB: 16,
    alg: 'aes-256-gcm',
    iter: 750000
};
function hash(password, slt) {
    const salt = slt ? slt : crypto.randomBytes(cfg.saltB);
    const hash = crypto.pbkdf2Sync(password, salt, cfg.iter, cfg.hashB, 'sha512');
    return Buffer.concat([salt, hash]);
}
function encrypt(rawBuff, passwd) {
    const hashed = hash(passwd, undefined);
    const salt = hashed.slice(0, cfg.saltB);
    const key = hashed.slice(cfg.saltB);
    const iv = crypto.randomBytes(cfg.ivB);
    const cipher = crypto.createCipheriv(cfg.alg, key, iv);
    const coded = Buffer.concat([cipher.update(rawBuff), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([salt, iv, tag, coded]);
}
exports.encrypt = encrypt;
function decrypt(rawBuff, passwd) {
    const salt = rawBuff.slice(0, cfg.saltB);
    const iv = rawBuff.slice(cfg.saltB, cfg.saltB + cfg.ivB);
    const tag = rawBuff.slice(cfg.saltB + cfg.ivB, cfg.saltB + cfg.ivB + cfg.tagB);
    const contents = rawBuff.slice(cfg.saltB + cfg.ivB + cfg.tagB);
    const hashed = hash(passwd, salt);
    const key = hashed.slice(cfg.saltB);
    const decipher = crypto.createDecipheriv(cfg.alg, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(contents), decipher.final()]);
}
exports.decrypt = decrypt;
