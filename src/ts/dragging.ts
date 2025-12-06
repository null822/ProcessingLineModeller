import {updateConnection} from "./recipe-connections";

export {dragElement}

/**
 * Called every time an element is dragged
 * @param e the dragged element
 */
function onDrag(e: HTMLElement) {
  let id = e.id

  if (id.startsWith("recipe")) {
    let rows = document.getElementById(id + "-data")?.children[0].children
    if (rows == null) return

    for (let i = 0; i < rows.length; i++) {
      let c = rows[i]
      if (c.getAttribute("connected-to") !== "none") {
        updateConnection(c.id)
      }
    }
  }
}

// https://www.w3schools.com/howto/howto_js_draggable.asp
function dragElement(elmnt: HTMLElement) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  const header = document.getElementById(elmnt.id + "-header")
  if (header != null) {
    // if present, the header is where you move the DIV from:
    header.onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e: MouseEvent) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e: MouseEvent) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";

    onDrag(elmnt)
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
