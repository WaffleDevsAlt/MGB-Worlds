import { CanvasMgr, debugMode } from "../../..";

const options: {
	[key: string]: any;
} = {
	hideFilteredWorlds: {
		text: "Hide Filtered Worlds",
		btnId: "hideFilteredWorlds",
		helpText: "Disables rendering of any worlds that don't fit the filters.",
	},
	hideFilteredConnections: {
		text: "Hide Filtered Connections",
		btnId: "hideFilteredConnections",
		helpText: "Disables rendering of any Connections that don't fit the filters.",
	},
	dynamicYsSize: {
		text: "Dynamic yS Size",
		btnId: "dynamicYsSize",
		helpText: "Changes the YS Square size depending on amount. Full = 10% of tier. Small Square = 1;",
	},
	disableTierNumbers: {
		text: "Disable Tier Numbers",
		btnId: "disableTierNumbers",
		helpText: "No Tier Numbers",
	},
};
export const optionStates: {
	[key: string]: any;
} = {};

export function initializeOptions() {
	if (debugMode) {
		console.log("DEBUG FUCoo");
		options.hideAllWorlds = {
			text: "Hide All Worlds",
			btnId: "hideAllWorlds",
			helpText: "No Worlds",
		};
		options.hideAllConns = {
			text: "Hide All Conns",
			btnId: "hideAllConns",
			helpText: "No Conns",
		};
	}
	let maxSize = 0;
	for (const option in options) {
		const { text, btnId, helpText } = options[option];
		const globalSize = $(window).width() * 0.0085 + 1;
		maxSize = text.length * globalSize > maxSize ? text.length * globalSize : maxSize;
		optionStates[option] = false;
		const element = $(`
        <div class="rounded-full bg-gray-600 p-4 flex items-center relative w-full cursor-pointer select-none min-w-full">
            <span class="hasHelp text-[1vw] font-bold">${text}</span>
            <div class="hide">${helpText}</div>
            <div class="flex items-center w-max cursor-pointer select-none absolute right-4">
                <input
                    id="${btnId}Input"
                    type="checkbox"
                    class="appearance-none transition-colors cursor-pointer w-14 h-7 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-blue-500 bg-red-800"
                />
                <span class="absolute font-medium text-xs uppercase right-1 text-white pointer-events-none"> OFF </span>
                <span class="absolute font-medium text-xs uppercase right-8 text-white pointer-events-none"> ON </span>
                <span class="w-7 h-7 right-7 absolute rounded-full transform transition-transform bg-gray-200 pointer-events-none" />
            </div>
        </div>
    `);
		$("#options").append(element);
		$(`#${btnId}Input`).on("click", () => {
			optionStates[option] = $(`#${btnId}Input`).prop("checked");
			CanvasMgr.updateCanvas();
		});
	}
	$(`#options`).css(`min-width`, `${maxSize}px`);
	$(`#options`).css(`max-width`, `${maxSize}px`);
}
