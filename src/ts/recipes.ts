import {dragElement} from "./dragging";
import {createElement, createElementFlat} from "./util";
import {removeConnection} from "./recipe-connections"

export {
  createRecipe, deleteRecipe,
  createIO,

  getRecipe, getRecipeRow,
  getRecipeRowKey, getRecipeRowValue,
  getRecipeJson, getRecipeRowConnection,
  getRowIdFromKey
}

let recipeCounter = 0

/**
 * Creates a new Recipe
 * @param recipe the JSON object of the recipe
 */
function createRecipe(recipe: any) {
  let recipeElement = newRecipe(recipeCounter, recipe)
  document.getElementById("recipes")?.appendChild(recipeElement)
  dragElement(<HTMLElement>recipeElement);

  recipeCounter++;
}

/**
 * Creates a new Source or Drain
 * @param direction the type: `source` or `drain`
 * @param resource the resource to input or output
 * @param resourceType the type of resource (`fluid`, `liquid`, etc)
 */
function createIO(direction: string, resource: string, resourceType: string) {
  const recipe: any = {
    type: direction, name: `${direction}/${resource}`,
    displayName: direction.charAt(0).toUpperCase() + direction.slice(1),
  }
  const io = [{resource: resource, type: resourceType}]
  switch (direction) {
    case "source": recipe["outputs"] = io; break;
    case "drain": recipe["inputs"] = io; break;
  }
  return createRecipe(recipe)
}

/**
 * Constructs a new recipe
 * @param recipeId the integer ID of the new recipe
 * @param recipe the JSON Object of the recipe to construct
 * @returns {HTMLElement} the new recipe
 */
function newRecipe(recipeId: number, recipe: any): HTMLElement {
  const recipeElement = createElement("recipe")
  recipeElement.id = `recipe${recipeId}`
  recipeElement.setAttribute("recipe-id", `${recipeId}`)
  recipeElement.style.zIndex = `${500 + recipeId}`

  let workspaceContainer = document.getElementById("workspace-container")!
  recipeElement.style.top = `${-workspaceContainer.offsetTop + 50}px`
  recipeElement.style.left = `${-workspaceContainer.offsetLeft}px`

  const jsonStore = recipeElement.querySelector("#recipe-json")!
  jsonStore.id = `recipe${recipeId}-json`
  jsonStore.innerHTML = JSON.stringify(recipe)

  const header = recipeElement.querySelector("#recipe-header")!
  header.id = `recipe${recipeId}-header`
  header.querySelector(".recipe-header-name")!.innerHTML = recipe.displayName ?? recipe.type


  let table = recipeElement.querySelector("#recipe-data")!
  table.id = `recipe${recipeId}-data`
  let tableBody = <HTMLElement>table.children[0]
  let rowId = 0

  switch (recipe.type) {
    case "source":
      rowId = addIORows(recipeId, rowId, "output", tableBody, recipe)
      return recipeElement
    case "drain":
      rowId = addIORows(recipeId, rowId, "input", tableBody, recipe)
      return recipeElement
  }

  for (const input of recipe.inputs ?? []) {
    tableBody.appendChild(newRecipeIORow(recipeId, rowId++, "input", input))
  }
  for (const output of recipe.outputs ?? []) {
    tableBody.appendChild(newRecipeIORow(recipeId, rowId++, "output", output))
  }

  return recipeElement
}

function addIORows(recipeId: number, rowId: number, direction: string, tableBody: HTMLElement, recipe: any): number {
  tableBody.appendChild(newRecipeRow(
    recipeId, rowId++, "none", "none",
    createElementFlat("recipe-row-key", "Evaluation Start"),
    createElement("recipe-row-evaluation-start")))

  const resource = direction == "input" ? recipe.inputs[0] : recipe.outputs[0]

  const inputRateRow = newRecipeRow(
    recipeId, rowId++, direction, resource.type,
    createElementFlat("recipe-row-key", resource.resource),
    createElement("recipe-row-rate"))
  inputRateRow.setAttribute("resource-type", resource.type)
  inputRateRow.setAttribute("resource", resource.resource)
  tableBody.appendChild(inputRateRow)

  return rowId
}

/**
 * Constructs a new recipe row
 * @param recipeId the integer ID of the recipe this row belongs to
 * @param rowId the integer ID of the row, unique within this recipe
 * @param direction the direction of resources: input, output, or neither
 * @param row the JSON Object of the row to construct
 * @returns {HTMLElement} the new recipe row
 */
function newRecipeIORow(recipeId: number, rowId: number, direction: string, row: any): HTMLElement {

  let key = createElement("recipe-row-key")
  key.innerHTML = row.resource

  let value = createElement("recipe-row-value")
  value.innerHTML = row.quantity + (row.type == "fluid" ? "&nbsp;&nbsp;L" : "&nbsp;it")

  const rowElement = newRecipeRow(recipeId, rowId, direction, row.type, key, value)

  rowElement.setAttribute("resource-type", row.type)
  rowElement.setAttribute("resource", row.resource)

  return rowElement
}

function newRecipeRow(recipeId: number, rowId: number, direction: string, type: string, key: HTMLElement, value: HTMLElement): HTMLElement {
  let rowElement = document.createElement("tr");
  rowElement.id = `recipe${recipeId}-row${rowId}`
  rowElement.setAttribute("connected-to", "none")
  rowElement.setAttribute("connected-by", "none")
  rowElement.setAttribute("direction", direction)

  // input
  let connector;
  if (direction === "input") {
    connector = createElement("recipe-row-connector");
    connector.firstElementChild!.firstElementChild!.firstElementChild!.setAttribute("fill", `var(--${type}-color)`)
  } else {
    connector = createElement("recipe-row-connector-disabled");
  }
  connector.className += " recipe-row-input"
  rowElement.appendChild(connector)

  // data
  rowElement.appendChild(key)
  rowElement.appendChild(value)

  // output
  if (direction === "output") {
    connector = createElement("recipe-row-connector")
    connector.firstElementChild!.firstElementChild!.firstElementChild!.setAttribute("fill", `var(--${type}-color)`)
  } else {
    connector = createElement("recipe-row-connector-disabled")
  }
  connector.className += " recipe-row-output"
  rowElement.appendChild(connector)

  return rowElement
}

function getRecipe(recipeId: number): HTMLElement {
  return <HTMLElement>document.getElementById(`recipe${recipeId}`)
}
function getRecipeRow(recipeId: number, rowId: number): HTMLElement {
  return <HTMLElement>document.getElementById(`recipe${recipeId}-row${rowId}`)
}
function getRecipeJson(recipeId: number) {
  return JSON.parse(document.getElementById(`recipe${recipeId}-json`)?.innerHTML ?? "{}")
}
function getRowIdFromKey(recipeId: number, key: string): number {
  const rows = document.getElementById(`recipe${recipeId}-data`)!
    .firstElementChild!
    .childNodes
  for (const rowId of rows.keys()) {
    const rowKey = (<HTMLElement>rows[rowId]).querySelector(".recipe-row-key")
    if (rowKey?.innerHTML == key)
      return rowId
  }
  return -1
}
function getRecipeRowKey(recipeId: number, rowId: number): HTMLElement {
  return getRecipeRow(recipeId, rowId).querySelector(".recipe-row-key")!
}
function getRecipeRowValue(recipeId: number, rowId: number): HTMLElement {
  return getRecipeRow(recipeId, rowId).querySelector(".recipe-row-value")!
}
function getRecipeRowConnection(recipeId: number, rowId: number): any {
  const row = getRecipeRow(recipeId, rowId)
  const connectedTo = row.getAttribute("connected-to")
  if (connectedTo == "none" || connectedTo == null) return {recipe: "none"}
  const target = connectedTo
    .split("-")
    .map(s => parseInt(s.replace(/\D/g,'')))

  return {
    direction: row.getAttribute("direction"),
    recipe: target[0],
    row: target[1]
  }
}

function deleteRecipe(recipe: HTMLElement) {
  let rows = document.getElementById(recipe.id + "-data")!.children[0].children
  if (rows == null) return
  for (let i = 0; i < rows.length; i++) {
    removeConnection(<HTMLElement>rows[i])
  }

  document.getElementById(recipe.id)?.remove()
}
