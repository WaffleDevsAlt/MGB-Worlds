import { CanvasManager } from "./src/js/Viewer/CanvasManager";
import { initializeOptions } from "./src/js/Viewer/optionsManager";
import { WorldGeneration } from "./src/js/WorldGeneration";
import { ViewManager } from "./src/js/Viewer/ViewManipulator";
import { NumberToString } from "./src/js/util";

export const debugMode = window.location.host == "127.0.0.1:5500";

export const WorldGenerator = new WorldGeneration();
export const CanvasMgr = new CanvasManager(document.getElementById("world") as HTMLCanvasElement, 0, 0, 1);
export const ViewMgr = new ViewManager();
ViewMgr.initializeManipulators();
CanvasMgr.initialize();

initializeOptions();

console.log(NumberToString(1234, 0));
console.log(NumberToString(1234, 1));
console.log(NumberToString(1234, 2));
console.log(NumberToString(123456789, 0));
console.log(NumberToString(123456789, 1));
console.log(NumberToString(123456789, 2));
