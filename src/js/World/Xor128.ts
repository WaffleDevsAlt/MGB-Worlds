function toUInt32(floatVar: number) {
	return floatVar >>> 0;
}
export class UnityRandom {
	seed;

	constructor(initSeed = 51113926) {
		const nextSeed = (seed: number) => toUInt32(Math.imul(1812433253, seed) + 1);
		const firstSeed = toUInt32(initSeed),
			secondSeed = nextSeed(firstSeed),
			thirdSeed = nextSeed(secondSeed),
			fourthSeed = nextSeed(thirdSeed);
		this.seed = [firstSeed, secondSeed, thirdSeed, fourthSeed];
	}
	get state() {
		return [...this.seed];
	}
	set state(oldState) {
		this.seed = [...oldState];
	}
	get nextInt() {
		return this.nextUInt % 0x7fffffff;
	}
	get next() {
		return this.nextInt;
	}
	get value() {
		return 1 - this.rangeFloat();
	}
	get nextUInt() {
		let x = this.seed.shift();
		let y = this.seed[2];
		x ^= x << 11;
		x ^= x >>> 8;
		y ^= y >>> 19;
		y = toUInt32(y ^ x);
		this.seed.push(y);
		return y;
	}
	getWeight(table: any[]) {
		return table.reduce((totalWeight: any, currentItem: { weight: any }) => totalWeight + currentItem.weight, 0);
	}
	getItem(table: any[], masterTable: { relic: { [x: string]: { display: any } } }, randomNum: number) {
		return masterTable.relic[table.find((currentItem: { weight: number }) => (randomNum -= currentItem.weight) <= 0).masterIndex].display;
	}
	range(min = 0, max = 99999999) {
		if (max < min) {
			[min, max] = [max, min];
		}
		return (this.nextUInt % (max - min)) + min;
	}
	rangeFloat(min = 0, max = 1) {
		if (max < min) {
			[min, max] = [max, min];
		}
		return (max - min) * (1 - toUInt32(this.nextUInt << 9) / 0xffffffff) + min;
	}
	rangeInclusive(min: number, max: number) {
		return this.range(min, max + 1);
	}
	getWeightedElement(table: any[]) {
		let output = 0;
		const totalWeight = table.reduce((totalWeight: any, currentItem: { weight: any }) => totalWeight + currentItem.weight, 0);
		let randWeight = this.rangeInclusive(1, totalWeight);
		try {
			output = table.find((currentItem: { weight: number }) => (randWeight -= currentItem.weight) <= 0).masterIndex;
		} catch {
			output = 156;
		}
		return output;
	}
	loot(table: any) {
		return this.getWeightedElement(table);
	}
	getWeightedTable(table: any[]) {
		const totalWeight = table.reduce((totalWeight: any, currentItem: { weight: any }) => totalWeight + currentItem.weight, 0);
		let randWeight = this.rangeInclusive(1, totalWeight);
		return table.find((currentItem: { weight: number }) => (randWeight -= currentItem.weight) <= 0);
	}
	arrayPick(array: any[]) {
		const totalWeight = array.reduce((total: any, current: any) => total + current, 0);
		let randWeight = this.rangeInclusive(1, totalWeight);
		return array.findIndex((current: number) => (randWeight -= current) <= 0);
	}
	shuffle(list: any) {
		let workingList = [...list];
		let i = workingList.length;
		while (i > 1) {
			let index = this.range(0, i--);
			let value = workingList[index];
			workingList[index] = workingList[i];
			workingList[i] = value;
		}
		return workingList;
	}
	chance(chance: number) {
		return chance == 1 || (chance && chance > this.value);
	}
}
