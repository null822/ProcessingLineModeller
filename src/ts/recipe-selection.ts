import {createElement} from "./util";
import {createIO, createRecipe} from "./recipes";
import {queryDatabase} from "./db-connection";

export {
  searchResourceCallback, onSearchResourceResultsFocusChance,
  selectSearchResult,

  closeRecipeSelectionMenu,
  lookupRecipe, addIO,
  selectRecipeType, selectRecipe,
}

function onSearchResourceResultsFocusChance() {
  let searchResults = (<HTMLElement>document.getElementById("resource-search-results"))
  if (searchResults != null ) {
    searchResults.style.display = document.activeElement?.id != "resource-search" ? "none" : "block";
  }
  searchResourceCallback()
}
function selectSearchResult(result: HTMLElement) {
  (<HTMLInputElement>document.getElementById("resource-search")).value = result.innerHTML
  searchResourceCallback()
}

let searchTimeout: NodeJS.Timeout
function searchResourceCallback() {
  if (searchTimeout != null) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(searchResource, 200) // input throttling
}

let targetResource = ""
let recipeSearchResults: any = {}

let prevSearch = ""
async function searchResource() {
  let search = (<HTMLInputElement>document.getElementById("resource-search"))?.value;
  if (search === prevSearch) return
  (<HTMLElement>document.getElementById("search-width-mirror")).innerHTML = search

  let searchResults = <HTMLElement>document.getElementById("resource-search-results")
  if (search == null || searchResults == null) return
  searchResults.innerHTML = ""
  if (search.length < 2) return // don't do small searches to keep the server from melting

  let matches: string[] = await queryDatabase("search", {q: search, max: 1000})
  prevSearch = search
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const searchResult = createElement("resource-search-result")
    searchResult.innerHTML = match ?? ""
    searchResults.appendChild(searchResult)
  }

  if (matches.includes(search)) {
    targetResource = search
  } else {
    targetResource = ""
  }
}

async function lookupRecipe() {
  let selector = <HTMLElement>document.getElementById("recipe-selector")
  selector.style.display = ""

  if (targetResource === "") return
  recipeSearchResults = await queryDatabase("search-recipes", {output: targetResource})

  let typesSelector = <HTMLElement>document.getElementById("selector-type")
  typesSelector.innerHTML = ""
  for (const type in recipeSearchResults) {
    const element = createElement("recipe-selector-type")
    element.innerHTML = type
    typesSelector.appendChild(element)
  }
  selectRecipeType(<HTMLElement>typesSelector.firstElementChild)
}

async function addIO(type: string) {
  if (targetResource === "") return
  const resourceType = (await queryDatabase("get-resource-type", {resource: targetResource})).resourceType
  createIO(type, targetResource, resourceType)
}

function selectRecipeType(element: HTMLElement) {
  const children = element.parentElement?.children
  if (children == null) return
  for (let i in children) {
    const style = (<HTMLElement>children[i]).style
    if (style != null) style.backgroundColor = ""
  }
  element.style.backgroundColor = "var(--recipe-selector-type-select)"

  const type = element.innerHTML
  const recipes = recipeSearchResults[type]

  let recipesSelector = <HTMLElement>document.getElementById("selector-recipe")?.firstElementChild!
  recipesSelector.innerHTML = ""

  for (const name in recipes) {
    const element = createElement("recipe-selector-recipe")
    element.querySelector(".recipe-selector-recipe-header")!.innerHTML = name

    const recipe = recipes[name]
    const inputs = recipe
      .inputs
      .map((input: any) => input.resource)
      .join("<br>")
    const outputs = recipe
      .outputs
      .map((output: any) => output.resource)
      .join("<br>")
    const inputCounts = recipe
      .inputs
      .map((input: any) => input.quantity + (input.type == "fluid" ? "&nbsp;&nbsp;L" : "&nbsp;it"))
      .join("<br>")
    const outputCounts = recipe
      .outputs
      .map((output: any) => output.quantity + (output.type == "fluid" ? "&nbsp;&nbsp;L" : "&nbsp;it"))
      .join("<br>")

    element.querySelector(".recipe-selector-recipe-input-resources")!.innerHTML = inputs
    element.querySelector(".recipe-selector-recipe-input-counts")!.innerHTML = inputCounts
    element.querySelector(".recipe-selector-recipe-output-resources")!.innerHTML = outputs
    element.querySelector(".recipe-selector-recipe-output-counts")!.innerHTML = outputCounts

    recipesSelector.appendChild(element)
  }
}

async function selectRecipe(element: HTMLElement) {
  const recipeName = element.firstElementChild?.firstElementChild?.innerHTML
  if (recipeName == null) return

  closeRecipeSelectionMenu()

  const recipe = await queryDatabase("get-recipe", {name: recipeName})
  createRecipe(recipe)
}

function closeRecipeSelectionMenu() {
  (<HTMLElement>document.getElementById("recipe-selector")).style.display = "none"
}
