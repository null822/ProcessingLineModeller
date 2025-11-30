function recipeConnectionDragStart(e) {
  let row = e.target.parentNode.parentNode;
  e.dataTransfer.setData("source", row.id)
  removeConnection(row)
}
function recipeConnectionDragover(e) {
  e.preventDefault();
}
function recipeConnectionDrop(e) {
  e.preventDefault();
  let sourceRow = document.getElementById(e.dataTransfer.getData("source"));
  let targetRow = e.target
  while (targetRow.tagName !== "TR") { targetRow = targetRow.parentNode }

  // prevent recipes linking to themselves
  let sourceRecipeInt = parseInt(sourceRow.id.split("-")[0].replace(/\D/g,''))
  let targetRecipeInt = parseInt(targetRow.id.split("-")[0].replace(/\D/g,''))
  if (sourceRecipeInt === targetRecipeInt) return

  // prevent recipe inputs linking to other inputs, and outputs to other outputs
  if (sourceRow.getAttribute("direction") === targetRow.getAttribute("direction")) return
  // match resource type
  if (sourceRow.getAttribute("resourceType") !== targetRow.getAttribute("resourceType")) return

  removeConnection(targetRow)

  sourceRow.setAttribute("connected-to", targetRow.id)
  targetRow.setAttribute("connected-to", sourceRow.id)

  let connection = newRecipeConnection(sourceRow.getAttribute("resourceType"))
  sourceRow.setAttribute("connected-by", `${connection.id}`)
  targetRow.setAttribute("connected-by", `${connection.id}`)

  document.getElementById("connections").appendChild(connection)
  updateConnection(sourceRow.id)
}
function removeConnection(row) {
  let destination = row.getAttribute("connected-to")
  let curve = row.getAttribute("connected-by")

  row.setAttribute("connected-to", "none")
  row.setAttribute("connected-by", "none")

  if (curve !== "none") {
    document.getElementById(curve).remove()
  }
  if (destination !== "none") {
    document.getElementById(destination).setAttribute("connected-to", "none")
    document.getElementById(destination).setAttribute("connected-by", "none")
  }
}

let recipeConnectionCounter = 0

/**
 * Constructs a new recipe connection
 * @param resourceType the type of the resource: item, fluid, energy, ...other
 * @returns {Node} the new recipe connection
 */
function newRecipeConnection(resourceType) {
  let connection = createElement("recipe-connection").firstElementChild
  connection.id = `recipe-connection${recipeConnectionCounter}`
  connection.setAttribute("stroke", `var(--${resourceType}-color)`)

  recipeConnectionCounter++
  return connection
}

/**
 * Updates the connection curve between 2 recipe rows
 * @param id the ID of one of the recipe rows
 */
function updateConnection(id) {
  let source = document.getElementById(id)
  let rowA = document.getElementById(id).querySelector(".recipe-row-connector")
  let connection = document.getElementById(source.getAttribute("connected-by"))
  let rowB = document.getElementById(source.getAttribute("connected-to")).querySelector(".recipe-row-connector")

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
function updateCurve(curve, ah, ax, ay, bh, bx, by) {

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
