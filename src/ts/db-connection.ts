export {queryDatabase}

async function queryDatabase(path: string, query: any) {
  let queryStr = ""
  for (const parameter in query) {
    queryStr += `${parameter}=${query[parameter]}&`
  }
  queryStr = queryStr.substring(0, queryStr.length - 1)

  let response = await fetch(`/${path}?${encodeURIComponent(queryStr)}`)
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  return await response.json();
}
