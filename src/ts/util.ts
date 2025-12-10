export {createElement, createElementFlat}

function createElement(name: string) {
  let template = <HTMLTemplateElement>document.getElementById(name + "-template")
  if (template == null) throw `template for ${name} was not found!`
  const element = template.content.firstElementChild?.cloneNode(true)
  if (element == null) throw `template for ${name} was not found!`
  return <HTMLElement>element
}

function createElementFlat(name: string, innerHTML: string) {
  let template = <HTMLTemplateElement>document.getElementById(name + "-template")
  if (template == null) throw `template for ${name} was not found!`
  const element = <HTMLElement>template.content.firstElementChild?.cloneNode(false)
  if (element == null) throw `template for ${name} was not found!`
  element.innerHTML = innerHTML
  return element
}
