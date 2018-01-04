const express = require('express'),
    socketio = require('socket.io');
var app = express();
var port = 5000;
var server = app.listen(port);
var io = socketio(server);

app.use(express.static(__dirname + '/public'));

app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap

app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/static/index.html');
});




console.log("Server stared on port " + port);

SocketList = {};

var platforms = [];

{
    platforms.push({
        w: 80,
        h: 80,
        x: 10,
        y: 490,
    });
    platforms.push({
        w: 515,
        h: 80,
        x: -10,
        y: 490,
    });

    platforms.push({
        w: 515,
        h: 10,
        x: -10,
        y: 0,
    });

    platforms.push({
        w: 10,
        h: 500,
        x: 0,
        y: -10,
    });

    platforms.push({
        w: 10,
        h: 500,
        x: 500,
        y: -10,
    });
    platforms.push({
        w: 80,
        h: 80,
        x: 220,
        y: 100,
    });
    platforms.push({
        w: 40,
        h: 40,
        x: 250,
        y: 450,
    })
}

friction = 0.9,
    gravity = 0.25;

//Lobby data
var lobbyUsers = { user: [] };
var removeLobbyUsers = { user: [] };

//Game Data
var gameData = { player: [] };
var dataWorlds = [gameData, gameData, gameData];
var removeEntity = { player: [] };

io.on('connection', (socket) => {
    //Adds new connection to socket list
    SocketList[socket.id] = socket;
    console.log('Socket ' + socket.id + ' just connected');

    socket.join('lobbyRoom');


    socket.on('alert', function (data) {
        console.log('Logged DATA : ' + data);
    });

    //Load game
    socket.on('startGame', function (data) {
        console.log('detected');
        joinRoom(socket, 'gameRoom1');

        console.log(data.username + " just joined room " + data.room);
        User.disconnect(socket);
        socket.emit('loadPlatforms', platforms);
        Player.connect(socket, data.username, data.room);
    });

    socket.on('checkUsername', function (uname) {
        var unames = [];

        for (i in User.list) {
            unames.push(User.list[i].username);
        }

        if (unames.length < 1) {
            joinRoom(socket, 'lobbyRoom');

            socket.emit('checkUsernameResponse', { success: true, uname: uname });
            User.connection(socket, uname);
        } else {

            if (unames.includes(uname)) {
                socket.emit('checkUsernameResponse', { success: false, uname: uname });

            } else {
                joinRoom(socket, 'lobbyRoom');

                socket.emit('event', uname + ' joined the lobby');
                socket.broadcast.to('lobbyRoom').emit('event', uname + ' joined room lobbyRoom');
                socket.emit('checkUsernameResponse', { success: true, uname: uname });
                User.connection(socket, uname);
            }
        }

    });

    socket.on('disconnect', function () {

        console.log('User disconected');
        for (var i in User.list) {
            if (User.list[socket.id] != undefined) {
                SocketList[i].emit('printLobbyMsg', 'SERVER : ' + User.list[socket.id].username + ' has disconnected.');
            } else {
                console.log("would have broken")
            }
        }
        delete SocketList[socket.id];
        User.disconnect(socket);


    });



    socket.on('console', function (data) {
        //console.log('LOGGED : ' + data);
    });

    //Chat functions
    socket.on('lobbyChat', function (data) {
        //console.log('recifecved ' + data);
        for (var i in User.list) {
            SocketList[i].emit('printLobbyMsg', User.list[socket.id].username + ' : ' + data);
        }
    });

});



function joinRoom(socket, room) {
    Object.keys(socket.rooms).filter((r) => r != socket.id)
        //Leave the pre existing room
        .forEach((r) => socket.leave(r));

    socket.join(room);
}
function printMsg(msg) {
    for (var i in User.list) {
        SocketList[i].emit('printLobbyMsg', msg);
    }

}

setInterval(function () {
    var lobbyData = {
        user: User.update()
    }

    var r1Data =
        {
            player: Player.update('gameRoom1')

        };

    var r2Data =
        {
            player: Player.update('gameRoom2')
        };

    io.sockets.in('lobbyRoom').emit('initLobbyUser', lobbyData);
    io.sockets.in('lobbyRoom').emit('removeLobbyUser', removeLobbyUsers);

    io.sockets.in('gameRoom1').emit('initPlayer', dataWorlds[0]);
    io.sockets.in('gameRoom1').emit('updatePlayer', r1Data);
    io.sockets.in('gameRoom1').emit('removePlayer', removeEntity);

    io.sockets.in('gameRoom2').emit('initPlayer', dataWorlds[1]);
    io.sockets.in('gameRoom2').emit('updatePlayer', r2Data);
    io.sockets.in('gameRoom2').emit('removePlayer', removeEntity);


    lobbyUsers.user = [];
    removeLobbyUsers.user = [];
    dataWorlds[0].player = [];
    dataWorlds[1].player = [];
    removeEntity.player = [];


}, 1000 / 30);; //FPS

var User = function (socket, username) {
    var self = {
        id: socket.id,
        username: username,
    };

    self.getInfo = function () {
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
User.connection = function (socket, username) {
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
User.update = function () {
    var updatedUsers = [];
    for (var i in User.list) {
        var user = User.list[i];
        updatedUsers.push(user.getInfo());
    }

    return updatedUsers;
}

User.disconnect = function (socket) {
    delete User.list[socket.id];
    removeLobbyUsers.user.push(socket.id);
}


User.getAllUserInfo = function () {
    var users = [];
    for (var i in User.list) {
        users.push(User.list[i].getInfo());
    }

    return users;
}


var Entity = function (room) {
    var self = {
        x: 250,
        y: 250,
        xSpeed: 0,
        ySpeed: 0,
        id: "",
        room: room,
    }
    self.update = function () {
        self.x += self.xSpeed;
        self.y += self.ySpeed;
    }

    self.getDistance = function (pt) {
        return Math.sqrt(Math.pow(self.x - pt.x, 2) + Math.pow(self.y - pt.y, 2));
    }

    return self;
}

var Player = function (id, room, username) {
    var self = Entity();
    self.id = id;
    self.room = room;
    self.username = username;
    self.width = 5;
    self.height = 5;
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingSpace = false;
    self.speed = 3;
    self.xVelocity = 0;
    self.yVelocity = 0,
        self.isJumping = false;
    self.isGrounded = false;




    //Stores entity update
    var entityUpdate = self.update;

    //Overwriting
    self.update = function () {
        self.updatePosition();
        entityUpdate();
    }



    self.updatePosition = function () {
        //Detect Jump
        if (self.pressingUp) {
            if (!self.isJumping) {
                self.isJumping = true;
                self.isGrounded = false;
                //Negative goes up Y slowly goes back to positive creating a curve
                self.yVelocity = -self.speed * 2;
            }
        }
        //----->>
        if (self.pressingRight) {
            if (self.xVelocity < self.speed) {
                self.xVelocity++;
            }
        }
        //<<-----
        if (self.pressingLeft) {
            if (self.xVelocity > -self.speed) {
                self.xVelocity--;
            }
        }


        //Slowly reduces velocity
        self.xVelocity *= friction;
        //Positive yVelocity player goes down
        self.yVelocity += gravity;


        self.isGrounded = false;
        for (var i in platforms) {
            var collisionPointer = checkForCollision(self, platforms[i]);

            if (collisionPointer === "left" || collisionPointer === "right") {
                self.xVelocity = 0;
                //self.isJumping = false;
            } else if (collisionPointer === "bottom") {
                self.isGrounded = true;
                self.isJumping = false;
            } else if (collisionPointer === "top") {
                self.yVelocity *= -1;
            }
        }

        //At bootom of canvas
        if (self.y >= 500 - self.width) {
            self.y = 500;
            self.isJumping = false;
            self.isGrounded = true;
        }

        //Allows for falling off platforms
        if (self.isGrounded) {
            self.yVelocity = 0;
        }

        self.x += self.xVelocity;
        self.y += self.yVelocity;

    }


    self.getPlayerInfo = function () {
        return {
            id: self.id,
            username: self.username,
            x: self.x,
            y: self.y,
        };
    }

    self.getUpdateInfo = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
        };
    }


    Player.list[id] = self;

    if (room == 'gameRoom1') {
        dataWorlds[0].player.push(self.getPlayerInfo());
        ////console.log('Player ' + dataWorlds[0].player[0].id);
    }
    else if (room == 'gameRoom2') {
        dataWorlds[1].player.push(self.getPlayerInfo());
        console.log('Player ' + dataWorlds[1].player[0].id);
    }

    return self;


}


Player.getAllPlayerInfo = function (room) {
    var players = [];
    for (var i in Player.list) {
        if (Player.list[i].room === room) {
            players.push(Player.list[i].getPlayerInfo());
        }
    }
    return players;
}

Player.connect = function (socket, username, room) {
    var player = Player(socket.id, room, username);
    console.log('Player  ' + player.username + " connected to room : " + player.room);


    //Recives data of what key the player is pressing
    socket.on('keyPress', function (data) {
        if (data.inputId === 'left') { player.pressingLeft = data.state; }
        else if (data.inputId === 'right') { player.pressingRight = data.state; }
        else if (data.inputId === 'up') { player.pressingUp = data.state; }
        else if (data.inputId === 'down') { player.pressingDown = data.state; }
        else if (data.inputId === 'leftMouse') { player.pressingAttack = data.state; }
    });


    //Fills the client side arrays of all data from players
    socket.emit('initPlayer', {
        id: socket.id,
        player: Player.getAllPlayerInfo(room),
    });

}

Player.disconnect = function (socket) {
    delete Player.list[socket.id];
    removeEntity.player.push(socket.id);
}

Player.update = function (room) {
    //To be sent to all players - contains all players information
    var pInfo = [];
    for (var i in Player.list) {
        var player = Player.list[i];

        if (player.room === room) {

            player.update();
            pInfo.push(player.getUpdateInfo());
        }

    }
    return pInfo;
}

Player.list = {}; //static


//Collision Checking
function checkForCollision(entity1, entity2) {

    //What the vectors get checked against
    var halfWidths = (entity1.width / 2) + (entity2.w / 2);
    var halfHeights = (entity1.height / 2) + (entity2.h / 2);

    //Entity
    var vectorX = (entity1.x + (entity1.width / 2)) - (entity2.x + (entity2.w / 2));
    var vectorY = (entity1.y + (entity1.height / 2)) - (entity2.y + (entity2.h / 2));

    var collisionPointer = null;


    if (Math.abs(vectorY) < halfHeights && Math.abs(vectorX) < halfWidths) {
        //How far are the shapes collide into the object
        var offsetX = halfWidths - Math.abs(vectorX);
        var offsetY = halfHeights - Math.abs(vectorY);


        //Left or right collide
        if (offsetX < offsetY) //greater than
        {
            if (vectorX > 0) {
                collisionPointer = "left";
                entity1.x += offsetX;
            } else {
                collisionPointer = "right";
                entity1.x -= offsetX;
            }

        }
        else {
            if (vectorY > 0) {
                collisionPointer = "top";
                entity1.y += offsetY;
            }
            else {
                collisionPointer = "bottom";
                entity1.y -= offsetY;
            }
        }
    }
    return collisionPointer;
}