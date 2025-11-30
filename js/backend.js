let mysql = require('mysql2');

let con = mysql.createConnection({
  host: "mysql.datagrip-dbs.intellij.net",
  user: "datagrip",
  password: "datagrip",
  database: "datagrip"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});


const http = require('http');

const server = http.createServer(
  (req, res) => {
    console.log(req.headers)
    console.log("asdf")
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello, World!\n');
});

const port = 3306;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
