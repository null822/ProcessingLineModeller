export { searchResourceCallback }

async function queryDatabase(path: string, query: string) {
  let response = await fetch(`http://localhost/${path}?${encodeURIComponent(query)}`)
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  return await response.json();
}
let searchTimeout: NodeJS.Timeout
function searchResourceCallback() {
  if (searchTimeout != null) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(searchResource, 200)
}

async function searchResource() {
  console.log("searchResource()")
  let resource = (<HTMLInputElement>document.getElementById("resource-input"))?.value
  console.log(resource)
  if (resource == null) return
  let matches = await queryDatabase("search", `q=${resource}`)
  console.log(matches)
}

async function lookupRecipe() {
  let resource = document.getElementById("resource-input")?.nodeValue
  if (resource == null) return
  const recipes = await queryDatabase("search_recipes", `q=${resource}`)
  console.log(JSON.stringify(recipes))
}

