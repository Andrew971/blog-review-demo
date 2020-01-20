import app from './index'
import { logger } from './utils'

// Start the server
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => {
    logger.info('Express server started on port: ' + port)
});

process.on('SIGINT', function onSigint () {
	console.info('Got SIGINT (aka ctrl-c in docker). Graceful shutdown ', new Date().toISOString())
  shutdown()
});

// quit properly on docker stop
process.on('SIGTERM', function onSigterm () {
  console.info('Got SIGTERM (docker container stop). Graceful shutdown ', new Date().toISOString())
  shutdown()
})

interface Socket {
  [key: string]: any
}

let sockets: Socket = {}, nextSocketId = 0;
server.on('connection', function (socket) {
  const socketId = nextSocketId++
  sockets[`${socketId}`] = socket

  socket.once('close', function() {
    delete sockets[`${socketId}`]
  })
})

// shut down server
function shutdown() {
  waitForSocketsToClose(10)

  server.close(function onServerClosed (err) {
    if (err) {
      console.error(err)
      process.exitCode = 1
    }
    process.exit()
  })
}

function waitForSocketsToClose(counter: number) {
  if (counter > 0) {
    console.log(`Waiting ${counter} more ${counter === 1 ? 'seconds' : 'second'} for all connections to close...`)
    return setTimeout(waitForSocketsToClose, 1000, counter - 1)
  }
  
  console.log("Forcing all connections to close now")
  for (var socketId in sockets) {
    sockets[`${socketId}`].destroy()
  }
}
