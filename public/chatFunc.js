var socket = io.connect();
var messages = [],
    messageIndex = 0;

var msgDisplay = document.getElementById('messageDisplay'),
    msgList = document.getElementById('messageList'),
    msgInput = document.getElementById('messageInput'),
    sendButton = document.getElementById('messageSend'),
    nickInput = document.getElementById('nickInput'),
    nickChange = document.getElementById('nickChange'),
    upvote = document.getElementById('upvote'),
    downvote = document.getElementById('downvote');

var innerVoteBoxThing = document.getElementById('innerVote'),
    arrowBox = document.getElementsByClassName('voteArrows')[0];

var voter = {
  originalTerm : null,
  synonym: null,
  vote: function(ev, direction){
    if(ev){
      ev.preventDefault();
    }
    innerVoteBoxThing.classList.toggle('visible');
    socket.emit('vote', {orig: this.originalTerm, syn: this.synonym, dir: direction});
  }
}

//*******EVENT LISTENERS

//click the send button or press 'enter' to send a message
sendButton.addEventListener('click', sendMessage);

document.addEventListener('keydown', function(ev){
  //enter
  if(ev.keyCode === 13){
    if(document.activeElement === nickInput){
      changeNick()
    } else {
      sendMessage();
    }
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
nickChange.addEventListener('click', changeNick);

upvote.addEventListener('click', function(ev){
  voter.vote(ev, 'up');
})

downvote.addEventListener('click', function(ev){
  voter.vote(ev, 'down');
})
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

function receiveMessage(data){
  var display = document.createElement('li');
  display.classList.add('dispMessage');
  display.innerHTML = "<span class=\"name\" style=\"color:" + data.color + "\">" + data.nickname + ":</span>&nbsp;" + data.message;
  msgList.appendChild(display);
  
  if(data.original){ 
    original = document.createElement('li');
    original.classList.add('original');
    original.innerHTML = "<span class=\"name\" style=\"color:" + data.color + "\">" + data.nickname + ":</span>&nbsp;";
    var dterms = data.message.split(' ');
    var oterms = data.original.split(' ');
    for(var x = 0; x < oterms.length; ++x){
      var l = "<a href=\"#\" class=\"word\" data-orig=\"" + dterms[x]  + "\">" + oterms[x] + "</a>&nbsp;"
      original.innerHTML += l;
    }
    data.original; 
    msgList.appendChild(original);

    original.addEventListener('click', function(e){
  
      e.preventDefault();
      if(e.target.nodeName === "A"){
      var synTerm = document.getElementById('syn'),
          origTerm = document.getElementById('orig');

      voter.originalTerm = origTerm.innerHTML = e.target.dataset.orig;
      voter.synonym = synTerm.innerHTML = e.target.innerHTML;

      if(!innerVoteBoxThing.classList.contains('visible')){
        innerVoteBoxThing.classList.add('visible');
      }
      }
    });
  }
  //autoscroll the chat box to the bottom
  if(document.activeElement !== msgDisplay){
    msgDisplay.scrollTop = msgDisplay.scrollHeight;
  }
}

function changeNick(){
  //make sure they've provided us with something
  if(nickInput.value !== ""){
    socket.emit('set nickname', {newNick : nickInput.value});
    nickInput.value = "";
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

//receive a message
socket.on('chat message', receiveMessage);

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
  var err = document.createElement('li');
  err.innerHTML = "<span style=\"color:red\">" + data.message + "</span>";

  msgList.appendChild(err)
})

socket.on('emote', function(data){
  var emote = document.createElement('li');
  emote.innerHTML = "<span style=\"color:" + data.color + "\">" + data.nickname + " " + data.message + "</span>";
  msgList.appendChild(emote);
})




