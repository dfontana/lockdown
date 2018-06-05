const { bgCyan } = require("chalk");

module.exports = class ProgressBar {
	constructor() {
		this.total;
		this.current;
		this.text;
		this.bar_length = process.stdout.columns*0.5 - 30;
	}

	init(total, text) {
		this.total = total;
		this.text = text;
		this.current = 0;
		this.update(this.current);
	}

	update(current) {
		this.current = current;
		const current_progress = this.current / this.total;
		this.draw(current_progress);
	}

	draw(current_progress) {
		const filled_bar_length = (current_progress * this.bar_length).toFixed(0);
		const empty_bar_length = this.bar_length - filled_bar_length;

		const filled_bar = this.get_bar(filled_bar_length, " ", bgCyan);
		const empty_bar = this.get_bar(empty_bar_length, "-");
		const percentage_progress = (current_progress * 100).toFixed(0);

		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(
			`${this.text} |${filled_bar}${empty_bar}| ${percentage_progress}%`
		);
	}

	get_bar(length, char, color = a => a) {
		let str = "";
		for (let i = 0; i < length; i++) {
			str += char;
		}
		return color(str);
	}
};