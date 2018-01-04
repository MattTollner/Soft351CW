
// const assert = require('chai').assert;
// const io = require('socket.io-client');
// const cli = require('../public/client.js');
// const app = require('../server.js');


var assert = require('chai').assert
  , server = require('../server.js')
  , client = require('../public/client.js')
  , io = require('../node_modules/socket.io-client')
  , ioOptions = { 
      transports: ['websocket']
    , forceNew: true
    , reconnection: false
  }
  , testMsg = 'HelloWorld'
  , sender
  , receiver

// var sender, receiver;
// var testMsg = "Hello World";


  const socketURL = `http://localhost:5000`;



describe('Chat Events', function(){
  beforeEach(function(done){
    
    // start the io server
   // server.start()
    // connect two io clients
    sender = io.connect(socketURL);
    sender.emit('checkUsername', "sender");
    sender.emit('checkUsernameResponse', { success: true, uname: "sender" });
    receiver = io.connect(socketURL);
    receiver.emit('checkUsername', "receiver");
    receiver.emit('checkUsernameResponse', { success: true, uname: "receiver" });
    
    // finish beforeEach setup
    done()
  })
  afterEach(function(done){
    
    // disconnect io clients after each test
    sender.disconnect()
    receiver.disconnect()
    done()
  })


  describe('Connection Events', function(){
    it('Testing Connection Events', function(done){
      sender.on('connection', function (data){
        sender.emit('checkUsername', "Barry");
    })
        
     });
  });

  describe('Message Events', function(){
    it('Clients should receive a message when the `message` event is emited.', function(done){
      sender.emit('lobbyChat', testMsg);
      receiver.on('printLobbyMessage', function(msg){
        assert.equal(msg,testMsg,"Should be equal");
        done()
      })
    })
  })
})

describe('test', function() {
  it('A test that should be true', function() {
    var result = 1;

    assert.equal(result, 1, 'please work');
  });
});





// describe('Sockets', function () {  
//   var client1 = 6, client2, client3;
//   assert.equal(client1, 3, "Deffo should work");
//   // testing goodness goes here
// });

// describe('Socket IO Connections', () => {
//     if("It should hide elements when a player sucessfully connects to lobby", done => {
//         const playerOne = io.connect(socketURL,options);

//           playerOne.app.emit

//         playerOne.on('connection', function (data){
//           playerOne.emit('checkUsername', "Barry");
//         });

//         playerOne.on('checkUsernameResponse', function(data){
//            
//         });



        
//     });
// });

