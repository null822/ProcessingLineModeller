import express from 'express'
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'

const app = express()
import config from './webpack.config.js'
import backendHandleRequest from './backend/backend.ts'
const compiler = webpack(config);

const webpackMiddleware = webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath,
})

app.use(function (req, res, next) {
  backendHandleRequest(req, res)
    .then((status) => {
      const url = decodeURIComponent(req.url)
      if (status === 404) {
        console.log(`website: ${url}`);
        webpackMiddleware(req, res, next)
          .then(() => next())
      } else {
        console.log(`  api  : ${url}`);
      }
    })
});

const port = 80;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
})
