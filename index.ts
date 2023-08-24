import { CanvasManager } from "./src/js/Viewer/CanvasManager";
import { initializeOptions } from "./src/js/Viewer/optionsManager";
import { WorldGeneration } from "./src/js/WorldGeneration";
import { ViewManager } from "./src/js/Viewer/ViewManipulator";

export const WorldGenerator = new WorldGeneration();
export const CanvasMgr = new CanvasManager(document.getElementById("world") as HTMLCanvasElement, 0, 0, 1);
export const ViewMgr = new ViewManager();
ViewMgr.initializeManipulators();
CanvasMgr.initialize();

initializeOptions();
