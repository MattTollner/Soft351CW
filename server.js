const express = require('express'),
      socketio = require('socket.io');
var app = express();
var server = app.listen(5000);
var io = socketio(server);

app.use(express.static(__dirname + '/public')); 

app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/static/index.html');    
});


console.log("Server stared on port 5000");

SocketList = {};


var lobbyUsers = { user: [] };
var removeLobbyUsers = { user: [] };

io.on('connection', (socket) => {
    //Adds new connection to socket list
    SocketList[socket.id] = socket;
    console.log('Socket ' + socket.id + ' just connected');

    socket.on('checkUsername', function (uname) {
       var unames = [];
        console.log("cUname Fired " + uname);
        for (i in User.list) {
            unames.push(User.list[i].username);
            console.log("Hello " + i);
        }
       
        if (unames.length < 1)
        {            
            socket.emit('checkUsernameResponse', { success: true, uname: uname });
            User.connection(socket, uname);
            console.log("Users lenght "  + User.list.length);
        } else {

            if (unames.includes(uname))
            {
                socket.emit('checkUsernameResponse', { success: false, uname: uname });
                
            } else {
                socket.emit('checkUsernameResponse', { success: true, uname: uname });
                User.connection(socket, uname);                
            }           
        }   
        
        

    });

    socket.on('console', function(data){
        console.log("CONSOLE: " + data);
    });

    socket.on('disconnect', function () {
      
        console.log('User disconected');  
        for (var i in User.list) {
            if(User.list[socket.id] != undefined)
            {         
                SocketList[i].emit('printLobbyMsg', 'SERVER : ' + User.list[socket.id].username + ' has disconnected.');
            } else 
            {
                console.log("would have broken")
            }
        }
        delete SocketList[socket.id];
        User.disconnect(socket);        

    });

    //Chat functions
    socket.on('lobbyChat', function (data) {
        console.log('recifecved ' + data);  
        io.sockets.emit('printLobbyMessage', data);     
        for (var i in User.list) {            
            SocketList[i].emit('printLobbyMsg', User.list[socket.id].username + ': ' + data);
            
           // SocketList[i].emit('lobbyChat', data);
        }
    });

});

setInterval(function () {
    var lobbyData = {
        user: User.update()
    }


    for (var i in User.list)
    {
        var socket = SocketList[i];
        socket.emit('initLobbyUser', lobbyData);
        socket.emit('removeLobbyUser', removeLobbyUsers);
    }    

    lobbyUsers.user = [];
    removeLobbyUsers.user = [];


}, 1000 / 25); //FPS

var User = function (socket, username)
{
    var self = {
        id: socket.id,
        username: username,
    };

    self.getInfo = function () 
    {
        return {
            id: self.id,
            username: self.username,
        };
    }

    //Adds new user to user list
    User.list[self.id] = self;
    lobbyUsers.user.push(self.getInfo());
    return self;
}

User.list = {};

//Used when user connects
User.connection = function (socket, username)
{
    var user = User(socket, username);    
    socket.emit('initLobbyUser', {
        id: socket.id,
        user: User.getAllUserInfo(),
    });

    for (var i in User.list) {
        SocketList[i].emit('printLobbyMsg', 'SERVER : ' + User.list[socket.id].username + ' has joined the lobby.');
    }
}

//Runs every frame
User.update = function ()
{
    var updatedUsers = [];
    for (var i in User.list)
    {
        var user = User.list[i];
        updatedUsers.push(user.getInfo());
    }

    return updatedUsers;
}

User.disconnect = function (socket)
{
    delete User.list[socket.id];
    removeLobbyUsers.user.push(socket.id);
}


User.getAllUserInfo = function ()
{
    var users = [];
    for (var i in User.list) {
        users.push(User.list[i].getInfo());
    }

    return users;
}


