export {setupConnectionsSvg}

window.onload = setupConnectionsSvg
window.onresize = setupConnectionsSvg

function setupConnectionsSvg() {
  let svg = document.getElementById("connections")!
  let width = window.innerWidth
  let height = window.innerHeight
  svg.setAttribute("width", `${width}`)
  svg.setAttribute("height", `${height}`)
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`)
}
