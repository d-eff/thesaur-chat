var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    fancy = require('./app');

var names = ["John", "Mary", "Wiliam", "Dorothy", "Robert", "Helen", "James", "Margaret", "Charles", "Ruth", "George", "Mildred", "Joseph", "Virginia", "Edward", "Elizabeth", "Frank", "Frances", "Richard", "Anna"];


server.listen(8080);

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.sockets.on('connection', function(socket){
  

  //we got a message!
  socket.on('messageSend', function(data){
    //translate message
    fancy.fancify(data.message, function(msg){ 
    //send it to err'one
    io.sockets.emit('messageBroadcast', {message : msg});
    
    });
  });
});
