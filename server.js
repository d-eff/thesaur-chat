var io = require('socket.io').listen(80);

io.sockets.on('connection', function(socket){
  socket.on('messageSend', function(data){
    socket.broadcast.emit('messageBroadcast', {message : data.message});
  });
});
