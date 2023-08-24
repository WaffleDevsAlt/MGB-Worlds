import { CanvasMgr, ViewMgr, WorldGenerator } from "../../..";
import { CustomMath } from "../CustomMath";
import { WorldStats } from "../WorldGeneration";
import { optionStates } from "./optionsManager";
type filter = {
	text: string;
	id: string;
	helpText: string;
	inputType: string;
	hasButton: Boolean;
	func: Function;
};

const filters: {
	[key: string]: filter;
} = {
	goToXY: {
		text: "Go to X,Y:",
		id: "goToXY",
		helpText: "Moves the map to the given X/Y.",
		inputType: "text",
		hasButton: true,
		func: (e: JQuery.ClickEvent, id: string) => {
			const input = $(`#${id}Input`).val().toString().trim().split(",");
			if (input.length != 2) return;
			const x = input[0],
				y = input[1];
			if (Number.isNaN(Number.parseInt(x))) return;
			if (Number.isNaN(Number.parseInt(y))) return;
			CanvasMgr.x = Number.parseInt(x);
			CanvasMgr.y = Number.parseInt(y);
		},
	},
	hasHPLess: {
		text: "Has HP < X%",
		id: "hasHPLesserWorldFilter",
		helpText: "Shows Worlds that have less than X% HP of max HP.",
		inputType: "text",
		hasButton: false,
		func: (x: number, y: number, stats: WorldStats, settings: filter) => {
			const maxHp = WorldGenerator.WorldMaxLife(x, y, 0);
			const minHp = WorldGenerator.WorldMaxLife(x, y, 100);
			const input = CustomMath.Clamp(Number.parseInt($(`#${settings.id}Input`).val().toString()), 1, 100);

			const percentage = (stats.maxLife - minHp) / (maxHp - minHp);
			console.log(percentage);
			if (!(percentage * 100 <= input)) return false;
			const hasYs = stats.yS != 0;
			return true;
		},
	},
	hasYSGreater: {
		text: "Has YS > X:",
		id: "hasYSGreaterWorldFilter",
		helpText: "Shows Worlds that have more Yellow Squares than X. If there is a % at the end, only shows Worlds that have more than X% of its max (10% of tier).",
		inputType: "text",
		hasButton: false,
		func: (x: number, y: number, stats: WorldStats, settings: filter) => {
			if (stats.yS == 0) return;
			const maxYS = Math.floor(stats.tier * 0.1);
			const input = $(`#${settings.id}Input`).val().toString().trim();
			if (input.endsWith("%")) {
				const num = CustomMath.Clamp(Number.parseInt(input), 1, 100);

				const percentage = stats.yS / maxYS;

				if (!(percentage * 100 >= num)) return;
				return true;
			} else {
				const num = Number.parseFloat(input);
				if (stats.yS >= num) return true;
			}
			return false;
		},
	},
	hasNoArmor: {
		text: "Has 0 Armor:",
		id: "hasNoArmorWorldFilter",
		helpText: "Shows Worlds that have no Armor",
		inputType: "none",
		hasButton: false,
		func: (x: number, y: number, stats: WorldStats, settings: filter) => {
			if (x == -1 && y == 308) console.log(stats.armorPerc);
			if (stats.armorPerc == 0) {
				return true;
			}
			return false;
		},
	},
	hasNoShield: {
		text: "Has 0 Shield:",
		id: "hasNoShieldWorldFilter",
		helpText: "Shows Worlds that have no Shield",
		inputType: "none",
		hasButton: false,
		func: (x: number, y: number, stats: WorldStats, settings: filter) => {
			if (stats.shieldPerc == 0) {
				return true;
			}
			return false;
		},
	},
	isOutpost: {
		text: "Is Outpost?",
		id: "isOutpostWorldFilter",
		helpText: "Shows Outposts.",
		inputType: "check",
		hasButton: false,
		func: (x: number, y: number, stats: WorldStats) => {
			if (stats.isOutpost) return true;
			return false;
		},
	},
	// ToDo: Fix this
	connectedToFliteredWorld: {
		text: "Connected To World:",
		id: "connectedToFliteredWorldConnectionFilter",
		helpText: "Shows the connections if they are connected to a filtered world.",
		inputType: "check",
		hasButton: false,
		func: (x: number, y: number, x2: number, y2: number) => {
			if (ViewMgr.shownWorlds.includes(`${x},${y}`) || ViewMgr.shownWorlds.includes(`${x2},${y2}`)) return true;
			else return false;
		},
	},
	tierSkip: {
		text: "Skip 1 Tier:",
		id: "tierSkipConnectionFilter",
		helpText: "Shows the connections that skip atleast 1 teir..",
		inputType: "check",
		hasButton: false,
		func: (x: number, y: number, x2: number, y2: number) => {
			if (Math.abs(WorldGenerator.WorldTier(x, y) - WorldGenerator.WorldTier(x2, y2)) >= 2) return true;
			else return false;
		},
	},
};

export class ViewManager {
	initializeManipulators() {
		let maxSize = 0;
		for (const filter in filters) {
			const { text, id, helpText, inputType, func, hasButton } = filters[filter];
			maxSize = text.length * 18 > maxSize ? text.length * 18 : maxSize;

			const element = $(`
            <div class="w-full h-10 bg-gray-400 border-black border-4 flex flex-row gap-2 relative max-w-full">
			    <span class="hasHelp my-auto text-md font-bold mr-auto m-2 min-w-max">${text}</span>
                <div class="hide">${helpText}</div>

				${inputType == "text" ? `<input id="${id}Input" type="text" class="w-4/12 min-w-[40px] h-full float-right" maxlength="10"/>` : ``}
				${
					hasButton
						? `<button id="${id}Submit" type="submit" class="right-0 float-right z-0 w-8 h-full bg-slate-600 text-white">S</button>`
						: `
			<div class="flex items-center w-max cursor-pointer select-none float-right ">
				<input
					id="${id}Submit"
					type="checkbox"
					class="mr-2 appearance-none transition-colors cursor-pointer w-14 h-7 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-blue-500 bg-red-500"
				/>
				<span class="absolute font-medium text-xs uppercase right-1 mr-2 text-white pointer-events-none"> OFF </span>
				<span class="absolute font-medium text-xs uppercase right-8 mr-2 text-white pointer-events-none"> ON </span>
				<span class="w-7 h-7 right-7 absolute rounded-full transform  mr-2 transition-transform bg-gray-200 pointer-events-none" />
			</div>`
				}
				
				
			</div>
        `);
			$("#navigation").append(element);
			$(`#${id}Submit`).on("click", (event) => {
				if (hasButton) func(event, id);
				CanvasMgr.updateCanvas();
			});
		}
	}
	shouldFilterWorlds() {
		let isFiltered = false;
		for (const filter in filters) {
			const { text, id, helpText, inputType, func } = filters[filter];
			if (id.endsWith("WorldFilter") && $(`#${id}Submit`).prop("checked")) {
				isFiltered = true;
			}
		}
		return isFiltered;
	}
	shouldFilterConnections() {
		let isFiltered = false;
		for (const filter in filters) {
			const { text, id, helpText, inputType, func } = filters[filter];
			if (id.endsWith("ConnectionFilter") && $(`#${id}Submit`).prop("checked")) {
				isFiltered = true;
			}
		}
		return isFiltered;
	}
	shownWorlds: string[] = [];
	drawFilteredWorlds(x: number, y: number, stats: WorldStats) {
		for (const filter in filters) {
			const { text, id, helpText, inputType, func } = filters[filter];
			if (id.endsWith("WorldFilter") && $(`#${id}Submit`).prop("checked")) {
				if (!func(x, y, stats, filters[filter])) {
					if (!optionStates.hideFilteredWorlds) CanvasMgr.createWorld(x, y, stats, true, false, false);
					return;
				}
			}
		}
		const style = CanvasMgr.createWorld(x, y, stats, false, true)[1];
		const hasYs = stats.yS != 0;
		CanvasMgr.drawWorld(x, y, hasYs, 1, style);
		if (!this.shownWorlds.includes(`${x},${y}`)) this.shownWorlds.push(`${x},${y}`);
	}

	drawFilteredConnections(x: number, y: number, x2: number, y2: number) {
		for (const filter in filters) {
			const { text, id, helpText, inputType, func } = filters[filter];
			if (id.endsWith("ConnectionFilter") && $(`#${id}Submit`).prop("checked")) {
				if (!func(x, y, x2, y2)) {
					if (!optionStates.hideFilteredWorlds) CanvasMgr.drawConnection(x, y, x2, y2, true, false);
					return;
				}
			}
		}
		CanvasMgr.drawConnection(x, y, x2, y2, false);
	}
}
