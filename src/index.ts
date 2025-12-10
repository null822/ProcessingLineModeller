import './css/constants.css';
import './css/main.css';
import './css/static-ui.css';
import './css/recipe-selector.css';
import './css/recipe.css';

import * as a from './ts/constants'
import * as b from './ts/dragging'
import * as c from './ts/evaluation'
import * as d from './ts/recipe-connections'
import * as e from './ts/recipe-selection'
import * as f from './ts/recipes'
import * as g from './ts/setup'
import * as h from './ts/util'

let imports: any[] = [a, b, c, d, e, f, g, h]
let exports: any = {}
for (const i of imports) {
  for (const e in i) {
    exports[e] = i[e]
  }
}
export default exports
