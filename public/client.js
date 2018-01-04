var socket = io({ transports: ['websocket'], upgrade: false });
var thisUserName = "";



$(document).ready(function () {
    

    $("#joinLobby").click(function () {       

        if ($("#userInput").val().length === 0) {
            $('#loginText').text("Please enter a username");    
        } else 
        {
            socket.emit('checkUsername', $("#userInput").val())
        }   

    });

    socket.on('checkUsernameResponse', function (data) {
        socket.emit('console', "test");
        if (data.success) {
            $('#loginDiv').hide();
            $('#lobbyDiv').show();
            thisUserName = data.uname
            
        }
        else if (!data.success) {   
            $('#loginText').text(data.uname + ' already in use');                      
        }
    });

    socket.on('initLobbyUser', function (data) {
        
        for (var i = 0; i < data.user.length; i++) {
            new User(data.user[i]);           
        }

        $('#userList').empty();
        for (i in User.list) {
            $('#userList').append('<li class = "userListItem">' + User.list[i].username + '</li>');           
        }
    });

    socket.on('removeLobbyUser', function (data) {
        for (var i = 0; i < data.user.length; i++) {
            delete User.list[data.user[i]];
        }
    }); 

    //Lobby Chat Controls
    $('#lobbyChatForm').submit(function (e) {
        //Prevents page refresh
        e.preventDefault();           
         
            socket.emit('lobbyChat', $('#lobbyChatInput').val());
            $('#lobbyChatInput').val('');        
    });


    socket.on('printLobbyMsg', function (data) {
        $('#lobbyChat').append('<div class = "lobbyMsg">' + data + '</div >');
    });

});

var User = function (data) {
    var self = {};
    self.id = data.id;
    self.username = data.username;
    User.list[self.id] = self;

    return self;
}

User.list = {};


