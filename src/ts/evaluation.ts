import {
  getRecipe,
  getRecipeJson, getRecipeRow,
  getRecipeRowConnection,
  getRecipeRowKey,
  getRecipeRowValue,
  getRowIdFromKey
} from "./recipes";

export {
  evaluate, setEvaluateElement
}

let evaluateRoot = NaN;
let isBackwardsEvaluation = false
let evaluatedRecipes = new Set<number>()

async function evaluate() {
  if (isNaN(evaluateRoot)) return

  const connection = getRecipeRowConnection(evaluateRoot, 1)
  if (connection.recipe == "none") return;
  const qty = parseFloat((<HTMLInputElement>getRecipeRowValue(evaluateRoot, 1).firstElementChild).value)

  evaluatedRecipes.clear()
  evaluateRecipe(isBackwardsEvaluation, connection.recipe, connection.row, qty)
}

function evaluateRecipe(isBackwards: boolean, recipeId: number, rowId: number, qty: number) {
  const row = getRecipeRow(recipeId, rowId)
  const connection = document.getElementById(row.getAttribute("connected-by")!)!

  if (evaluatedRecipes.has(recipeId)) {
    connection.setAttribute("stroke", "var(--error-color)")
    return
  }
  connection.setAttribute("stroke", `var(--${row.getAttribute("resource-type")}-color)`)

  const recipeElement = getRecipe(recipeId)
  const json = getRecipeJson(recipeId)
  const resource = getRecipeRowKey(recipeId, rowId).innerHTML

  const ioRow = (isBackwards ? json.outputs : json.inputs)
    .find((x: any) => x.resource == resource)
  const recipeCount = qty / ioRow.quantity

  recipeElement.querySelector(".recipe-header-quantity")!.innerHTML =
    `x${Math.round(recipeCount * 100) / 100}`

  evaluatedRecipes.add(recipeId)

  for (const input of json.inputs ?? []) {
    if (input.resource == resource) continue

    const inputRowId = getRowIdFromKey(recipeId, input.resource)
    const requiredInput = input.quantity * recipeCount

    const connection = getRecipeRowConnection(recipeId, inputRowId)
    if (connection.recipe == "none") continue
    evaluateRecipe(true, connection.recipe, connection.row, requiredInput)
  }
  for (const output of json.outputs ?? []) {
    if (output.resource == resource) continue

    const outputRowId = getRowIdFromKey(recipeId, output.resource)
    const requiredOutput = output.quantity * recipeCount

    const connection = getRecipeRowConnection(recipeId, outputRowId)
    if (connection.recipe == "none") continue
    evaluateRecipe(false, connection.recipe, connection.row, requiredOutput)
  }
}

function setEvaluateElement(element: HTMLElement) {
  const recipeId = parseInt(element.getAttribute("recipe-id") ?? "NaN")
  if (isNaN(recipeId)) return;
  const inputCheckbox = <HTMLInputElement>getRecipeRowValue(recipeId, 0).firstElementChild
  if (!inputCheckbox.checked) {
    evaluateRoot = NaN
    disableIOEvaluation(recipeId)
    return;
  }
  const recipeJson = getRecipeJson(recipeId);


  evaluateRoot = recipeId
  isBackwardsEvaluation = recipeJson.type == "drain"

  clearOtherEvaluationCheckboxes(recipeId)
  const resourceRateInput = <HTMLInputElement>getRecipeRowValue(recipeId, 1).firstElementChild
  resourceRateInput.disabled = false

  evaluate()
}

function clearOtherEvaluationCheckboxes(exclusionId: number) {
  const recipes = document.getElementById("recipes")?.children ?? []

  for (const recipe of recipes) {
    const recipeId = parseInt(recipe.getAttribute("recipe-id") ?? "-1")
    if (recipeId === exclusionId) continue
    const recipeJson = getRecipeJson(recipeId);
    if (recipeJson.type == "drain" || recipeJson.type == "source") {
      disableIOEvaluation(recipeId)
    }
  }
}

function disableIOEvaluation(recipeId: number) {
  const evaluationStartCheckbox = <HTMLInputElement>getRecipeRowValue(recipeId, 0).firstElementChild
  evaluationStartCheckbox.checked = false
  const resourceRateInput = <HTMLInputElement>getRecipeRowValue(recipeId, 1).firstElementChild
  resourceRateInput.disabled = true
}
