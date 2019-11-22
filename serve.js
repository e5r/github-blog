const process = require('process')
const http = require('http')
const finalhandler = require('finalhandler')
const serveStatic = require('serve-static')
const PORT = process.env.PORT || 3000

let middleware = serveStatic('wwwroot', { 'index': ['index.html'] })
let server = http.createServer((req, res) => {
    let done = finalhandler(req, res)

    middleware(req, res, done)
})

server.listen(PORT, () => {
    console.info(`Listening on http://localhost:${PORT}`)
})

