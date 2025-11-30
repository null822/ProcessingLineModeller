function createElement(name) {
  let template = document.getElementById(name + "-template")
  return template.content.firstElementChild.cloneNode(true)
}
