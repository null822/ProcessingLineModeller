import * as http from "node:http";
import Database from "better-sqlite3";

export default handleRequest

const db = new Database('db/recipes.sqlite', {readonly: true});

async function handleRequest(request: http.IncomingMessage, response: http.ServerResponse) {
  const url = request.url
  if (url == null) return
  response.setHeader('Access-Control-Allow-Origin', '*')

  let separatorIndex = url.indexOf("?")
  if (separatorIndex == -1) separatorIndex = url.length
  const path = url.substring(0, separatorIndex)
  const query = decodeURIComponent(url.substring(separatorIndex + 1, url.length))
    .split("&")
    .map(q => q.split("="))
    .reduce<any>((res, q) => {
      res[q[0]] = q[1]
      return res
    }, {})

  switch (path) {
    case "/search-recipes":
      response.writeHead(200, {'Content-Type': 'application/json'})
      response.end(JSON.stringify(searchRecipes(query.input, query.output)))
      return 200
    case "/search":
      response.writeHead(200, {'Content-Type': 'application/json'})
      response.end(JSON.stringify(searchResources(query.q, query.max ?? -1)))
      return 200
    case "/expand":
      response.writeHead(200, {'Content-Type': 'application/json'})
      response.end(JSON.stringify(expandResource(query.q)))
      return 200
    case "/get-recipe":
      response.writeHead(200, {'Content-Type': 'application/json'})
      response.end(JSON.stringify(getRecipe(query.name)))
      return 200
    case "/is-same-resource":
      response.writeHead(200, {'Content-Type': 'application/json'})
      response.end(JSON.stringify(isSameResource(query.a, query.b)))
      return 200
    case "/get-resource-type":
      response.writeHead(200, {'Content-Type': 'application/json'})
      response.end(JSON.stringify(getResourceType(query.resource)))
      return 200
    default:
      return 404
  }
}


function searchResources(query: string, max: number) {
  query = likeSanitizeInput(query)

  if (query == undefined) return []
  let resources: string[]
  if (query.startsWith("#")) {
    resources = db
      .prepare<any[], any>(`select name from tags where name like '${query}%' escape '\\'`)
      .all()
      .map(row => row.name)
  } else {
    resources = db
      .prepare<any[], any>(`select name from resources where name like '%${query}%' escape '\\'`)
      .all()
      .map(row => row.name)
    resources.push(...db
        .prepare<any[], any>(`select name from tags where name like '%${query}%' escape '\\'`)
        .all()
        .map(row => row.name))
  }
  resources.sort((a, b) => a.length - b.length)
  if (max > 0) resources = resources.slice(0, max)
  return resources
}

function searchRecipes(input: string, output: string) {
  input = sanitizeInput(input)
  output = sanitizeInput(output)

  const inputResources = expandResource(input);
  const outputResources = expandResource(output);

  let entries: number[] = inputResources
    .map(resource => db
      .prepare<any[], any>(`select id from recipeInputs where resource = '${resource}'`)
      .all()
      .map<number>(row => row.id))
    .flat()
  entries.push(...outputResources
    .map(resource => db
      .prepare<any[], any>(`select id from recipeOutputs where resource = '${resource}'`)
      .all()
      .map<number>(row => row.id))
    .flat())

  let result = db
    .prepare<any[], any>(`select name, type, id from recipes where id in (${entries.join(", ")})`)
    .all()

  return result.reduce((result, row) => {
      if (result[row.type] == undefined) result[row.type] = {}
      result[row.type][row.name] = {
        inputs: getRecipeIO(row.id, false),
        outputs: getRecipeIO(row.id, true),
      }
      return result
    }, {})
}

/**
 * Searches the database for every resource and tag that is represented by the resource supplied
 */
function expandResource(resource: string) {
  resource = sanitizeInput(resource)

  if (resource == undefined) return []
  let resources: string[]
  if (resource.startsWith("#")) {
    resources = db
      .prepare<any[], any>(`select id from tags where name = '${resource}'`)
      .all()
      .map(row => db
        .prepare<any[], any>(`select resource from tagContents where id = '${row.id}'`)
        .all()
        .map(row => row.resource))
      .flat()
    resources.push(resource)
  } else {
    resources = [resource]
    resources.push(...db
      .prepare<any[], any>(`select id from tagContents where resource = '${resource}'`)
      .all()
      .map(row => db.prepare<any[], any>(`select name from tags where id = ${row.id}`).get())
      .map(row => row.name))
  }
  return resources
}

function getRecipe(name: string) {
  name = sanitizeInput(name)

  const meta = db
    .prepare<any[], any>(`select id, type, duration, power from recipes where name = '${name}'`)
    .get()
  if (meta == null)
    return {error: "no result"}

  return {
    name: name,
    type: meta.type,
    duration: meta.duration,
    power: meta.power,
    inputs: getRecipeIO(meta.id, false),
    outputs: getRecipeIO(meta.id, true),
  }
}

function isSameResource(a: string, b: string) {
  const expandA = expandResource(a)
  if (expandA.includes(b)) return {result: true}
  const expandB = expandResource(b)
  if (expandA.filter(element => expandB.includes(element)).length != 0)
    return {result: true}
  return {result: false}
}

function getResourceType(resource: string) {
  resource = sanitizeInput(resource)

  let type = resource.startsWith("#") ?
    db
      .prepare<any[], any>(`select type from tags where name = '${resource}'`)
      .get()?.type
    :
    db
      .prepare<any[], any>(`select type from resources where name = '${resource}'`)
      .get()?.type

  return {
    resourceType: type
  }
}

function getRecipeIO(id: number, isOutput: boolean) {
  const table = isOutput ? "recipeOutputs" : "recipeInputs"
  return db
    .prepare<any[], any>(`select resource, type, count from ${table} where id = ${id}`)
    .all()
    .map(row => {
      return {
        resource: row.resource,
        type: row.type,
        quantity: row.count
      }
    })
}

function sanitizeInput(input: string) {
  if (input == null) return ""
  return input
    .replace(/'/gi, "")
    .replace(/\\/gi, "\\\\")
}

function likeSanitizeInput(input: string) {
  return sanitizeInput(input)
    .replace(/_/gi, "\\_")
    .replace(/%/gi, "\\%")
    .replace(/\[/gi, "\\[")
    .replace(/\^/gi, "\\^")
}
