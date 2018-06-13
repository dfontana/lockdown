"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const readline = require("readline");
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
