# Processing Line Modeller


## Running

### parseRecipes
This script parses the recipe data in `raw_data` and stores it in `db/recipes.sqlite`.
Obtaining the files from a 1.20.1 minecraft instance is as follows:

#### recipes.json
1. Install [Kubejs](https://modrinth.com/mod/kubejs)
2. Create a new `.js` file in `.minecraft/kubejs/server_scripts`  with the following code inside:
```js
ServerEvents.recipes(event => {
    let recipes = {}
    event.forEachRecipe({}, r => {
        let json = r.json.toString()
        recipes[r.id] = JSON.parse(json)
    })
    console.log(`Recipe Dump: ${JSON.stringify(recipes)}`)
})
```
3. Open a world in game
4. Copy the output from either the kubejs log (`.minecraft/logs/kubejs/server.log`) or the mc log (`.minecraft/logs/latest.log`) into a the `raw_data/recipes.json` file in this project

#### tags/*
1. Install [Recipe Dumper](https://modrinth.com/mod/recipedumper)
2. Open a world in game
3. Run the command `/dump tags`
4. Copy the folder `.minecraft/dumps/tags` into `/raw_data`

#### items.json and fluids.json
1. Install [Kubejs](https://modrinth.com/mod/kubejs)
2. Open a world in game
3. Run the command `/kubejs dump_registry minecraft:item`
4. Copy result from the mc log (`.minecraft/logs/latest.log`) into `raw_data/items.json` and format the contents as a JSON list (ie. `["example:example1", "example:example2", ...]`)
5. Repeat for fluids (`/kubejs dump_registry minecraft:fluid` and `raw_data/fluids.json`)
