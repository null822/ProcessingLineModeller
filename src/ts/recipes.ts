import {dragElement} from "./dragging";
import {createElement} from "./util";
import {removeConnection} from "./recipe-connections"

export {createRecipe, deleteRecipe}

let recipeCounter = 0

function createRecipe(recipe: any) {
  let recipeElement = newRecipe(recipeCounter, recipe)
  document.getElementById("recipes")?.appendChild(recipeElement)
  dragElement(<HTMLElement>recipeElement);

  recipeCounter++;
}

/**
 * Constructs a new recipe
 * @param recipeId the integer ID of the new recipe
 * @param recipe the JSON Object of the recipe to construct
 * @returns {Node} the new recipe
 */
function newRecipe(recipeId: number, recipe: any): Node {
  const recipeElement = createElement("recipe")
  recipeElement.id = `recipe${recipeId}`
  recipeElement.style.zIndex = `${500 + recipeId}`
  const header = recipeElement.querySelector("#recipe-header")!
  header.id = `recipe${recipeId}-header`
  header.querySelector("div")!.innerHTML = recipe.type

  let table = recipeElement.querySelector("#recipe-data")!
  table.id = `recipe${recipeId}-data`
  let tableBody = table.children[0]
  let rowId = 0

  for (const input of recipe.inputs) {
    tableBody.appendChild(newRecipeIORow(recipeId, rowId, "input", input))
    rowId++
  }
  for (const output of recipe.outputs) {
    tableBody.appendChild(newRecipeIORow(recipeId, rowId, "output", output))
    rowId++
  }

  return recipeElement
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
  console.log(row)

  const resourceType = row.isFluid == "true" ? "fluid" : "item"

  let rowElement = document.createElement("tr");
  rowElement.id = `recipe${recipeId}-row${rowId}`
  rowElement.setAttribute("connected-to", "none")
  rowElement.setAttribute("connected-by", "none")
  rowElement.setAttribute("direction", direction)
  rowElement.setAttribute("resourceType", resourceType)
  rowElement.setAttribute("resource", row.resource)

  // column 0
  let connector;
  if (direction === "input") {
    connector = createElement("recipe-row-connector");
    connector.firstElementChild!.firstElementChild!.firstElementChild!.setAttribute("fill", `var(--${resourceType}-color)`)
  } else {
    connector = createElement("recipe-row-connector-disabled");
  }
  connector.className += " recipe-row-input"
  rowElement.appendChild(connector)

  // column 1
  let label = createElement("recipe-row-label")
  label.innerHTML = row.resource
  rowElement.appendChild(label)

  // column 2
  let value = createElement("recipe-row-value")
  value.innerHTML = row.quantity + (row.isFluid == "true" ? "&nbsp;&nbsp;L" : "&nbsp;it")
  console.log(value.innerHTML)
  rowElement.appendChild(value)

  // column 3
  if (direction === "output") {
    connector = createElement("recipe-row-connector")
    connector.firstElementChild!.firstElementChild!.firstElementChild!.setAttribute("fill", `var(--${resourceType}-color)`)
  } else {
    connector = createElement("recipe-row-connector-disabled")
  }
  connector.className += " recipe-row-output"
  rowElement.appendChild(connector)

  return rowElement
}

function deleteRecipe(recipe: HTMLElement) {
  let rows = document.getElementById(recipe.id + "-data")!.children[0].children
  if (rows == null) return
  for (let i = 0; i < rows.length; i++) {
    removeConnection(<HTMLElement>rows[i])
  }

  document.getElementById(recipe.id)?.remove()
}
