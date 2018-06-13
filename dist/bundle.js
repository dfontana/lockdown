#!/usr/bin/env node --no-warnings
define("filesystem", ["require", "exports", "util"], function (require, exports, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let fs = require('fs').promises;
    if (fs === undefined) {
        fs = require('fs');
        fs.stat = util_1.promisify(fs.stat);
        fs.readdir = util_1.promisify(fs.readdir);
        fs.writeFile = util_1.promisify(fs.writeFile);
        fs.readFile = util_1.promisify(fs.readFile);
        fs.unlink = util_1.promisify(fs.unlink);
    }
    exports.default = {
        stat: fs.stat,
        readdir: fs.readdir,
        writeFile: fs.writeFile,
        readFile: fs.readFile,
        unlink: fs.unlink,
    };
});
define("encryption", ["require", "exports", "crypto"], function (require, exports, crypto) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
});
define("progress", ["require", "exports", "chalk", "readline"], function (require, exports, chalk_1, readline) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ProgressBar {
        constructor() {
            this.total = 0;
            this.current = 0;
            this.text = '';
            this.bar_length = (process.stdout.columns || 80) - 20;
        }
        init(total, text) {
            this.total = total;
            this.text = text;
            this.update(this.current);
        }
        add(progress) {
            this.update(this.current + progress);
        }
        update(current) {
            this.current = current;
            const current_progress = this.current / this.total;
            this.draw(current_progress);
        }
        draw(current_progress) {
            const filled_bar_length = Math.trunc(current_progress * this.bar_length);
            const empty_bar_length = this.bar_length - filled_bar_length;
            const filled_bar = this.get_bar(filled_bar_length, "■", chalk_1.default.cyan);
            const empty_bar = this.get_bar(empty_bar_length, "□");
            const percentage = (current_progress * 100).toFixed(0).padStart(3);
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0, undefined);
            process.stdout.write(`${this.text}|${filled_bar}${empty_bar}|${percentage}% ${percentage === "100" ? "\n" : ""}`);
        }
        get_bar(length, char, color = a => a) {
            let str = "";
            for (let i = 0; i < length; i++) {
                str += char;
            }
            return color(str);
        }
    }
    ;
    exports.default = ProgressBar;
});
define("encodeDir", ["require", "exports", "filesystem", "chalk", "path", "encryption", "progress"], function (require, exports, filesystem_1, chalk_2, path, encryption_1, progress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
                Bar.init(files.length, chalk_2.default.cyan(text));
                await Promise.all(files.map(f => {
                    return transformFile(f, op(passwd), async () => Bar.add(1));
                }));
            }
            catch (err) {
                console.error("   " + chalk_2.default.red(err));
            }
        };
    }
    exports.encryptDir = cipherDir(true, (passwd) => function (buff, f) {
        return [f + FILETYPE, encryption_1.encrypt(buff, passwd)];
    });
    exports.decryptDir = cipherDir(false, (passwd) => function (buff, f) {
        return [f.slice(0, -4), encryption_1.decrypt(buff, passwd)];
    });
});
define("hiddenInput", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl._writeToOutput = function _writeToOutput(stringToWrite) {
        rl.output.write(`\x1B[2K\x1B[200D${rl.query}${(rl.line.length % 2 == 1) ? "□" : "■"}`);
    };
    function default_1(prompt) {
        rl.query = prompt || "Input: ";
        return new Promise((res, rej) => {
            rl.question(rl.query, (passwd) => {
                rl.output.write('\n');
                rl.close();
                res(passwd);
            });
        });
    }
    exports.default = default_1;
    ;
});
define("lockdown", ["require", "exports", "commander", "hiddenInput", "chalk", "encodeDir"], function (require, exports, program, hiddenInput_1, chalk_3, encodeDir_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    program
        .version('0.0.1')
        .description('Lockdown File Vault System');
    program
        .command('encrypt <directory>')
        .alias('e')
        .option('-p, --passwd <passwd>', 'Debug usage only.')
        .description('AES256-Auth encrypts directory (or file)')
        .action((directory, options) => {
        if (options.passwd) {
            encodeDir_1.encryptDir(directory, options.passwd);
        }
        else {
            hiddenInput_1.default("   Password: ")
                .then(ans => {
                encodeDir_1.encryptDir(directory, ans);
            });
        }
    });
    program
        .command('decrypt <directory>')
        .alias('d')
        .option('-p, --passwd <passwd>', 'Debug usage only.')
        .description('Decrypts directory (or file)')
        .action((directory, options) => {
        if (options.passwd) {
            encodeDir_1.decryptDir(directory, options.passwd);
        }
        else {
            hiddenInput_1.default("   Password: ")
                .then(ans => {
                encodeDir_1.decryptDir(directory, ans);
            });
        }
    });
    program.on('command:*', function () {
        console.error(chalk_3.default.red.bold(`  Invalid command: ${program.args.join(' ')}`));
        program.outputHelp();
        process.exit(1);
    });
    if (!process.argv.slice(2).length) {
        program.outputHelp();
        process.exit(0);
    }
    else {
        program.parse(process.argv);
    }
});
