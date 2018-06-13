import Chalk from "chalk";
import * as readline from 'readline'

class ProgressBar {
	private total: number;
	private current: number;
	private text: string;
	private bar_length: number;

	constructor() {
		this.total = 0;
		this.current = 0;
		this.text = '';
		this.bar_length = (process.stdout.columns || 80) - 20;
	}

	init(total: number, text: string): void {
		this.total = total;
		this.text = text;
		this.update(this.current);
	}

	add(progress: number): void {
		this.update(this.current + progress)
	}

	private update(current: number): void {
		this.current = current;
		const current_progress = this.current / this.total;
		this.draw(current_progress);
	}

	private draw(current_progress: number): void {
		const filled_bar_length = Math.trunc(current_progress * this.bar_length);
		const empty_bar_length = this.bar_length - filled_bar_length;

		const filled_bar = this.get_bar(filled_bar_length, "■", Chalk.cyan);
		const empty_bar = this.get_bar(empty_bar_length, "□");
		const percentage = (current_progress * 100).toFixed(0).padStart(3);

		readline.clearLine(process.stdout, 0)
		readline.cursorTo(process.stdout, 0, undefined);
		process.stdout.write(
			`${this.text}|${filled_bar}${empty_bar}|${percentage}% ${percentage === "100" ? "\n" : ""}`
		);
	}

	private get_bar(length: number, char: string, color: Function = a => a) {
		let str = "";
		for (let i = 0; i < length; i++) {
			str += char;
		}
		return color(str);
	}
};

export default ProgressBar;