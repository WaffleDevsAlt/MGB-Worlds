const bands = [10.0, 50.0, 150.0, 2550.0, 40950.0, 655350.0, 5000000.0, 10000000.0];

export function HealthToColor(health: number, alpha: number = 1) {
	let result: string;
	if (health >= bands[7]) {
		result = Pallet(
			(Math.log(health) - 6.0) / 11.0,
			new Vector3(0.6, 0.6, 0.6),
			new Vector3(0.4, 0.4, 0.4),
			multVectorByInt(new Vector3(0.53, 0.92, 0.27), 5),
			new Vector3(0.57, 0.53, 0.92),
			alpha
		);
	} else {
		result = Pallet(
			Math.log(health) / 11.0 + 1.15,
			new Vector3(0.6, 0.6, 0.6),
			new Vector3(0.4, 0.4, 0.4),
			multVectorByInt(new Vector3(1, 1, 1), 0.6),
			new Vector3(0, 0.33, 0.67),
			alpha
		);
	}
	return result;
}

export function Pallet(t: number, a: Vector3, b: Vector3, c: Vector3, d: Vector3, alpha: number = 1) {
	let vector: Vector3 = multVectorByInt(addVectors(multVectorByInt(c, t), d), 6.28318);
	vector = addVectors(a, new Vector3(b.x * Math.cos(vector.x), b.y * Math.cos(vector.y), b.z * Math.cos(vector.z)));
	return `rgba(${255 * vector.x},${255 * vector.y},${255 * vector.z},${alpha})`;
}

export class Vector3 {
	x: number;
	y: number;
	z: number;
	constructor(x: number, y: number, z: number) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
}

function addVectors(a: Vector3, b: Vector3) {
	return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
}
function multVectorByInt(a: Vector3, b: number) {
	return new Vector3(a.x * b, a.y * b, a.z * b);
}
export function NumberToString(x: number, formatting: number) {
	if (x == 9.223372036854776e18) {
		return "MAX";
	}
	if (formatting == 0) {
		if (x < 10000.0) {
			return Math.floor(x).toString();
		}
		if (x < 10000000.0) {
			return Math.floor(x / 1000.0).toString() + "K";
		}
		if (x < 10000000000.0) {
			return Math.floor(x / 1000000.0).toString() + "M";
		}
		if (x < 10000000000000.0) {
			return Math.floor(x / 1000000000.0).toString() + "G";
		}
		if (x < 10000000000000000.0) {
			return Math.floor(x / 1000000000000.0).toString() + "T";
		}
		if (x < 1e19) {
			return Math.floor(x / 1000000000000000.0).toString() + "P";
		}
		if (x < 1e22) {
			return Math.floor(x / 1e18).toString() + "E";
		}
		if (x < 1e25) {
			return Math.floor(x / 1e21).toString() + "Z";
		}
		if (x > 0.0) {
			return Math.floor(x / 1e24).toString() + "Y";
		}
		return Math.floor(x).toString();
	} else if (formatting == 1) {
		if (x < 10000.0) {
			return x.toFixed(3);
		}
		if (x < 1000000.0) {
			return (x / 1000.0).toFixed(3) + "K";
		}
		if (x < 1000000000.0) {
			return (x / 1000000.0).toFixed(3) + "M";
		}
		if (x < 1000000000000.0) {
			return (x / 1000000000.0).toFixed(3) + "G";
		}
		if (x < 1000000000000000.0) {
			return (x / 1000000000000.0).toFixed(3) + "T";
		}
		if (x < 1e18) {
			return (x / 1000000000000000.0).toFixed(3) + "P";
		}
		if (x < 1e21) {
			return (x / 1e18).toFixed(3) + "E";
		}
		if (x < 1e24) {
			return (x / 1e21).toFixed(3) + "Z";
		}
		if (x > 0.0) {
			return (x / 1e24).toFixed(3) + "Y";
		}
		return x.toString();
	} else {
		if (formatting == 2) {
			return x.toExponential(3);
		}
		return "style not found";
	}
}
