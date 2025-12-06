let recipeCounter = 0


async function lookupResource() {
  let resource = document.getElementById("resource-input").value
  let response = await fetch(`http://localhost:3306/get_recipes?resource=${resource}`)
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  const result = await response.json();
  console.log(result)


}




function addRecipe() {
  let recipe = newRecipe(recipeCounter)
  document.getElementById("recipes").appendChild(recipe)
  dragElement(recipe);

  recipeCounter++;
}

/**
 * Constructs a new recipe
 * @param recipeId the integer ID of the new recipe
 * @returns {Node} the new recipe
 */
function newRecipe(recipeId) {
  let recipe = createElement("recipe")
  recipe.removeAttribute("hidden")
  recipe.id = `recipe${recipeId}`
  recipe.querySelector("#recipe-header").id = `recipe${recipeId}-header`
  let table = recipe.querySelector("#recipe-data")
  table.id = `recipe${recipeId}-data`
  let tableBody = table.children[0]

  for (let rowId = 0; rowId < Math.ceil(Math.random() * 10); rowId++) {
    let direction = Math.random() > 0.5 ? "input" : (Math.random() > 0.1 ? "output" : "neither");
    let resourceType = Math.random() > 0.3 ? "item" : (Math.random() > 0.5 ? "fluid" : "energy");
    tableBody.appendChild(newRecipeRow(recipeId, rowId, direction, resourceType, "minecraft:lava"))
  }

  return recipe
}

/**
 * Constructs a new recipe row
 * @param recipeId the integer ID of the recipe this row belongs to
 * @param rowId the integer ID of the row, unique within this recipe
 * @param direction the direction of resources: input, output, or neither
 * @param resourceType the type of resource: item, fluid, energy, ...other
 * @param type the ID of the resource (ie minecraft:stone)
 * @returns {Node} the new recipe row
 */
function newRecipeRow(recipeId, rowId, direction, resourceType, type) {
  let row = document.createElement("tr");
  row.id = `recipe${recipeId}-row${rowId}`
  row.setAttribute("connected-to", "none")
  row.setAttribute("connected-by", "none")
  row.setAttribute("direction", `${direction}`)
  row.setAttribute("resourceType", `${resourceType}`)
  if (direction === "output") row.setAttribute("type", `${type}`)

  // column 0
  let connector;
  if (direction === "input") {
    connector = createElement("recipe-row-connector");
    connector.firstElementChild.firstElementChild.firstElementChild.setAttribute("fill", `var(--${resourceType}-color)`)
  } else {
    connector = createElement("recipe-row-connector-disabled");
  }
  connector.className += " recipe-row-input"
  row.appendChild(connector)

  // column 1
  let label = createElement("recipe-row-label")
  label.innerHTML = "Recipe Row"
  row.appendChild(label)

  // column 2
  let value = createElement("recipe-row-value")
  value.innerHTML = `${recipeId}-${rowId}`
  row.appendChild(value)

  // column 3
  if (direction === "output") {
    connector = createElement("recipe-row-connector")
    connector.firstElementChild.firstElementChild.firstElementChild.setAttribute("fill", `var(--${resourceType}-color)`)
  } else {
    connector = createElement("recipe-row-connector-disabled")
  }
  connector.className += " recipe-row-output"
  row.appendChild(connector)

  return row
}

function deleteRecipe(recipe) {
  let rows = document.getElementById(recipe.id + "-data").children[0].children
  for (let i = 0; i < rows.length; i++) {
    removeConnection(rows[i])
  }

  document.getElementById(recipe.id).remove()
}
