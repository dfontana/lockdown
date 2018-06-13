"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const filesystem_1 = require("./filesystem");
const chalk_1 = require("chalk");
const path = require("path");
const encryption_1 = require("./encryption");
const progress_1 = require("./progress");
const FILETYPE = '.cpt';
async function getFiles(dir, encrypting) {
    if (!path.isAbsolute(dir)) {
        dir = path.join(process.cwd(), dir);
    }
    return await walkDir(dir, encrypting, []);
}
async function walkDir(fpath, encrypting, acc) {
    let stats = await filesystem_1.default.stat(fpath);
    if (stats.isDirectory()) {
        let files = await filesystem_1.default.readdir(fpath);
        for (let i = 0; i < files.length; i++) {
            let f = path.join(fpath, files[i]);
            acc = await walkDir(f, encrypting, acc);
        }
    }
    else {
        let hidden = (/((^|\/)\.\w+$)/g).test(fpath);
        let isFILETYPE = path.extname(fpath) === FILETYPE;
        let shouldDecrypt = (!encrypting && isFILETYPE && !hidden);
        let shouldEncrypt = (encrypting && !isFILETYPE && !hidden);
        if (shouldDecrypt || shouldEncrypt) {
            acc.push(fpath);
        }
    }
    return acc;
}
function transformFile(f, op, update) {
    return filesystem_1.default.readFile(f)
        .then(buff => op(buff, f))
        .then(args => filesystem_1.default.writeFile(...args))
        .then(() => filesystem_1.default.unlink(f))
        .then(update);
}
function cipherDir(encrypting, op) {
    return async function (dir, passwd) {
        const Bar = new progress_1.default();
        let text = `   ${encrypting ? 'Encrypting' : 'Decrypting'}`;
        try {
            const files = await getFiles(dir, encrypting);
            if (files.length === 0) {
                throw `   No files to ${text.slice(3, 10)}`;
            }
            Bar.init(files.length, chalk_1.default.cyan(text));
            await Promise.all(files.map(f => {
                return transformFile(f, op(passwd), async () => Bar.add(1));
            }));
        }
        catch (err) {
            console.error("   " + chalk_1.default.red(err));
        }
    };
}
exports.encryptDir = cipherDir(true, (passwd) => function (buff, f) {
    return [f + FILETYPE, encryption_1.encrypt(buff, passwd)];
});
exports.decryptDir = cipherDir(false, (passwd) => function (buff, f) {
    return [f.slice(0, -4), encryption_1.decrypt(buff, passwd)];
});
