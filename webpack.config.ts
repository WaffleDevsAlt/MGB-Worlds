const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
	target: "web",
	entry: {
		index: "./index.ts",
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
			{
				test: /\.(png|svg|jpg|jpeg|gif)$/i,
				type: "asset/resource",
			},
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: "index.html",
		}),
	],
	output: {
		filename: "[name].bundle.js",
		path: path.resolve(__dirname, "dist"),
		clean: true,
	},
	watch: true,
	externals: {
		jquery: "jQuery",
	},
	mode: "development",
};
