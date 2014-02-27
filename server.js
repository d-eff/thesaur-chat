var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    fancy = require('./thesaurize');

var names = ["John", "Mary", "William", "Dorothy", "Robert", "Helen", "James", "Margaret", "Charles", "Ruth", "George", "Mildred", "Joseph", "Virginia", "Edward", "Elizabeth", "Frank", "Frances", "Richard", "Anna"],
    users = {};

var serverColor = "green",
    serverHandle = "Server";

server.listen(8080);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendfile('index.html');
});


//TODO: ability to review original message content
//TODO: ability to regen message translation
//TODO: private messaging
//TODO: rooms
//TODO: server commands? (/command, emotes)
//TODO: ability to upvote specific words?
//TODO: parse punctuation correctly
//TODO: dry it up
io.sockets.on('connection', function(socket){
  //generate a new (temp?) nickname on first connect
  //something something bitwise OR only works up to 32-bit signed ints
  //whatever I like it and it's faster than typing Math.floor()
  var tempNick = names[Math.random()*names.length|0]  + (Math.random()*65535|0).toString();

  //check for nickname uniqueness, keep genning them as needed.
  //but seriously, what are the odds? (1:~1.3m)
  while(users.hasOwnProperty(tempNick)){
     tempNick = names[Math.random()*names.length|0]  + (Math.random()*65535|0).toString();
  }

  //set initial nickname and announce entrance
  socket.set('nickname', tempNick, function(){

    //generate a color
    var color = '#'+Math.floor(Math.random()*16777215).toString(16);

    //set the color, add the user to the user list
    socket.set('color', color, function(){
      users[tempNick] = color;
      io.sockets.emit('update userlist', users);
    });

    //announce
    var msg = tempNick + " has joined."; 
    io.sockets.emit('messageBroadcast', {message : msg, nickname : serverHandle, color : serverColor, original : msg});
  });
  

  //manual nickname change
  socket.on('set nickname', function(data){
    socket.get('nickname', function(err, nick){
      //ensure someone doesn't claim a handle that's currently taken
      if(!users.hasOwnProperty(data.newNick)){

        //get their color, add their new nickname to the user list
        socket.get('color', function(err, color){
          users[data.newNick] = color;
        })

        //take their old nickname out of the user list
        delete users[nick];

        socket.set('nickname', data.newNick, function(){
          var msg = nick + " changed name to " + data.newNick;

          //broadcast change
          io.sockets.emit('messageBroadcast', {message : msg, nickname : serverHandle, color : serverColor, original : msg});

          //update userList on user end
          io.sockets.emit('update userlist', users);
        });
      } else {
        socket.emit('error', { message : "Sorry, that name is taken." });
      }
    });
  });

  //we got a message!
  socket.on('messageSend', function(data){
    //translate message
    fancy.fancify(data.message, function(msg){ 
    //get their  nickname
    socket.get('nickname', function(err, nick){
      //get their color
      socket.get('color', function(err, color){
        //send the message to err'one
        io.sockets.emit('messageBroadcast', {message : msg, nickname : nick, color : color, original : data.message});
      })
    })
    
    });
  });

  //announce disconnects
  socket.on('disconnect', function(){
    socket.get('nickname', function(err, nick){
      var msg = nick + " has left the room.";
      //take their nickname out of the user list
      delete users[nick];
      io.sockets.emit('messageBroadcast', {message : msg, nickname : serverHandle, color : serverColor, original : msg});
      io.sockets.emit('update userlist', users);
    });
  })
});

