import type { Config } from "tailwindcss";

module.exports = {
	//content: ["./src/**/*.{html,js,ts}", "./*.{html,js,ts}", "./dist/index.html", "./dist/index.bundle.js"],
	content: ["./dist/index.html", "./dist/index.bundle.js"],
	theme: {
		extend: {
			borderRadius: {
				"4xl": "2rem",
			},
		},
	},
	plugins: [],
};
