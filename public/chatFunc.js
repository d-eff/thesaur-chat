
//connect to the server
//TODO: style
//TODO: prevent illegal characters in usernames

var socket = io.connect();
var messages = [],
    messageIndex = 0;
var autoscrollEnable = true;

var msgDisplay = document.getElementById('messageDisplay'),
    msgInput = document.getElementById('messageInput'),
    sendButton = document.getElementById('messageSend'),
    nickInput = document.getElementById('nickInput'),
    nickChange = document.getElementById('nickChange');

//*******EVENT LISTENERS

//click the send button or press 'enter' to send a message
sendButton.addEventListener('click', sendMessage);
document.addEventListener('keydown', function(ev){
  //enter
  if(ev.keyCode === 13){
    sendMessage();
  }
  //up
  if(ev.keyCode === 38){
    nextMessage();
  }
  if(ev.keyCode === 40){
    prevMessage();
  }
});

//event listener for name change button
nickChange.addEventListener('click', function(ev){
  console.log("changing Nickname to " + nickInput.value);
  //make sure they've provided us with something
  if(nickInput.value !== ""){
    socket.emit('set nickname', {newNick : nickInput.value});
    nickInput.value = "";
  }
});

//is it cheaper/better to use a flag like this?
//or should I just use document.activeElement === msgDisplay?
//atm I'm only checking for this case
msgDisplay.addEventListener('focus', function(ev){
  autoscrollEnable = false;
});
msgDisplay.addEventListener('blur', function(ev){
  autoscrollEnable = true;
});


//*********HELPER FUNCTIONS

//send a message, unless the field is empty
function sendMessage(){
  if(msgInput.value !== ""){
    messages.push(msgInput.value);
    
    //keep local message history short
    if(messages.length > 20){
      messages.shift();
    }
    messageIndex = messages.length;

    socket.emit('messageSend', {message : msgInput.value});  
    msgInput.value = "";
  }
}

//pressing up accesses last message
//messages are stored in the messages array 
function nextMessage(){
  if(messageIndex > 0){
    messageIndex--;
  }
  if(messages.length > 0){
    msgInput.value = messages[messageIndex];
  }
}

//push down to access messages in the other direction
//if they're at the last message, show a blank
function prevMessage(){
  if(messageIndex < messages.length){
    messageIndex++;
  }
  if(messageIndex < messages.length){
    msgInput.value = messages[messageIndex];
  } else {
    msgInput.value = "";
  }
}

//******SOCKET EVENTS************

//receive a broadcast
socket.on('messageBroadcast', function(data){
  msgDisplay.innerHTML += "<span style=\"color:" + data.color + "\">" + data.nickname + ":</span>&nbsp;" + data.message + '<br>' + "orig: " + data.original + '<br>';


  if(autoscrollEnable){
    msgDisplay.scrollTop = msgDisplay.scrollHeight;
  }

});

//update user list
socket.on('update userlist', function(data){
  var uList = document.getElementsByClassName('userList')[0],
      oldList = uList.firstChild,
      ul = document.createElement('ul');

  //loop through user list
  for(var iter in data){
    var li = document.createElement('li');
    li.textContent = iter;
    li.style.color = data[iter];
    ul.appendChild(li);
  }
  
  //remove old list and append new one
  oldList.parentNode.removeChild(oldList);
  uList.appendChild(ul);
})

//handle errors that we want announced to the user
socket.on('error', function(data){ 
  msgDisplay.innerHTML += "<span style=\"color:red\">" + data.message + "</span><br>";
})






