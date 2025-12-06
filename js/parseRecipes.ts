import * as fs from "node:fs";
import Database = require('better-sqlite3');

const db = new Database('db/recipes.sqlite');

let tagId = 0
let recipeId = 0;


main()

function main() {
  reset()

  console.log("Parsing Tags")
  db.prepare("begin transaction").run()
  loadTags()
  db.prepare("commit").run()

  console.log("Parsing Recipes")
  db.prepare("begin transaction").run()
  loadRecipes()
  db.prepare("commit").run()

  console.log("Complete")
  db.close()
}

function reset() {
  db.prepare("drop table recipes").run()
  db.prepare("drop table recipeInputs").run()
  db.prepare("drop table recipeOutputs").run()
  db.prepare("drop table tags").run()
  db.prepare("drop table tagContents").run()

  db.prepare("create table recipes (id int, name text, type text, duration int, power int)").run()
  db.prepare("create table recipeInputs (id int, isLiquid boolean, resource text, count int)").run()
  db.prepare("create table recipeOutputs (id int, isLiquid boolean, resource text, count int)").run()

  db.prepare("create table tags (id int, name int, isLiquid boolean)").run()
  db.prepare("create table tagContents (id int, resource text)").run()
}

function loadRecipes() {
  const recipeData = JSON.parse(fs.readFileSync(`${__dirname}/../raw_data/recipes.json`, 'utf8'))
  for (const name in recipeData) {
    const recipe = recipeData[name]
    const type: string = recipe.type;

    if (type.startsWith("gtceu")) {
      const tickInputs = recipe.tickInputs
      const eu: any[] = (tickInputs !== undefined && "eu" in tickInputs) ? tickInputs.eu : undefined
      const power: number = (eu !== undefined && "content" in eu[0]) ? parseInt(JSON.stringify(eu[0].content)) : 0

      db.prepare(`insert into recipes(id, name, type, duration, power)
              values (${recipeId},
                      '${name}',
                      '${type}',
                      ${recipe.duration ?? 0},
                      ${power})`
      ).run()
      if ("inputs" in recipe) {
        if ("item" in recipe.inputs) {
          for (const input of recipe.inputs.item) {
            decodeItemContent(input.content, recipeId, "recipeInputs")
          }
        }
        if ("fluid" in recipe.inputs) {
          for (const input of recipe.inputs.fluid) {
            decodeFluidContent(input.content, recipeId, "recipeInputs")
          }
        }
      }
      if ("outputs" in recipe) {
        if ("item" in recipe.outputs) {
          for (const output of recipe.outputs.item) {
            decodeItemContent(output.content, recipeId, "recipeOutputs")
          }
        }
        if ("fluid" in recipe.outputs) {
          for (const output of recipe.outputs.fluid) {
            decodeFluidContent(output.content, recipeId, "recipeOutputs")
          }
        }
      }

    } else { // TODO: non-gtceu recipe support
      // db.prepare(`insert into recipes (recipeId, type, mod, duration, power)
      //         values ('${recipeId}', '${type}', '${mod}', 0, 0)`).run()
    }

    recipeId++;
  }
}

function loadTags() {
  const itemTagPath = `${__dirname}/../raw_data/tags/items`
  const itemTagPathEnd = itemTagPath.length + 1
  for (const file of getAllFiles(itemTagPath)) {
    const fileName = file.substring(itemTagPathEnd, file.length)
    const name = fileName.substring(0, fileName.indexOf(".")).replace("/", ":")

    storeTag(`#${name}`, false, JSON.parse(fs.readFileSync(file, 'utf8')))
  }
  const fluidTagPath = `${__dirname}/../raw_data/tags/fluids`
  const fluidTagPathEnd = fluidTagPath.length + 1
  for (const file of getAllFiles(fluidTagPath)) {
    const fileName = file.substring(fluidTagPathEnd, file.length)
    const name = fileName.substring(0, fileName.indexOf(".")).replace("/", ":")

    storeTag(`#${name}`, true, JSON.parse(fs.readFileSync(file, 'utf8')))
  }
}

/**
 * Returns an array of every file in a folder (deep search)
 * @param folder the folder to search
 */
function getAllFiles(folder: string) {
  const items: fs.Dirent[] = fs.readdirSync(folder, {withFileTypes: true})
  const files: string[]  = []
  for (const item of items) {
    const path = `${folder}/${item.name}`
    if (item.isDirectory()) {
      files.push(...getAllFiles(path))
    }
    else if (item.isFile()) {
      files.push(path)
    }
  }
  return files
}

function decodeItemContent(content: any, recipeId: number, table: string) {
  switch (content.type) {
    case "gtceu:circuit":
      storeRecipeIo(table, recipeId, false, "gtceu:circuit", content.configuration)
      break
    case "gtceu:sized":
      storeRecipeIo(table, recipeId, false, decodeIngredient(content.ingredient), content.count ?? 1)
      break
    case "forge:intersection":
      let tags: string[] = content.children.map((x: any) => decodeIngredient(x))
      let rows = []
      for (const tag of tags) {
        const result: any = db.prepare(`select id from tags where name = '${tag}'`).get()
        rows.push(result.id)
      }
      let intersection = []
      for (const row of rows) {
        let entries: any[] = db.prepare(`select resource from tagContents where id = ${row}`)
          .all().map((row: any) => row.resource)
        if (intersection.length === 0) intersection = entries
        else intersection = intersection.filter(value => entries.includes(value)); // calculate intersection
      }
      if (intersection.length == 1) {
        storeRecipeIo(table, recipeId, false, intersection[0], content.count ?? 1)
      } else {
        const tagName = `#plm_intersection:${recipeId}`
        storeTag(tagName, false, intersection)
        storeRecipeIo(table, recipeId, false, tagName, content.count ?? 1)
      }
      break
    default:
      console.log(`Unknown item content type: ${content.type}`)
      throw `Unknown item content type: ${content.type}`
  }
}

function decodeFluidContent(content: any, recipeId: number, table: string) {
  for (const ingredient of content.value) {
    storeRecipeIo(table, recipeId, true, decodeIngredient(ingredient), content.amount)
  }
}

function decodeIngredient(ingredient: any) {

  if ("item" in ingredient)
    return ingredient.item
  if ("fluid" in ingredient)
    return ingredient.fluid
  if ("tag" in ingredient)
    return `#${ingredient.tag}`

  console.log(`unknown ingredient: ${JSON.stringify(ingredient)}`)
  throw `unknown ingredient: ${JSON.stringify(ingredient)}`

}

function storeRecipeIo(table: string, recipeId: number, isFluid: boolean, resource: string, count: number) {
  db.prepare(`insert into ${table} (id, isLiquid, resource, count)
    values ('${recipeId}', '${isFluid}', '${resource}', '${count}')`).run()
}

function storeTag(name: string, isLiquid: boolean, contents: string[]) {

  db.prepare(`insert into tags (id, name, isLiquid) values (${tagId}, '${name}', ${isLiquid})`).run()
  for (const entry of contents) {
    db.prepare(`insert into tagContents (id, resource) values (${tagId}, '${entry}')`).run()
  }
  tagId++

  return tagId - 1
}
