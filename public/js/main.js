// Front End Javascript 

const chatForm = document.getElementById('chat-form') // chat-form comes from chat.html
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name')
const userList = document.getElementById('users')

const btnCreate = document.getElementById('btnCreate');

// Get username and room from url
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

// only use the websocket feature and not HTTP long polling fallback
// allows us to not have to implement Sticky Sessions when adding the Redis Adapter
// const socket = io('https://strife-websockets.herokuapp.com/', {
//     transports: ['websocket']
// });

const socket = io('http://localhost:3000', {
    transports: ['websocket']
});


// Join Chatroom
// username and room are pulled off of the query parameters and sent to the server
socket.emit('joinRoom', { username, room });

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
})

// catch any message sent from the server
socket.on('message', message => { 
    console.log(message)
    outputMessage(message);

    // Scroll down every time we get a new message
    chatMessages.scrollTop = chatMessages.scrollHeight // scrollTop and Height are html elements
})


// Create an event listener for the Submit Message Form
chatForm.addEventListener('submit', e => {
    e.preventDefault();

    const msg = e.target.elements.msg.value // e.target gives us the current element. We then have access to the elements inside of it. We want the value of the id="msg" field

    // Emit a message to the server with a msg payload
    socket.emit('chatMessage', msg)

    // Clear input after sumbitting a new message
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus() // focus the cursor on the empty input. focus() is an html method
})

// Output message to DOM
// message is an object with username, time, and text properties. Comes from formatMessage() in utils/message.js
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message'); // message comes from <div class="message"> in chat.html
    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
        ${message.text}
    </p>`
    document.querySelector('.chat-messages').appendChild(div) // should add a new div to the chat.html when we csubmit a new message
}

// Add Room Name to DOM
function outputRoomName(room) {
    roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
    userList.innerHTML = `
        ${users.map(user => `<li>${user.username}</li>`).join('')}
    `;
}

//Prompt the user before leave chat room
document.getElementById('leave-btn').addEventListener('click', () => {
    const leaveRoom = confirm('Are you sure you want to leave the chatroom?');
    if (leaveRoom) {
      window.location = '../index.html';
    } else {
    }
  });


// Console Log Shenanigans
const textStyle = [
    'background: linear-gradient(#26E000, #19272f)',
    'border: 1px solid #1A8904',
    'color: white',
    'padding: 1px 5px',
    'line-height: 40px',
    'font-weight: bold',
    'font-size: large',
    'font-family: Verdana, sans-serif'
  ].join(';');
  
  const imageStyle = [
    'background-image: url("https://thumbs.gfycat.com/PastelShrillArrowcrab-size_restricted.gif")',
    'background-size: cover',
    'padding: 50px 100px',
  ].join(';');
  
  console.log('%cLike what you see?', textStyle);
  console.log('%cI am looking to get hired', textStyle);
  console.log('%ccontact me at kolbe1129@gmail.com', textStyle);
  console.log('%c ', imageStyle)