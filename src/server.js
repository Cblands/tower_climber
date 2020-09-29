let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io').listen(server);
let players = {};

app.use(express.static(__dirname + '/client'));

app.get('/', function (req, res){
    res.sendFile(__dirname + '/index.html')
});

io.on('connection', function (socket) {
   console.log('User joined');
   /* Player information */
   players[socket.id] = {
       playerId: socket.id,
   };
   socket.emit('currentPlayers', players);
   socket.broadcast.emit('newPlayer', players[socket.id]);
   socket.on('disconnect', function() {
      console.log('User left');
      delete players[socket.id];
      io.emit('disconnect', socket.id);
   });
});

server.listen(4200, function (){
   console.log(`Listening on ${server.address().port}`);
});
