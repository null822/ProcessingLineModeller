import * as http from "node:http";
import Database from "better-sqlite3";

// export { requestListener }
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
    case "/search_recipes":
      response.writeHead(200, {'Content-Type': 'application/json'})
      response.end(JSON.stringify(searchRecipes(query.input, query.output)))
      return 200
    case "/search":
      response.writeHead(200, {'Content-Type': 'application/json'})
      response.end(JSON.stringify(searchResources(query.q)))
      return 200
    case "/expand":
      response.writeHead(200, {'Content-Type': 'application/json'})
      response.end(JSON.stringify(expandResource(query.q)))
      return 200
    default:
      return 404
  }
}


function searchResources(query: string) {
  if (query == undefined) return []
  let resources: string[]
  if (query.startsWith("#")) {
    resources = db
      .prepare<any[], any>(`select name from tags where name like '${query}%'`)
      .all()
      .map(row => row.name)
  } else {
    resources = db
      .prepare<any[], any>(`select name from resources where name like '%${query}%'`)
      .all()
      .map(row => row.name)
    resources.push(...db
        .prepare<any[], any>(`select name from tags where name like '%${query}%'`)
        .all()
        .map(row => row.name))
  }
  resources.sort((a, b) => a.length - b.length)

  return resources
}

function searchRecipes(input: string, output: string) {
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

  return db
    .prepare<any[], any>(`select name, type, id from recipes where id in (${entries.join(", ")})`)
    .all()
    .reduce((result, row) => {
      if (result[row.type] == undefined) result[row.type] = {}
      result[row.type][row.name] = {
        inputs: db
          .prepare<any[], any>(`select resource, count from recipeInputs where id = ${row.id}`)
          .all()
          .reduce(((result, row) => {
            result[row.resource] = row.count
            return result
          }), {}),
        outputs: db
          .prepare<any[], any>(`select resource, count from recipeOutputs where id = ${row.id}`)
          .all()
          .reduce(((result, row) => {
            result[row.resource] = row.count
            return result
          }), {}),
      }
      return result
    }, {})
}

/**
 * Searches the database for every resource and tag that is represented by the resource supplied
 */
function expandResource(resource: string) {
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
