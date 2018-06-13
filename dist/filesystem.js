"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
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
