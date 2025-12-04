import * as http from "node:http";

let sqlite3 = require('sqlite3')

const resources = new sqlite3.Database('db/resources.sqlite');

resources.serialize(() => {
  resources.run("drop table test");
  resources.run("create table test (info text)");

  const stmt = resources.prepare("insert into test values (?)");
  for (let i = 0; i < 10; i++) {
    stmt.run(i);
  }
  stmt.finalize();

  resources.each("select rowid as id, info from test", (err, row) => {
    console.log(row.id + ": " + row.info);
  });
});


const server = http.createServer(requestListener);
const port = 3306;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

async function requestListener(request: http.IncomingMessage, response: http.ServerResponse) {
  const url = request.url
  // const path = host

  switch (url) {
    case "/test": test(response); break;
    default: notFound(response); break;
  }
}

function notFound(response: http.ServerResponse) {
  response.writeHead(404, {'Content-Type': 'text/json'});
  response.end(`{"error": "not found"}`);
}

function test(response: http.ServerResponse) {
  response.writeHead(200, {'Content-Type': 'text/json'});

  let content = "["

  resources.each("select rowid as id, info from test", (err, row) => {
    content += `"${row.info}",`
  }, (err, count) => {
    content = content.substring(0, content.length - 1)
    content += "]"
    console.log(content)
    response.end(content);
  });
}
