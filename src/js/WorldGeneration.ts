import rand from "./rand.json";
import { GlobalConstants } from "./GlobalConstants";
import { CustomMath, Random } from "./CustomMath";
import { CanvasMgr } from "../..";
import { UnityRandom } from "./World/Xor128";
const { worldHP, factionSpawnTierTemple, factionSpawnTierCrystal, factionSpawnTierVoid } = GlobalConstants;
export type WorldStats = {
	[key: string]: any;
	[key: number]: any;
	armorPerc: number;
	armorRating: number;
	armorRatingMax: number;
	armorRatingDist: number;
	shieldPerc: number;
	shieldRegen: number;
	shieldRegenRate: number;
	mutationPerc: number;
	mutationLevel: number;
	yS: number;
	maxLife: number;
	xWidth: number;
	yWidth: number;
	isOutpost: string | boolean;
	tier: number;
	value: number;
};

export class WorldGeneration {
	generationSize = 200;
	WorldValue(x: number, y: number) {
		let num = x % this.generationSize;
		if (num < 0) {
			num += this.generationSize;
		}
		let num2 = y % this.generationSize;
		if (num2 < 0) {
			num2 += this.generationSize;
		}
		if (num == 36 && num2 == 168) {
			return 1;
		}
		if (num == 37 && num2 == 168) {
			return 1;
		}
		if (num == 36 && num2 == 170) {
			return 1;
		}
		if (num == 37 && num2 == 170) {
			return 1;
		}
		if (num == 31 && num2 == 67) {
			return 1;
		}
		//@ts-expect-error

		return rand[num][num2];
	}
	DoesWorldExist(x: number, y: number) {
		if (CanvasMgr.islands.includes(`${x},${y}`)) {
			return false;
		}
		if (this.WorldValue(x, y) > 60) {
			return true;
		}
		return false;
	}

	WorldHasYellowSquare(x: number, y: number) {
		return this.WorldValue(x, y) < 70;
	}
	WorldBetween(x: number, y: number, x2: number, y2: number) {
		const xDir = (x2 - x) / 2;
		const yDir = (y2 - y) / 2;
		if (Math.abs(xDir) == 0.5 || Math.abs(yDir) == 0.5) return false;
		return this.DoesWorldExist(x + xDir, y + yDir);
	}
	WorldHasHowManySquares(x: number, y: number) {
		if (this.WorldValue(x, y) >= 70) {
			return 0;
		}
		const num = this.WorldTier(x, y) * (70 - this.WorldValue(x, y)) * 0.01;
		if (num < 1) {
			return 1;
		}
		return Math.floor(num);
	}

	WorldSizeX(x: number, y: number) {
		const num = 11 + this.WorldTier(x, y) / 30 + (this.WorldValue(x, y) - 60) * 0.1;
		if (num > 21) {
			return 21;
		}
		return Math.floor(num);
	}

	WorldSizeY(x: number, y: number) {
		const num = 11 + this.WorldTier(x, y) / 10 + (this.WorldValue(x, y) - 60) * 0.2;
		if (num > 41) {
			return 41;
		}
		return Math.floor(num);
	}

	WorldTier(x: number, y: number) {
		return Math.floor(Math.sqrt(x * x + y * y));
	}

	WorldMaxLife(x: number, y: number, WorldValue: number = this.WorldValue(x, y)) {
		let num = this.WorldTier(x, y);
		if (num == 0) {
			num = 1;
		}
		const num2 = WorldValue;
		const num3 = 1.25 - (num2 - 61) / 40 / 2;
		if (num < 1000) {
			return (worldHP[Math.floor(num / 50)] * (1.0 - (num % 50) / 50.0) + worldHP[Math.ceil(num / 50)] * ((num % 50) / 50.0)) * num3;
		}
		let num4 = 1240453585.0;
		let num5 = 0;
		for (let i = 0; i < Math.floor((num - 1000) / 50); i++) {
			num4 *= 1.4;
			num5++;
		}
		console.log(num5);
		return (num4 * (1.0 - (num % 50) / 50.0) + num4 * 1.4 * ((num % 50) / 50.0)) * num3;
	}

	IsWorldOutpost(x: number, y: number) {
		if (this.WorldValue(x, y) > 98) {
			const num = this.WorldTier(x, y);
			if (num > factionSpawnTierTemple - 2 && num < factionSpawnTierTemple + 2) {
				return "Temple";
			}
			if (num > factionSpawnTierCrystal - 2 && num < factionSpawnTierCrystal + 2) {
				return "Crystal";
			}
			if (num > factionSpawnTierVoid - 2 && num < factionSpawnTierVoid + 2) {
				return "Void";
			}
		}
		return false;
	}

	LegacyWorldMaxLife(x: number, y: number) {
		const num = this.WorldTier(x, y);
		const p = 2.999;
		if (num <= 300) {
			return 3 + num + (Math.pow(num, 3) - Math.pow(num, p)) * (8 - (this.WorldValue(x, y) - 60) * 0.1);
		}
		return 3 + num + (Math.pow(num, 3) - Math.pow(num, p)) * (8 - (this.WorldValue(x, y) - 60) * 0.1 + (num - 300) / 40);
	}

	// Basically the normal games function. Off by around 10k at max with a tier1000 world.
	GenerateWorld(x: number, y: number) {
		const rand = new UnityRandom(x * 1000 + y);

		let num = this.WorldSizeX(x, y);
		let num2 = this.WorldSizeY(x, y);
		let num3 = this.WorldMaxLife(x, y);

		const array: number[][] = [];

		for (let i = 0; i < num; i++) {
			for (let j = 0; j < num2; j++) {
				let randval = rand.value;
				if (!array[i]) array[i] = [];
				array[i].push(Math.fround(randval) * num3);
			}
		}

		for (let k = 0; k < num; k++) {
			for (let l = 0; l < num2; l++) {
				array[k][l] = (array[k][l] + array[k % num][(l + 1) % num2]) / 2.0;
				array[k][l] = (array[k][l] + array[(k + 1) % num][l % num2]) / 2.0;
				array[k][l] = (array[k][l] + array[(k + 1) % num][(l + 1) % num2]) / 2.0;
				array[k][l] = (array[k][l] + array[k % num][(l + 2) % num2]) / 2.0;
				array[k][l] = (array[k][l] + array[(k + 2) % num][l % num2]) / 2.0;
				if (array[k][l] < num3 / 3.0) {
					array[k][l] = 0.0;
				}
			}
		}

		return array;
	}

	//Not in this class. In GameLogic class but fits here :v
	ComputeMapStats(x: number, y: number): WorldStats {
		const num = this.WorldTier(x, y);
		let num2 = Math.fround(CustomMath.Clamp(Math.pow(Math.max(num - 300, 0) / 1200, 2), 0, 1));

		const random = new Random(Math.imul(x, 873325093) ^ Math.imul(y, 787447));
		if (random.NextDouble() < 0.01) {
			num2 = 0.0;
		}
		const num3 = CustomMath.Clamp(Math.fround(Math.floor((num - 300) / 100) * Math.fround(0.1)), 0, 1);

		const random2 = new Random(Math.imul(x, 931937597) ^ Math.imul(y, 240589));
		const num4 = CustomMath.Clamp(num3 * Math.fround(random2.NextDouble()), 0, 1);
		const num5 = Math.fround(random2.NextDouble());
		let num6 = Math.fround(CustomMath.Clamp((num - 1000) / 2000, 0, 1));
		if (random.NextDouble() < 0.01) {
			num6 = 0.0;
		}
		const num7 = Math.fround(CustomMath.SmoothStep(0.008, 0.05, (num - 1500) / 1000));
		const num8 = Math.fround(Math.fround(CustomMath.SmoothStep(0.008, 0.05, (num - 2400) / 1000)) * Math.fround(random.NextDouble()));
		const num9 = num7 + num8;
		const num10 = Math.fround(CustomMath.SmoothStep(0, 0.17, Math.max(num - 1300, 0) / 1200));
		const num11 = Math.fround(Math.max((num - 2500) / 2000, 0));
		const num12 = Math.min(num10 + num11, 1.0);
		const num13 = Math.round(CustomMath.SmoothStep(1, 30, Math.max(num - 1300, 0) / 3300));
		return {
			armorPerc: Math.round(num2 * 100),
			armorRating: Math.round(num4 * 100) / 100,
			armorRatingMax: num3,
			armorRatingDist: num5,
			shieldPerc: Math.round(num6 * 100),
			shieldRegen: num9,
			shieldRegenRate: 0.1,
			mutationPerc: Math.round(num12 * 100),
			mutationLevel: num13,
			yS: this.WorldHasHowManySquares(x, y),
			maxLife: this.WorldMaxLife(x, y),
			xWidth: this.WorldSizeX(x, y),
			yWidth: this.WorldSizeY(x, y),
			isOutpost: this.IsWorldOutpost(x, y),
			tier: this.WorldTier(x, y),
			value: this.WorldValue(x, y),
		};
	}
}
