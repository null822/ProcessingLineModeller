import {updateConnection} from "./recipe-connections";
import {workspaceWidth, workspaceHeight} from "./constants";
import {scale} from "./setup";

export {dragElement}

let isDraggingRecipe = false;
/**
 * Called every time an element is dragged
 * @param element the dragged element
 * @param posX the new X positon
 * @param posY the new Y positon
 */
function onDrag(element: HTMLElement, posX: number, posY: number): any {
  let id = element.id

  if (id.startsWith("recipe")) {
    let rows = document.getElementById(id + "-data")?.children[0].children
    if (rows != null) {
      for (let i = 0; i < rows.length; i++) {
        let c = rows[i]
        if (c.getAttribute("connected-to") !== "none") {
          updateConnection(c.id)
        }
      }
    }

    return {
      canDrag: true,
      posX: Math.min(Math.max(posX, 0), workspaceWidth),
      posY: Math.min(Math.max(posY, 0), workspaceHeight)
    }
  }
  if (id == "workspace-container") {
    return {
      canDrag: true,
      posX: Math.min(Math.max(posX, -workspaceWidth +  window.innerWidth), 0),
      posY: Math.min(Math.max(posY, -workspaceHeight +  window.innerHeight), 0)
    }
  }

  return {canDrag: true, posX: posX, posY: posY}
}
function canDrag(element: HTMLElement): boolean {
  let id = element.id

  if (id == "workspace-container") {
    return !isDraggingRecipe
  }
  if (id.startsWith("recipe")) {
    isDraggingRecipe = true
  }

  return true
}
function onDragEnd(element: HTMLElement) {
  let id = element.id

  if (id.startsWith("recipe")) {
    isDraggingRecipe = false
  }
}


// https://www.w3schools.com/howto/howto_js_draggable.asp
function dragElement(elmnt: HTMLElement) {
  let dragStartX = 0
  let dragStartY = 0
  const header = document.getElementById(elmnt.id + "-header")
  if (header != null) {
    // if present, the header is where you move the DIV from:
    header.onmousedown = dragMouseDown
    elmnt.onmousedown = (e) => e.stopPropagation()
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown
  }

  function dragMouseDown(e: MouseEvent) {
    if (!canDrag(elmnt))
      return

    e = e || window.event
    e.preventDefault();
    // get the mouse cursor position at startup:
    dragStartX = e.clientX
    dragStartY = e.clientY
    document.onmouseup = closeDragElement
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag
  }

  function elementDrag(e: MouseEvent) {
    let offsetScale = elmnt.id == "workspace-container" ? 1 : scale

    // calculate the new cursor position
    let posX = elmnt.offsetLeft + (e.clientX - dragStartX)/offsetScale
    let posY = elmnt.offsetTop + (e.clientY - dragStartY)/offsetScale

    const r = onDrag(elmnt, posX, posY)
    if (!r.canDrag) return

    dragStartX = e.clientX - (posX - r.posX)
    dragStartY = e.clientY - (posY - r.posY)

    posX = r.posX
    posY = r.posY

    e = e || window.event
    e.preventDefault()

    // set the element's new position:
    elmnt.style.top = posY + "px"
    elmnt.style.left = posX + "px"

  }

  function closeDragElement() {
    onDragEnd(elmnt)
    // stop moving when mouse button is released:
    document.onmouseup = null
    document.onmousemove = null
  }
}
