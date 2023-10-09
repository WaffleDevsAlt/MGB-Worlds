import { ViewMgr, WorldGenerator } from "../../..";
import { WorldStats } from "../WorldGeneration";
import { initializeOptions, optionStates } from "./optionsManager";
import { CustomMath, Random } from "../CustomMath";
import { HealthToColor } from "../util";

export class CanvasManager {
	islands: string[] = [];
	worldsCache: {
		[key: number]: {
			[key: number]: {
				stats: WorldStats;
				connections: {
					j: number;
					k: number;
				}[];
			};
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
	drawingWorld: boolean;
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
			if (this.drawingWorld) {
				const coords = this.getCoordForPosForBlock(event.originalEvent.offsetX, event.originalEvent.offsetY);
				this.updateBlockStats(coords[0], coords[1]);
			} else {
				const xY = this.getCoordForPos(event.originalEvent.offsetX, event.originalEvent.offsetY);
				this.x = Math.floor(xY[0]);
				this.y = Math.floor(xY[1]);
				this.updateCanvas();
			}
		});
		$(window).on("keypress", (event) => {
			switch (event.code) {
				case "KeyW":
				case "ArrowUp":
					if (event.shiftKey) this.y += 4;
					this.y++;
					break;
				case "KeyA":
				case "ArrowLeft":
					if (event.shiftKey) this.x -= 4;
					this.x--;
					break;
				case "KeyD":
				case "ArrowRight":
					if (event.shiftKey) this.x += 4;
					this.x++;
					break;
				case "KeyS":
				case "ArrowDown":
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
		if (this.drawingWorld) {
			return this.drawWorldView();
		}
		this.ctx.clearRect(0, 0, this.width, this.height);
		this.drawStaticCanvasElement();
		const filteredWorlds = ViewMgr.shouldFilterWorlds();
		const filteredConnections = ViewMgr.shouldFilterConnections();
		this.generateConnections(filteredConnections);
		ViewMgr.shownWorlds = [];
		for (let x = this.x - this.xView; x <= this.x + this.xView; x++) {
			for (let y = this.y - this.yView; y <= this.y + this.yView; y++) {
				if (this.worldsCache[x] && this.worldsCache[x][y] && this.worldsCache[x][y].stats) {
					this.createWorld(x, y, this.worldsCache[x][y].stats, filteredWorlds);
					continue;
				}
				if (!WorldGenerator.DoesWorldExist(x, y)) continue;
				// yada yada
				const stats = WorldGenerator.ComputeMapStats(x, y);
				if (!this.worldsCache[x]) this.worldsCache[x] = {};
				if (!this.worldsCache[x][y]) this.worldsCache[x][y] = { stats: undefined, connections: [] };
				this.worldsCache[x][y].stats = stats;
				this.createWorld(x, y, stats, filteredWorlds);
			}
		}
		this.updateStats();
	}
	temp: {
		x: number;
		y: number;
		zoom: number;
	} = {
		x: 0,
		y: 0,
		zoom: 0,
	};
	toggleDrawingWorld() {
		this.drawingWorld = !this.drawingWorld;
		if (this.drawingWorld) {
			$("#stats").css("display", "none");
			$("#bstats").css("display", "flex");
			this.temp.x = this.x;
			this.temp.y = this.y;
			this.temp.zoom = this.zoom;
			this.x = 0;
			this.y = 0;
			this.zoom = 20;

			this.xView = 5 + this.zoom * 2;
			this.yView = 5 + this.zoom * 2;
		} else {
			$("#bstats").css("display", "none");
			$("#stats").css("display", "flex");
			this.x = this.temp.x;
			this.y = this.temp.y;
			this.zoom = this.temp.zoom;
			this.xView = 5 + this.zoom * 2;
			this.yView = 5 + this.zoom * 2;
		}
		this.updateCanvas();
	}
	wBlocks: any;
	wHeight: number;
	wWidth: number;
	wOffset: number;
	drawWorldView() {
		this.ctx.clearRect(0, 0, this.width, this.height);
		this.wBlocks = WorldGenerator.GenerateWorld(this.temp.x, this.temp.y);

		this.wHeight = this.wBlocks[0].length;
		this.wWidth = this.wBlocks.length;
		this.wOffset = (this.wHeight - this.wWidth) / 2;

		for (let x = 0; x < this.wWidth; x++) {
			for (let y = 0; y < this.wHeight; y++) {
				this.drawBlock(x + this.wOffset, y, this.wBlocks[x][y]);
			}
		}
	}
	drawBlock(x: number, y: number, num: number) {
		if (!num) return;
		const step = this.height / this.wHeight;

		const coords = this.getPosForCoordForBlock(x, y, true);
		this.ctx.fillStyle = HealthToColor(num, 1);
		console.log(this.ctx.fillStyle);
		this.ctx.fillRect(coords[0] + step / 12, coords[1] + step / 12, step - step / 6, step - step / 6);
	}
	getPosForCoordForBlock(x: number, y: number, needsInView: boolean) {
		if (!this.isCoordInView(x, y) && needsInView) return;
		const step = this.height / this.wHeight;

		const xPx = x * step;
		const yPx = y * step;

		return [xPx, yPx];
	}
	getCoordForPosForBlock(x: number, y: number) {
		const step = this.height / this.wHeight;

		const xPx = Math.floor(x / step - this.wOffset);
		const yPx = Math.floor(y / step);
		if (xPx > this.wWidth - 1 || xPx < 0) return;
		console.log([xPx, yPx]);
		return [xPx, yPx];
	}
	areBStatsInitialized: boolean = false;
	bStats: any = ["Armor", "ArmorRating", "Shield", "ShieldRegen", "Health", "Mutation", "MutationLevel"];
	initializeBStats() {
		for (let i = 0; i < this.bStats.length; i++) {
			$(`#bstats`).append(`
			<div class="statDiv" id="bstat${this.bStats[i]}Div text-[.8vw]">
				<p id="bstat${this.bStats[i]}Label" class="text-[.8vw] text-left">${this.bStats[i]}:</p>
				<p id="bstat${this.bStats[i]}Detail" class="text-[.8vw] text-right">Detial</p>
			</div>
			`);
		}
		this.areBStatsInitialized = true;
	}
	updateBlockStats(x: number, y: number) {
		if (!this.areBStatsInitialized) this.initializeBStats();
		const stats: WorldStats = this.getBlockStats(x, y);
		for (let stat in stats) {
			if (typeof stats[stat] == "number") {
				stats[stat] = Math.round((Number.parseFloat(stats[stat]) + Number.EPSILON) * 10000) / 10000;
				if (stats[stat] > 1e10) stats[stat] = stats[stat].toExponential(5);
			}
			$(`#bstat${stat.charAt(0).toUpperCase() + stat.slice(1)}Detail`).text(stats[stat]);
		}
	}

	getBlockStats(x: number, y: number): any {
		const {
			armorPerc,
			armorRating,
			armorRatingMax,
			armorRatingDist,
			shieldPerc,
			shieldRegen,
			shieldRegenRate,
			mutationPerc,
			mutationLevel,
			yS,
			maxLife,
			xWidth,
			yWidth,
			isOutpost,
			tier,
			value,
		} = this.worldsCache[this.temp.x][this.temp.y].stats;

		let random = new Random((this.temp.x * 873325093) ^ (this.temp.y * 787447));
		let random2 = new Random((this.temp.x * 443988277) ^ (this.temp.y * 891559));
		let random3 = new Random((this.temp.x * 229675583) ^ (this.temp.y * 335411));
		let armor = 0.0;
		let barmorRating = 0.0; // block armorRating
		let shield = 0.0;
		let bshieldRegen = 0.0; // block shield regen
		let health = this.wBlocks[x][y];
		let mutation = "";
		let bmutationLevel = 0; // block mutation level
		if (health > 0.0) {
			if (random.NextDouble() < armorPerc) {
				armor = (health * Math.fround(tier)) / 1496.7;
				let num4 = armorRating;
				if (random.NextDouble() > armorRatingDist) {
					if (tier < 1400) {
						num4 = Math.fround(Math.max(random.NextDouble() * random.NextDouble() * armorRatingMax * 0.9, 0.01));
					} else if (tier >= 1400) {
						num4 = Math.max(random.NextDouble() * armorRatingMax * 0.9, 0.01);
						if (tier >= 2000) {
							num4 += Math.fround((tier - 2000) / 1000) * random.NextDouble() * random.NextDouble() * random.NextDouble() * random.NextDouble() * random.NextDouble();
							num4 = CustomMath.Clamp(num4, 0.0, 1.0);
						}
					}
				}
				barmorRating = num4;
			}
			if (random2.NextDouble() < shieldPerc) {
				shield = (health * Math.fround(tier)) / 903.1;
				bshieldRegen = shieldRegen;
			}
			if (random3.NextDouble() < mutationPerc) {
				mutation = "Void";
				bmutationLevel = mutationLevel;
			}
		}
		const returnVal = {
			armor: armor,
			armorRating: barmorRating,
			shield: shield,
			shieldRegen: bshieldRegen,
			health: health,
			mutation: mutation,
			mutationLevel: bmutationLevel,
		};
		return returnVal;
	}

	drawStaticCanvasElement() {
		const step = this.width / (this.xView * 2 + 1);
		const ystep = this.height / (this.yView * 2 + 1);
		this.ctx.lineWidth = 6;
		// Minor (10) X/Y Guidelines
		this.ctx.strokeStyle = "rgba(0,0,0,.2)";
		for (let x = this.x - this.xView; x <= this.x + this.xView; x++) {
			if (x % 10 == 0) {
				const xPos = this.getPosForCoord(x, this.y + this.yView, true)[0];
				this.ctx.beginPath();

				this.ctx.moveTo(xPos + step / 2, 0);
				this.ctx.lineTo(xPos + step / 2, this.height);
				this.ctx.stroke();
			}
		}
		for (let y = this.y - this.yView; y <= this.y + this.yView; y++) {
			if (y % 10 == 0) {
				this.ctx.strokeStyle = "rgba(0,0,0,.2)";
				const yPos = this.getPosForCoord(this.x - this.xView, y, true)[1];
				this.ctx.beginPath();

				this.ctx.moveTo(0, yPos + ystep / 2);
				this.ctx.lineTo(this.width, yPos + ystep / 2);
				this.ctx.stroke();
			}
		}
		// EndMinor (10) X/Y Guidelines

		this.ctx.lineWidth = 3;
		// X/Y Guidelines
		this.ctx.strokeStyle = "rgb(10, 100, 140)";
		this.ctx.beginPath();
		this.ctx.moveTo(0, this.height / 2);
		this.ctx.lineTo(this.width, this.height / 2);

		this.ctx.moveTo(this.width / 2, 0);
		this.ctx.lineTo(this.width / 2, this.height);
		this.ctx.stroke();
		// End X/Y GuideLines

		// Tier Circle
		let minTier = Number.MAX_VALUE;
		let maxTier = 0;
		const tierArray = [
			WorldGenerator.WorldTier(this.x + this.xView, this.y + this.yView),
			WorldGenerator.WorldTier(this.x - this.xView, this.y + this.yView),
			WorldGenerator.WorldTier(this.x + this.xView, this.y - this.yView),
			WorldGenerator.WorldTier(this.x - this.xView, this.y - this.yView),
		];
		tierArray.forEach((a) => {
			if (a > maxTier) maxTier = a;
			if (a < minTier) minTier = a;
			return 0;
		});
		switch (Math.floor(maxTier / 100) * 100) {
			case 700:
				this.ctx.strokeStyle = `rgb(255, 200, 0,.5)`;
				break;
			case 1000:
				this.ctx.strokeStyle = `rgb(0, 200, 0,.5)`;
				break;
			case 1300:
				this.ctx.strokeStyle = `rgb(50, 50, 50,.5)`;
				break;
			default:
				this.ctx.strokeStyle = "rgb(10, 160, 180,.5)";
				break;
		}
		const shouldShowCircle = maxTier % 100 < minTier % 100;
		if (shouldShowCircle) {
			const pos = this.getPosForCoord(0, 0, false);
			const step = this.width / (this.xView * 2 + 1);
			const radius = step * Math.floor(maxTier / 100) * 100;

			this.ctx.lineWidth = 20;
			this.ctx.beginPath();
			this.ctx.arc(pos[0], pos[1], radius, 0, 2 * Math.PI);
			this.ctx.stroke();
			this.ctx.lineWidth = 2;
		}
		this.ctx.lineWidth = 2;
		// End Tier Circle
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
		if (!optionStates.disableTierNumbers) this.ctx.fillText(`${this.worldsCache[x][y].stats.tier}`, coords[0] + step / 2, coords[1] + step / 2, step * 2);
	}

	generateConnections(filtered: boolean) {
		for (let x = this.x - this.xView - 2; x <= this.x + this.xView; x++) {
			for (let y = this.y - this.yView - 2; y <= this.y + this.yView; y++) {
				if (!WorldGenerator.DoesWorldExist(x, y)) continue;
				if (this.worldsCache[x] && this.worldsCache[x][y] && this.worldsCache[x][y].connections) {
					const connLength = this.worldsCache[x][y].connections.length;
					for (let i = 0; i < connLength; i++) {
						const { j, k } = this.worldsCache[x][y].connections[i];

						this.drawConnection(x, y, j, k, filtered);
					}
					continue;
				}

				let tempConns: { j: number; k: number }[] = [];
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
							tempConns.push({ j, k });
							num++;
						}
					}
				}
				if (num == 0) {
					this.islands.push(`${x},${y}`);
				}
				if (!this.worldsCache[x]) this.worldsCache[x] = {};
				if (!this.worldsCache[x][y]) {
					this.worldsCache[x][y] = {
						stats: undefined,
						connections: tempConns,
					};
				}
			}
		}
	}

	drawConnection(x: number, y: number, x2: number, y2: number, filtered: boolean, runFilter: boolean = true) {
		this.ctx.lineWidth = 5;
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
		if (this.worldsCache[this.x] == undefined || this.worldsCache[this.x][this.y] == undefined) return;
		const stats: WorldStats = this.worldsCache[this.x][this.y].stats;
		if (!WorldGenerator.DoesWorldExist(this.x, this.y)) return;
		for (let stat in stats) {
			if (typeof stats[stat] == "number") {
				stats[stat] = Math.round((Number.parseFloat(stats[stat]) + Number.EPSILON) * 10000) / 10000;
				if (stats[stat] > 1e10) stats[stat] = stats[stat].toExponential(5);
			}
			$(`#stat${stat.charAt(0).toUpperCase() + stat.slice(1)}Detail`).text(stats[stat]);
		}
		$(`#posXLabel`).text(`X: ${this.x}`);
		$(`#posYLabel`).text(`Y: ${this.y}`);
	}

	getPosForCoord(x: number, y: number, needsInView: boolean) {
		if (!this.isCoordInView(x, y) && needsInView) return;

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
}
