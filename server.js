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

/*app.get('/', function(req, res){
  res.sendfile('index.html');
});*/

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
    io.sockets.emit('chat message', {message : msg, nickname : serverHandle, color : serverColor});
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
          io.sockets.emit('chat message', {message : msg, nickname : serverHandle, color : serverColor});

          //update userList on user end
          io.sockets.emit('update userlist', users);
        });
      } else {
        socket.emit('chat message', { message : "Sorry, that name is taken.", nickname: serverHandle, color: "red" });
      }
    });
  });

  //we got a message!
  socket.on('messageSend', function(data){
    //first word start with slash? we've got a server command
    data.message = sanitizeMessage(data.message);
    if(data.message.match(/^\//)){ 
      var cmd = data.message.split(' ')[0],
          cmdLength = cmd.length;
          msg = data.message.substr(cmdLength+1, data.message.length);
      if(cmd === '/em' || cmd === '/me'){
        socket.get('nickname', function(err, nick){
          socket.get('color', function(err, color){
            io.sockets.emit('emote', {message : msg, nickname : nick, color: color});
          })
        })
      } else if (cmd === '/roll'){
        socket.get('nickname', function(err, nick){
          socket.get('color', function(err, color){ 

            var numOfDice = msg.split('d')[0],
                sides = msg.split('d')[1],
                total = 0,
                diceMsg = " rolls " + numOfDice + "d" + sides + ". Results: ";

            for(var x = 0; x < numOfDice; ++x){
              var result = (Math.random()*sides|0)+1;
              total += result;
              diceMsg += result.toString() + " ";
            }
            diceMsg += "Total: " + total.toString();
            io.sockets.emit('emote', {message: diceMsg, nickname: nick, color:color});
          })
        })    
      }
    } else {
      //translate message
      fancy.fancify(data.message, function(msg){ 
      //get their  nickname
      socket.get('nickname', function(err, nick){
        //get their color
        socket.get('color', function(err, color){
          //send the message to err'one
          io.sockets.emit('chat message', {message : msg, nickname : nick, color : color, original : data.message});
        })
      })
      
      });
    }
  });

  socket.on('vote', function(data){
    console.log("vote received: " + data.syn + " for " + data.orig + " : " + data.dir); 
  });

  //announce disconnects
  socket.on('disconnect', function(){
    socket.get('nickname', function(err, nick){
      var msg = nick + " has left the room.";
      //take their nickname out of the user list
      delete users[nick];
      io.sockets.emit('chat message', {message : msg, nickname : serverHandle, color : serverColor});
      io.sockets.emit('update userlist', users);
    });
  })
});

function sanitizeMessage(message){
  return ('' + message).replace(/&/g, '&amp;').
                        replace(/</g, '&lt;').
                        replace(/>/g, '&gt;').
                        replace(/"/g, '&quot;').
                        replace(/'/g, '&#x27;').
                        replace(/\//g, '&#x2F;');
}
            
