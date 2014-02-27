
//connect to the server
//TODO: style

var socket = io.connect();

var msgDisplay = document.getElementById('messageDisplay'),
msgInput = document.getElementById('messageInput'),
sendButton = document.getElementById('messageSend'),
nickInput = document.getElementById('nickInput'),
nickChange = document.getElementById('nickChange');


//click the send button or press 'enter' to send a message
sendButton.addEventListener('click', sendMessage);
document.addEventListener('keydown', function(ev){
  if(ev.keyCode === 13){
    sendMessage();
  }
});

//receive a broadcast
socket.on('messageBroadcast', function(data){
  msgDisplay.innerHTML += data.nickname + ": " + data.message + '<br>';
});

nickChange.addEventListener('click', function(ev){
  console.log("changing Nickname to " + nickInput.value);
  if(nickInput.value !== ""){
    socket.emit('set nickname', {newNick : nickInput.value});
    nickInput.value = "";
  }
});

//send a message, unless the field is empty
function sendMessage(){
  if(msgInput.value !== ""){
    socket.emit('messageSend', {message : msgInput.value});  
    msgInput.value = "";
  }
}
