export class Random {
	_seedArray: number[] = Array(56).fill(0);
	_inext: number;
	_inextp: number;
	constructor(Seed: number) {
		let num = 0;
		let num2 = Seed == -2147483647 ? 2147483647 : Math.abs(Seed);
		let num3 = 161803398 - num2;
		this._seedArray[55] = num3;
		let num4 = 1;
		for (let i = 1; i < 55; i++) {
			if ((num += 21) >= 55) {
				num -= 55;
			}
			this._seedArray[num] = num4;
			num4 = num3 - num4;
			if (num4 < 0) {
				num4 += 2147483647;
			}
			num3 = this._seedArray[num];
		}
		for (let j = 1; j < 5; j++) {
			for (let k = 1; k < 56; k++) {
				let num5 = k + 30;
				if (num5 >= 55) {
					num5 -= 55;
				}
				this._seedArray[k] -= this._seedArray[1 + num5];
				if (this._seedArray[k] < 0) {
					this._seedArray[k] += 2147483647;
				}
			}
		}
		this._inext = 0;
		this._inextp = 21;
	}
	InternalSample() {
		let num = this._inext;
		let num2 = this._inextp;
		if (++num >= 56) {
			num = 1;
		}
		if (++num2 >= 56) {
			num2 = 1;
		}
		let num3 = this._seedArray[num] - this._seedArray[num2];
		if (num3 == 2147483647) {
			num3--;
		}
		if (num3 < 0) {
			num3 += 2147483647;
		}
		this._seedArray[num] = num3;
		this._inext = num;
		this._inextp = num2;
		return num3;
	}
	Sample() {
		return this.InternalSample() * 4.656612875245797e-10;
	}
	NextDouble() {
		return this.Sample();
	}
}

class CustomMathClass {
	Clamp(value: number, min: number, max: number) {
		if (min > max) {
			throw new RangeError();
		}
		if (value < min) {
			return min;
		}
		if (value > max) {
			return max;
		}
		return value;
	}
	SmoothStep(from: number, to: number, t: number) {
		t = this.Clamp01(t);
		t = -2 * t * t * t + 3 * t * t;
		return to * t + from * (1 - t);
	}
	Clamp01(value: number) {
		const flag = value < 0;
		let result;
		if (flag) {
			result = 0;
		} else {
			const flag2 = value > 1;
			if (flag2) {
				result = 1;
			} else {
				result = value;
			}
		}
		return result;
	}
}

export const CustomMath = new CustomMathClass();
