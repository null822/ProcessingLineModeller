import {searchResourceCallback} from "./recipe-selection";
import {dragElement} from "./dragging";
import {workspaceHeight, workspaceWidth} from "./constants";

export {setupConnectionsSvg, scale}

window.onload = function () {
  setupConnectionsSvg()
  searchResourceCallback()

  let workspaceContainer = document.getElementById("workspace-container")!
  workspaceContainer.style.width = `${workspaceWidth}px`
  workspaceContainer.style.height = `${workspaceHeight}px`
  workspaceContainer.style.left = `${-workspaceWidth / 2}px`
  workspaceContainer.style.top = `${-workspaceHeight / 2}px`
  dragElement(workspaceContainer)

  updateScale(0)
}

window.onresize = setupConnectionsSvg

function setupConnectionsSvg() {
  let svg = document.getElementById("connections")!
  let width = window.innerWidth
  let height = window.innerHeight
  svg.setAttribute("width", `${width}`)
  svg.setAttribute("height", `${height}`)
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`)
}

let scrollPos = 72;
let scale = 1;

document.onwheel = function (e) {
  if (e.shiftKey) {
    updateScale(e.deltaY)
  }
}

function updateScale(deltaY: number) {
  scrollPos += deltaY / 100
  scrollPos = Math.max(Math.min(scrollPos, 100), 72)

  scale =  1.1 ** (-scrollPos) * 1024
  scale = Math.min(scale, 1)

  let workspaceContainer = document.getElementById("workspace-container")!
  workspaceContainer.style.scale = `${scale}`
  let scaleDisplay = document.getElementById("scale-display")!
  scaleDisplay.innerHTML = `${Math.round(scale * 100)}% (hold shift)`
}
