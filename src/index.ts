import './styles.css';
import * as a from './ts/dragging'
import * as b from './ts/recipe-connections'
import * as c from './ts/recipe-selection'
import * as d from './ts/recipes'
import * as e from './ts/setup'
import * as f from './ts/util'

let imports: any[] = [a, b, c, d, e, f]
let exports: any = {}
for (const i of imports) {
  for (const e in i) {
    exports[e] = i[e]
  }
}
export default exports
