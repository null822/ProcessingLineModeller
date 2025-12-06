import * as http from "node:http";

import Database = require('better-sqlite3');
const db = new Database('db/recipes.sqlite', {readonly: true});

const server = http.createServer(requestListener);
const port = 3306;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

async function requestListener(request: http.IncomingMessage, response: http.ServerResponse) {
  const url = request.url

  response.setHeader('Access-Control-Allow-Origin', '*')

  const separatorIndex = url.indexOf("?")
  const path = url.substring(0, separatorIndex)
  const query = decodeURIComponent(url.substring(separatorIndex + 1, url.length))
    .split("&")
    .map(q => q.split("="))
    .reduce<any>((res, q) => {
      res[q[0]] = q[1]
      return res
    }, {})

  console.log(`${path} ${JSON.stringify(query)}`)

  switch (path) {
    case "/get_recipes":
      response.writeHead(200, {'Content-Type': 'application/json'})
      const recipes = getRecipes(query.resource)
      response.end(JSON.stringify(recipes))
      break
    case "/search":
      response.writeHead(200, {'Content-Type': 'application/json'})
      const resources = searchResources((query.tag == "true" ? "#" : "") + query.q)
      response.end(JSON.stringify(resources))
      break
    default:
      response.writeHead(404, {'Content-Type': 'application/json'})
      response.end(`{"error": "not found"}`)
      break
  }
}

function searchResources(resource: string) {
  return {error: "not yet implemented"}
}

function getRecipes(resource: string) {
  let resources: string[]
  if (resource.startsWith("#")) {
    resources =
      db.prepare<any[], any>(`select id from tags where name = '${resource}'`)
        .all()
        .map(row =>
          db.prepare<any[], any>(`select resource from tagContents where id = '${row.id}'`)
            .all()
            .map(row => row.resource))
        .flat()
  } else {
    resources =
      db.prepare<any[], any>(`select id from tagContents where resource = '${resource}'`)
        .all()
        .map(row => db.prepare<any[], any>(`select name from tags where id = ${row.id}`).get())
        .map(row => row.name)
  }
  resources.push(resource)

  let entries: number[] = resources
    .map(resource => db
      .prepare<any[], any>(`select id from recipeOutputs where resource = '${resource}'`)
      .all()
      .map<number>(row => row.id))
    .flat()

  let recipes = db
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

  return recipes
}
