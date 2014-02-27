var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    fancy = require('./thesaurize');

var names = ["John", "Mary", "William", "Dorothy", "Robert", "Helen", "James", "Margaret", "Charles", "Ruth", "George", "Mildred", "Joseph", "Virginia", "Edward", "Elizabeth", "Frank", "Frances", "Richard", "Anna"],
    users = [];


server.listen(8080);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendfile('index.html');
});


//TODO: ability to review original message content
//TODO: ability to regen message translation
//TODO: private messaging
//TODO: rooms
//TODO: server commands?
//TODO: ability to upvote specific words?
//TODO: prevent empty messages
//TODO: parse punctuation correctly
//TODO: user list?
//TODO: user colors?
io.sockets.on('connection', function(socket){
  //generate a new (temp?) nickname on first connect
  //something something bitwise or only works up to 32-bit signed ints
  //whatever I like it and it's faster than typing Math.floor()
  //TODO: nickname uniqueness
  var tempNick = names[Math.random()*names.length|0]  + (Math.random()*65535|0).toString();
  socket.set('nickname', tempNick, function(){
    var msg = tempNick + " has joined."; 
    io.sockets.emit('messageBroadcast', {message : msg, nickname : "Server"})
  })

  //manual nickname change
  socket.on('set nickname', function(data){
    socket.get('nickname', function(err, nick){  
      socket.set('nickname', data.newNick, function(){
        var msg = nick + " changed name to " + data.newNick;
        io.sockets.emit('messageBroadcast', {message : msg, nickname : "Server"});
      });
    });
  });

  //we got a message!
  socket.on('messageSend', function(data){
    //translate message
    fancy.fancify(data.message, function(msg){ 
    //get the nickname
    socket.get('nickname', function(err, nick){
      //send the message to err'one
      io.sockets.emit('messageBroadcast', {message : msg, nickname : nick});
    })
    
    });
  });

  //announce disconnects
  socket.on('disconnect', function(){
    socket.get('nickname', function(err, nick){
      var msg = nick + " has left the room.";
      io.sockets.emit('messageBroadcast', {message : msg, nickname : "Server"});
    });
  })

});
