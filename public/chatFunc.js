
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
  msgDisplay.innerHTML += "<span style=\"color:" + data.color + "\">" + data.nickname + ":</span> " + data.message + '<br>';
});

//event listener for name change button
nickChange.addEventListener('click', function(ev){
  console.log("changing Nickname to " + nickInput.value);
  //make sure they've provided us with something
  //TODO: prevent like, spaces and stuff
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

//update user list
socket.on('update userlist', function(data){
  var uList = document.getElementsByClassName('userList')[0],
      oldList = uList.firstChild,
      ul = document.createElement('ul');

  for(var iter in data){
    var li = document.createElement('li');
    li.textContent = iter;
    li.style.color = data[iter];
    ul.appendChild(li);
  }
  
  oldList.parentNode.removeChild(oldList);
  uList.appendChild(ul);
})

//handle errors that we want the user to see
socket.on('error', function(data){ 
  msgDisplay.innerHTML += "<span style=\"color:red\">" + data.message + "</span><br>";
})






