import { ViewMgr, WorldGenerator } from "../../..";
import { CustomMath } from "../CustomMath";
import { WorldStats } from "../WorldGeneration";
import { initializeOptions, optionStates } from "./optionsManager";

export class CanvasManager {
	islands: string[] = [];
	worldsCache: {
		[key: number]: {
			[key: number]: WorldStats;
		};
	} = {};
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	width: number;
	height: number;
	x: number;
	y: number;
	zoom: number;
	xView: number;
	yView: number;
	constructor(element: HTMLCanvasElement, x: number, y: number, zoom: number) {
		this.canvas = element;
		this.width = $(this.canvas).width();
		this.height = $(this.canvas).height();
		/**
		 * @property {CanvasRenderingContext2D} ctx
		 */
		this.ctx = this.canvas.getContext("2d");
		this.x = x;
		this.y = y;
		this.zoom = zoom;
		this.xView = 5 + this.zoom * 2;
		this.yView = 5 + this.zoom * 2;
	}

	initialize() {
		$(this.canvas).on("mousewheel DOMMouseScroll", (event: { originalEvent: any }) => {
			this.zoom = CustomMath.Clamp(this.zoom + Math.sign(event.originalEvent.deltaY), 0, 30);
			this.xView = 5 + this.zoom * 2;
			this.yView = 5 + this.zoom * 2;
			this.updateCanvas();
		});
		$(this.canvas).on("click", (event: { originalEvent: any }) => {
			const xY = this.getCoordForPos(event.originalEvent.offsetX, event.originalEvent.offsetY);
			this.x = Math.floor(xY[0]);
			this.y = Math.floor(xY[1]);
			this.updateCanvas();
		});
		$(window).on("keypress", (event) => {
			if ($(":focus-within").length != 0) return;
			switch (event.code) {
				case "KeyW":
					if (event.shiftKey) this.y += 4;
					this.y++;
					break;
				case "KeyA":
					if (event.shiftKey) this.x -= 4;
					this.x--;
					break;
				case "KeyD":
					if (event.shiftKey) this.x += 4;
					this.x++;
					break;
				case "KeyS":
					if (event.shiftKey) this.y -= 4;
					this.y--;
					break;
				case "KeyQ":
				case "Minus":
					this.zoom = CustomMath.Clamp(this.zoom + 1, 0, 30);
					this.xView = 5 + this.zoom * 2;
					this.yView = 5 + this.zoom * 2;
					break;
				case "KeyE":
				case "Equal":
					this.zoom = CustomMath.Clamp(this.zoom - 1, 0, 30);
					this.xView = 5 + this.zoom * 2;
					this.yView = 5 + this.zoom * 2;
					break;
			}
			this.updateCanvas();
		});
		setInterval(() => {
			this.resizeCanvas();
			this.updateCanvas();
		}, 2000);
		this.resizeCanvas();
		this.updateCanvas();
	}
	resizeCanvas() {
		///$(this.canvas.parentElement).css("width", "100%");
		//$(this.canvas.parentElement).css("height", "100%");

		$(this.canvas).css("width", "100%");
		$(this.canvas).css("height", "100%");
		const min = Math.round(Math.min($(this.canvas).width(), $(this.canvas).height()));
		//const min = Math.round($(this.canvas).height());
		$(this.canvas).width(min);
		$(this.canvas).height(min);
		$(this.canvas.parentElement).width(min);
		$(this.canvas.parentElement).height(min);
		this.width = min;
		this.height = min;
		this.ctx.canvas.width = min;
		this.ctx.canvas.height = min;
	}
	updateCanvas() {
		this.ctx.clearRect(0, 0, this.width, this.height);
		this.ctx.strokeStyle = "rgb(10, 160, 180)";
		this.ctx.beginPath();
		this.ctx.moveTo(0, this.height / 2);
		this.ctx.lineTo(this.width, this.height / 2);

		this.ctx.moveTo(this.width / 2, 0);
		this.ctx.lineTo(this.width / 2, this.height);
		this.ctx.closePath();
		this.ctx.stroke();
		const filteredWorlds = ViewMgr.shouldFilterWorlds();
		const filteredConnections = ViewMgr.shouldFilterConnections();
		this.generateConnections(filteredConnections);
		ViewMgr.shownWorlds = [];
		for (let x = this.x - this.xView; x <= this.x + this.xView; x++) {
			for (let y = this.y - this.yView; y <= this.y + this.yView; y++) {
				if (this.worldsCache[x] && this.worldsCache[x][y]) {
					this.createWorld(x, y, this.worldsCache[x][y], filteredWorlds);
					continue;
				}
				if (!WorldGenerator.DoesWorldExist(x, y)) continue;
				// yada yada
				const stats = WorldGenerator.ComputeMapStats(x, y);
				if (!this.worldsCache[x]) this.worldsCache[x] = {};
				this.worldsCache[x][y] = stats;
				this.createWorld(x, y, stats, filteredWorlds);
			}
		}
		this.updateStats();
	}

	createWorld(x: number, y: number, stats: WorldStats, filtered: boolean, returnValue: boolean = false, runFilter: boolean = true) {
		const hasYs = stats.yS != 0;

		let alpha = 1;

		if (filtered) alpha = 0.05;
		let fillStyle = `rgba(200,0,0,${alpha})`;
		if (this.x == x && this.y == y) fillStyle = `rgba(0, 50, 200, ${alpha})`;

		switch (stats.isOutpost) {
			case "Temple":
				fillStyle = `rgba(255, 200, 0, ${alpha})`;
				break;
			case "Crystal":
				fillStyle = `rgba(0, 200, 0, ${alpha})`;
				break;
			case "Void":
				fillStyle = `rgba(50, 50, 50, ${alpha})`;
				break;
		}
		let ysSize = undefined;
		if (optionStates.dynamicYsSize && hasYs) {
			let maxYS = Math.max(Math.floor(stats.tier / 10), 1);
			let percentage = stats.yS / maxYS;

			ysSize = 2 * percentage + 2;
		}
		if (filtered && runFilter) ViewMgr.drawFilteredWorlds(x, y, stats);
		else if (!returnValue) this.drawWorld(x, y, hasYs, alpha, fillStyle, undefined, undefined, ysSize);
		else return [fillStyle, fillStyle.replace(`0.3)`, `1)`)];
	}

	drawWorld(
		x: number,
		y: number,
		hasYs: boolean,
		alpha: number = 1,
		squareStyle: string = `rgba(200,0,0,${alpha})`,
		ysStyle: string = `rgba(255, 255, 0, ${alpha})`,
		squareSize: number = 6,
		ysSize: number = 4
	) {
		const coords = this.getPosForCoord(x, y, true);
		const step = this.width / (this.xView * 2 + 1);
		this.ctx.fillStyle = squareStyle;
		this.ctx.fillRect(coords[0] + step / squareSize, coords[1] + step / squareSize, step - step / (squareSize / 2), step - step / (squareSize / 2));
		this.ctx.clearRect(coords[0] + step / 4, coords[1] + step / 4, step - step / 2, step - step / 2);

		if (hasYs) {
			this.ctx.fillStyle = ysStyle;

			this.ctx.fillRect(coords[0] + step / ysSize, coords[1] + step / ysSize, step - step / (ysSize / 2), step - step / (ysSize / 2));
		}
		this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
		this.ctx.fillText(`${this.worldsCache[x][y].tier}`, coords[0] + step / 2, coords[1] + step / 2, step * 2);
	}

	generateConnections(filtered: boolean) {
		for (let x = this.x - this.xView - 2; x <= this.x + this.xView; x++) {
			for (let y = this.y - this.yView - 2; y <= this.y + this.yView; y++) {
				if (!WorldGenerator.DoesWorldExist(x, y)) continue;
				let num = 0;
				for (let j = x - 2; j <= x + 2; j++) {
					for (let k = y - 2; k <= y + 2; k++) {
						if (
							(j != x || k != y) &&
							WorldGenerator.DoesWorldExist(j, k) &&
							WorldGenerator.WorldValue(j, k) + WorldGenerator.WorldValue(x, y) > 150 &&
							!WorldGenerator.WorldBetween(x, y, j, k)
						) {
							this.drawConnection(x, y, j, k, filtered);
							num++;
						}
					}
				}
				if (num == 0) {
					this.islands.push(`${x},${y}`);
				}
			}
		}
	}

	drawConnection(x: number, y: number, x2: number, y2: number, filtered: boolean, runFilter: boolean = true) {
		let alpha = 1;
		if (filtered) alpha = 0.05;
		if (filtered && runFilter) ViewMgr.drawFilteredConnections(x, y, x2, y2);

		this.ctx.strokeStyle = `rgba(0, 0, 0,${alpha})`;
		const [xP, yP] = this.getPosForCoord(x, y, false);
		const [xP2, yP2] = this.getPosForCoord(x2, y2, false);
		const step = this.width / (this.xView * 2 + 1);
		this.ctx.beginPath();
		this.ctx.moveTo(xP + step / 2, yP + step / 2);
		this.ctx.lineTo(xP2 + step / 2, yP2 + step / 2);
		this.ctx.closePath();
		this.ctx.stroke();
	}

	getPosForCoord(x: number, y: number, needsInView: boolean) {
		if (!this.isCoordInView(x, y) && needsInView) return;

		// Deleted this all L.
		// Needs to get canvas x,y for ingame x,y
		const step = this.width / (this.xView * 2 + 1);
		const xPx = (x - (this.x - this.xView)) * step;
		const yPx = (-(y - (this.y - this.yView)) - 1) * step + this.height;

		return [xPx, yPx];
	}

	getCoordForPos(x: number, y: number) {
		const step = this.width / (this.xView * 2 + 1);

		const xPx = this.x + (-this.xView + (x - (x % step)) / step);
		const yPx = this.y + (-this.yView + (y - (y % step)) / step) * -1;
		return [xPx, yPx];
	}
	isCoordInView(x: number, y: number) {
		if (this.x + this.xView < x && this.x - this.xView > x) return false;
		if (this.y + this.yView < y && this.y - this.yView > y) return false;
		return true;
	}
	areStatsInitialized: boolean = false;
	stats: any = [
		"Tier",
		"MaxLife",
		"XWidth",
		"YWidth",
		"YS",
		"IsOutpost",
		"ArmorPerc",
		"ArmorRating",
		"ArmorRatingMax",
		"ArmorRatingDist",
		"ShieldPerc",
		"ShieldRegen",
		"ShieldRegenRate",
		"MutationPerc",
		"MutationLevel",
	];
	initializeStats() {
		for (let i = 0; i < this.stats.length; i++) {
			$(`#stats`).append(`
			<div class="statDiv" id="stat${this.stats[i]}Div text-[.8vw]">
				<p id="stat${this.stats[i]}Label" class="text-[.8vw] text-left">${this.stats[i]}:</p>
				<p id="stat${this.stats[i]}Detail" class="text-[.8vw] text-right">Detial</p>
			</div>
			`);
		}
		$(`#stats`).append(`
		<div class="statDiv mt-8" id="posDiv">
							<p id="posXLabel" class="text-left"></p>
							<p id="posYLabel" class="text-left"></p>
						</div>`);
		this.areStatsInitialized = true;
	}
	updateStats() {
		if (!this.areStatsInitialized) this.initializeStats();
		const stats: WorldStats = this.worldsCache[this.x][this.y];
		if (!WorldGenerator.DoesWorldExist(this.x, this.y)) return;
		for (let stat in stats) {
			let result = stats[stat];
			if (typeof stats[stat] == "number") {
				const toString = stats[stat].toString().split(".");
				stats[stat] = Math.round((Number.parseFloat(stats[stat]) + Number.EPSILON) * 10000) / 10000;
				if (stats[stat] > 1e10) stats[stat] = stats[stat].toExponential(5);
			}
			$(`#stat${stat.charAt(0).toUpperCase() + stat.slice(1)}Detail`).text(stats[stat]);
		}
		$(`#posXLabel`).text(`X: ${this.x}`);
		$(`#posYLabel`).text(`Y: ${this.y}`);
	}
}
