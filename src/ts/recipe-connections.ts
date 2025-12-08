import {createElement} from "./util";
import {queryDatabase} from "./db-connection";

export {
  connectRecipeRows,
  recipeConnectionDragStart, recipeConnectionDragover, recipeConnectionDrop,
  removeConnection, updateConnection
}

function recipeConnectionDragStart(e: DragEvent) {
  if (e.target == null) return
  let row = <HTMLElement>(<HTMLElement>e.target).parentNode?.parentNode!;
  e.dataTransfer!.setData("source", row.id)
  removeConnection(row)
}
function recipeConnectionDragover(e: MouseEvent) {
  e.preventDefault();
}
function recipeConnectionDrop(e: DragEvent) {
  e.preventDefault();
  let sourceRow = document.getElementById(e.dataTransfer!.getData("source"))!;
  let targetRow = <HTMLElement>e.target!
  connectRecipeRows(sourceRow, targetRow)
}

async function connectRecipeRows(sourceRow: HTMLElement, targetRow: HTMLElement) {
  while (targetRow.tagName !== "TR") { targetRow = <HTMLElement>targetRow.parentNode }

  // prevent recipes linking to themselves
  let sourceRecipeInt = parseInt(sourceRow.id.split("-")[0].replace(/\D/g,''))
  let targetRecipeInt = parseInt(targetRow.id.split("-")[0].replace(/\D/g,''))
  if (sourceRecipeInt === targetRecipeInt) return

  // prevent recipe inputs linking to other inputs, and outputs to other outputs
  if (sourceRow.getAttribute("direction") === targetRow.getAttribute("direction")) return
  // match resource
  if (sourceRow.getAttribute("resourceType") !== targetRow.getAttribute("resourceType")) return
  const resourceA = sourceRow.getAttribute("resource")
  const resourceB = targetRow.getAttribute("resource")
  const hasMatchingResource = (await queryDatabase(
    "is-same-resource", {a: resourceA, b: resourceB})).result
  if (!hasMatchingResource) return


  removeConnection(targetRow)

  sourceRow.setAttribute("connected-to", targetRow.id)
  targetRow.setAttribute("connected-to", sourceRow.id)

  let connection = newRecipeConnection(sourceRow.getAttribute("resourceType") ?? "item")!
  sourceRow.setAttribute("connected-by", `${connection.id}`)
  targetRow.setAttribute("connected-by", `${connection.id}`)

  document.getElementById("connections")!.appendChild(connection)
  updateConnection(sourceRow.id)
}
function removeConnection(row: HTMLElement) {
  let destination = row.getAttribute("connected-to") ?? "none"
  let curve = row.getAttribute("connected-by") ?? "none"

  row.setAttribute("connected-to", "none")
  row.setAttribute("connected-by", "none")

  if (curve !== "none") {
    document.getElementById(curve)?.remove()
  }
  if (destination !== "none") {
    document.getElementById(destination)?.setAttribute("connected-to", "none")
    document.getElementById(destination)?.setAttribute("connected-by", "none")
  }
}

let recipeConnectionCounter = 0

/**
 * Constructs a new recipe connection
 * @param resourceType the type of the resource: item, fluid, energy, ...other
 * @returns {HTMLElement} the new recipe connection
 */
function newRecipeConnection(resourceType: string): HTMLElement {
  let connection = <HTMLElement>createElement("recipe-connection").firstElementChild!
  connection.id = `recipe-connection${recipeConnectionCounter}`
  connection.setAttribute("stroke", `var(--${resourceType}-color)`)

  recipeConnectionCounter++
  return connection
}

/**
 * Updates the connection curve between 2 recipe rows
 * @param id the ID of one of the recipe rows
 */
function updateConnection(id: string) {
  let source = document.getElementById(id)
  if (source == null) return
  const connectedBy = source.getAttribute("connected-by")
  const connectedTo = source.getAttribute("connected-to")
  if (connectedBy == null || connectedTo == null) return;
  let connection = document.getElementById(connectedBy)
  let rowA = document.getElementById(id)?.querySelector(".recipe-row-connector")
  let rowB = document.getElementById(connectedTo)?.querySelector(".recipe-row-connector")
  if (connection == null || rowA == null || rowB == null) return;

  let rectA = rowA.getBoundingClientRect();
  let ax = rectA.x + 0.5*rectA.width
  let ay = rectA.y + 0.5*rectA.height

  let rectB = rowB.getBoundingClientRect();
  let bx = rectB.x + 0.5*rectB.width
  let by = rectB.y + 0.5*rectB.height

  updateCurve(connection, true, ax, ay, true, bx, by)
}

/**
 * Updates the supplied Bézier curve.
 * @param curve a \<div> containing the curve SVG
 * @param ah whether point A is connected to horizontally
 * @param ax the X coordinate of point A
 * @param ay the Y coordinate of point A
 * @param bh whether point B is connected to horizontally
 * @param bx the X coordinate of point B
 * @param by the Y coordinate of point B
 */
function updateCurve(curve: HTMLElement, ah: boolean, ax: number, ay: number, bh: boolean, bx: number, by: number) {

  let directionX = bx - ax;
  let directionY = by - ay;

  let cx = ax // point C (handle for point A)
  let cy = ay
  let dx = bx // point D (handle for point B)
  let dy = by

  if (ah) cx = Math.round(ax + directionX / 3)
  else    cy = Math.round(ay + directionY / 3)
  if (bh) dx = Math.round(bx - directionX / 3)
  else    dy = Math.round(by - directionY / 3)

  let path = `M ${ax} ${ay} c ${cx - ax} ${cy - ay}, ${dx - ax} ${dy - ay}, ${bx - ax} ${by - ay}`;
  curve.setAttribute("d", path)
}
