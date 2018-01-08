

const express = require('express'),
    socketio = require('socket.io');
var app = express();
var server = app.listen(5000);
var io = socketio(server);

app.use(express.static(__dirname + '/public'));

app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap

app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/static/index.html');
});


const Rooms = ({
    LOBBY: "lobbyRoom",
    ROOM1: "gameRoom1" 
});

const Screen = ({
    SCREEN_WIDTH: 800,
    SCREEN_HEIGHT: 400
});



console.log("Server stared on port 5000");

SocketList = {};

var platforms = [];

{
    //Walls
    //+Y = ^^ +X = >>     
    platforms.push({ w: Screen.SCREEN_WIDTH + 10, h: 10, x: 0, y: 0 }); //Top
    platforms.push({ w: Screen.SCREEN_WIDTH + 10, h: 10, x: 0, y: Screen.SCREEN_HEIGHT - 10}); //Bottom
    platforms.push({ w: 10, h: Screen.SCREEN_HEIGHT + 10, x:5 ,y: 0}); //Ledft
    platforms.push({ w: 10, h: Screen.SCREEN_HEIGHT + 10, x: Screen.SCREEN_WIDTH - 5, y: 0 }); //Right

    platforms.push({ w: Screen.SCREEN_WIDTH / 3 + 30, h: 10, x: Screen.SCREEN_WIDTH / 3, y: Screen.SCREEN_HEIGHT - 60 }); //1st Row Mid
    platforms.push({ w: Screen.SCREEN_WIDTH / 3 + 30, h: 10, x: Screen.SCREEN_WIDTH - Screen.SCREEN_WIDTH/4, y: Screen.SCREEN_HEIGHT - 120 }); //1st Row Right
    platforms.push({ w: Screen.SCREEN_WIDTH / 3 + 30, h: 10, x: -Screen.SCREEN_WIDTH / 9.5, y: Screen.SCREEN_HEIGHT - 120 }); //1st Row left

    platforms.push({ w: Screen.SCREEN_WIDTH / 3 + 30, h: 10, x: Screen.SCREEN_WIDTH / 3, y: Screen.SCREEN_HEIGHT - 180 }); //2nd Row Mid
    platforms.push({ w: Screen.SCREEN_WIDTH / 3 + 30, h: 10, x: Screen.SCREEN_WIDTH - Screen.SCREEN_WIDTH / 4, y: Screen.SCREEN_HEIGHT - 240 }); //2nd Row Right
    platforms.push({ w: Screen.SCREEN_WIDTH / 3 + 30, h: 10, x: -Screen.SCREEN_WIDTH / 9.5, y: Screen.SCREEN_HEIGHT - 240 }); //2nd Row left


    platforms.push({ w: Screen.SCREEN_WIDTH / 3 + 30, h: 10, x: Screen.SCREEN_WIDTH / 3, y: Screen.SCREEN_HEIGHT - 300 }); //3rd Row Mid
    platforms.push({ w: Screen.SCREEN_WIDTH / 3 + 30, h: 10, x: Screen.SCREEN_WIDTH - Screen.SCREEN_WIDTH / 4, y: Screen.SCREEN_HEIGHT - 360 }); //3rd Row Right
    platforms.push({ w: Screen.SCREEN_WIDTH / 3 + 30, h: 10, x: -Screen.SCREEN_WIDTH / 9.5, y: Screen.SCREEN_HEIGHT - 360 }); //3rd Row left

   
}

friction = 0.9,
gravity = 0.25;

//Lobby data
var lobbyUsers = { user: [] };
var removeLobbyUsers = { user: [] };

//Game Data
var gameData = { player: [], bullet: [], ammo: [] };
var removeEntity = { player: [], bullet: [], ammo: [] };


//Fired when someone connects to the server
io.on('connection', (socket) => {

    //Adds new connection to socket list
    SocketList[socket.id] = socket;
    console.log('Socket ' + socket.id + ' just connected');

    //Removes user from lobby and places them in game
    socket.on('startGame', function (data) {       
        joinRoom(socket, Rooms.ROOM1);
        console.log(data.username + " just joined room " + data.room);
        User.disconnect(socket);
        socket.emit('loadPlatforms', platforms);
        Player.connect(socket, data.username, data.room);
        printMsg("SERVER : " + data.username + " joined " + data.room, Rooms.LOBBY, false, null, "server");
    });

    //Checks to see if usename is unique
    socket.on('checkUsername', function (uname) {
        var unames = [];

        for (i in User.list) {
            unames.push(User.list[i].username);
        }

        if (unames.length < 1) {           

            socket.emit('checkUsernameResponse', { success: true, uname: uname, id: socket.id });
            User.connection(socket, uname);
            joinRoom(socket, Rooms.LOBBY);
        } else {

            if (unames.includes(uname)) {
                socket.emit('checkUsernameResponse', { success: false, uname: uname });

            } else {
                

                socket.emit('event', uname + ' joined the lobby');
                socket.broadcast.to(Rooms.LOBBY).emit('event', uname + ' joined room lobbyRoom');
                socket.emit('checkUsernameResponse', { success: true, uname: uname });
                User.connection(socket, uname);
                joinRoom(socket, Rooms.LOBBY);
            }
        }

    });

    //Player rejoins lobby from game room
    socket.on("toLobby", function(data) {        
        Player.disconnect(socket);
        User.connection(socket, data);
        joinRoom(socket,Rooms.LOBBY);
    });

    //Handles disconnections updates accordingly
    socket.on('disconnect', function () {
       
        for (var i in User.list) {
            if(User.list[socket.id] != undefined && User.list[socket.id].username != undefined)
            {
                printMsg('SERVER : ' + User.list[socket.id].username + ' has disconnected.', Rooms.LOBBY, true, i, "server");              
            } 
        }
       
       
        Player.disconnect(socket);
        User.disconnect(socket);
        delete SocketList[socket.id];
   
   
    });   

    //Lobby Chat Functions
    socket.on('lobbyChat', function (data) {
        var datas = User.list[socket.id].username + ' : ' + data;
        printMsg(datas, Rooms.LOBBY, false, null, "user");        
    });
    //Game Chat Function
    socket.on('gameChat', function (data) {
        console.log("game chat" + data);
        var datas = Player.list[socket.id].username + ' : ' + data;
        printMsg(datas, Rooms.ROOM1, false, null, "user");        
    });

});



function joinRoom(socket, room) {
    Object.keys(socket.rooms).filter((r) => r != socket.id)
        //Leave the pre existing room
        .forEach((r) => socket.leave(r));

    socket.join(room);
}

function printMsg(msg, room, noLoop, c, type)
{
    if (room == Rooms.LOBBY)
    {
        if (!noLoop)
        {
            for (var i in User.list) {
                SocketList[i].emit('LobbyMsg', { msg, type: type });
            }
        } else {
            SocketList[c].emit('LobbyMsg', { msg, type: type });
        }
       
    }
    else if (room == Rooms.ROOM1)
    {
        if (!noLoop) {
            for (var i in Player.list) {
                SocketList[i].emit('GameMsg', { msg, type: type });
            }
        } else {
            SocketList[c].emit('GameMsg', { msg, type: type });
        }
        
    }
   
}

setInterval(function () {
    var players = false;
    var users = false;
  
  
    for (i in User.list)
    {
        users = true;
       
    }

    if (users)
    {
        var lobbyData = {
            user: User.update()
        }

        //Contains basic inforamtion of connected lobby users
        io.sockets.in(Rooms.LOBBY).emit('initLobbyUser', lobbyData);
        //Send id of users who disconnected to update client/server arrays 
        io.sockets.in(Rooms.LOBBY).emit('removeLobbyUser', removeLobbyUsers);
    }

   

    for (i in Player.list)
    {      
        players = true;
    }


    if (players)
    {    
        //For random spawning of ammo
        var rand = randNumber(300, 1)
        if (rand == 17) {
            Ammo();
        }


        var r1Data =
            {
                player: Player.update(Rooms.ROOM1),
                bullet: Bullet.update(Rooms.ROOM1),
                ammo: Ammo.update(),

            };

        //Contains all player information of player that just joined (only needed once)
        io.sockets.in(Rooms.ROOM1).emit('initPlayer', gameData);
        //Contains certain player information that needs updating such as position and ammo
        io.sockets.in(Rooms.ROOM1).emit('updatePlayer', r1Data);
        //Contains id of disonnected player to be updated on client side
        io.sockets.in(Rooms.ROOM1).emit('removePlayer', removeEntity);

    } 

    //Emptys all information
    lobbyUsers.user = [];
    removeLobbyUsers.user = [];
    gameData.player = [];
    gameData.bullet = [];   
    gameData.ammo = [];
    removeEntity.player = [];
    removeEntity.bullet = [];
    removeEntity.ammo = [];


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

    printMsg('SERVER : ' + User.list[socket.id].username + ' has joined the lobby.', Rooms.LOBBY, false, null, "server");
  
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
        w: 3,
        h: 3,
        xSpeed: 0,
        ySpeed: 0,
        id: "",
        room: room,

    }
    self.update = function () {
        self.x += self.xSpeed;
        self.y += self.ySpeed;
    }

    self.getDistance = function(pt){
        return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
    }

    self.getInfo = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            w: self.w,
            h: self.h,
        };
    }

    self.getUpdateInfo = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
        };
    }

    return self;
}

var Player = function (id, room, username) {
    var self = Entity();
    self.id = id;
    self.room = room;
    self.username = username;    
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

    //Overwrite
    self.w = 10;
    self.h = 10;

    //Shooting
    self.ammo = 100;
    self.playerHasShot;
    self.mouseAngle;
    self.mouseX;
    self.mouseY;

    //Player
    self.score = 0;


    //Stores entity update
    var entityUpdate = self.update;

    //Overwriting
    self.update = function () {
        self.updatePosition();
        self.detectShooting();
        entityUpdate();
       
    }



    self.updatePosition = function () {
        //Detect Jump

        if (self.x < 0 || self.x > Screen.SCREEN_WIDTH || self.y < 0 || self.y > Screen.SCREEN_HEIGHT)
        {
            console.log("player out of bounds");
            self.respawn();
        }


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

        
        if (self.pressingUp) {
        
            if (!self.isJumping) {
               // console.log('PRESSED UP + jumping = ' + self.isJumping + ' grounded :  ' + self.isGrounded);
                self.isJumping = true;
                self.isGrounded = false;
               // console.log('PRESSED UP 2+ jumping = ' + self.isJumping + ' grounded :  ' + self.isGrounded);
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

       //Allows for falling off platforms       
          if (self.isGrounded) {
              self.yVelocity = 0;
          }

        self.x += self.xVelocity;
        self.y += self.yVelocity;

    }

    self.detectShooting = function () {
        if (self.pressingAttack && self.ammo > 0) {
            var angle = Math.atan2(self.mouseY - self.y, self.mouseX - self.x);
            angle = angle * (180 / Math.PI);
            if (angle < 0) {
                angle = 360 - (-angle);
            }

            self.mouseAngle = angle;
          //  console.log(self.mouseAngle);

            if (self.playerHasShot) {

                self.shootBullet(self.mouseAngle);
                self.ammo--;
                self.playerHasShot = false;
                console.log("bullet shot: " + self.mouseAngle + "ammo : " + self.ammo);
            }

        }

        self.shootBullet = function (angle) {
            var b = Bullet(self.id, angle, self.room);
            b.x = self.x;
            b.y = self.y;
        }

        if (!self.pressingAttack) {
            self.playerHasShot = true;
        }
    }

    self.getPlayerInfo = function () {
        return {
            id: self.id,
            username: self.username,
            x: self.x,
            y: self.y,
            w: self.w,
            h: self.h,        
            score: self.score,
            ammo: self.ammo,
        };
    }

    self.getUpdateInfo = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y,       
            score: self.score,
            ammo: self.ammo,
        };
    }

    self.respawn = function () {
        self.x = randNumber(Screen.SCREEN_WIDTH, 1);
        self.y = randNumber(Screen.SCREEN_HEIGHT, 1);
    }


    Player.list[id] = self;

    if (room == Rooms.ROOM1) {
        gameData.player.push(self.getPlayerInfo());       
    }    

    return self;

}

Player.list = {}; //static

function randNumber(numL, numS)
{
    var num;
    num = Math.floor((Math.random() * numL) + numS);
    //console.log("Random Number " + num);
    return num;
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
    printMsg(player.username + " has connected", Rooms.ROOM1, false, null, "server");

    //Recives data of what key the player is pressing
    socket.on('inputKey', function (data) {
        if (data.outputId === 'left') { player.pressingLeft = data.pressed; }
        else if (data.outputId === 'right') { player.pressingRight = data.pressed; }
        else if (data.outputId === 'up') { player.pressingUp = data.pressed; }
        else if (data.outputId === 'down') { player.pressingDown = data.pressed; }
        else if (data.outputId === 'leftMouse') { player.pressingAttack = data.pressed;  }
        else if (data.outputId === 'mouseAngle') {
            player.mouseX = data.pressed.x;
            player.mouseY = data.pressed.y;  
        }


    });


    //Fills the client side arrays of all data from players
    socket.emit('initPlayer', {
        id: socket.id,
        player: Player.getAllPlayerInfo(room),
        bullet: Bullet.getAllBulletInfo(room),
        ammo: Ammo.getAllAmmoInfo(),
    });

}

Player.disconnect = function (socket) {
    var p = Player.list[socket.id];
    console.log(p);
    if(p !== undefined){
        if(p.room === Rooms.ROOM1) {removeEntity.player.push(socket.id)}  
        else (console.log('ERROR NO ROOM')); 

        printMsg(p.username + " has disconnected", Rooms.ROOM1, false, null, "server");
    }
    
    delete Player.list[socket.id];
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


var Ammo = function () {
    console.log("Ammo Spawned");
    var self = Entity();
    self.x = randNumber(Screen.SCREEN_WIDTH, 1);
    self.y = randNumber(Screen.SCREEN_HEIGHT, 1);
    self.w = 10;
    self.h = 10;
    self.id = Math.random();
    self.pickedUp = false;
    self.timer = 0;

    self.update = function () {        

        if (self.timer++ > 600) {
            self.pickedUp = true;
        }

        for (var i in Player.list) {
            var p = Player.list[i];
          
                if (checkForCollision(p, self) === 'noHit') {

                } else {
                    console.log("Player touching ammo pack")
                    self.pickedUp = true;
                    Player.list[i].ammo += 5;
                    console.log("Ammo count " + Player.list[i].ammo)                    
                }  

        }

        for (var i in platforms) {

            var plat = platforms[i];
            if (checkForCollision(self, plat) === 'noHit') {

            } else { 
                console.log("In wall");
                self.pickedUp = true;
                Ammo();
                
            }
          
        }

    }

    Ammo.list[self.id] = self;

    gameData.ammo.push(self.getInfo());
    


    return self;
}

//Called every frame
Ammo.update = function (room) {

    var aInfo = [];
    for (var i in Ammo.list) {
        var ammo = Ammo.list[i];
        
        ammo.update();
        

        if (ammo.pickedUp) {
            removeEntity.ammo.push(ammo.id);
            delete Ammo.list[i];
        }
        else {
            aInfo.push(ammo.getUpdateInfo());
        }

    }
    return aInfo;
}

Ammo.getAllAmmoInfo = function () {
    var ammos = [];
    for (var i in Ammo.list) {
        ammos.push(Ammo.list[i].getInfo());
    }
    return ammos;
}

Ammo.list = {};

var Bullet = function (parent, angle, room) {
    var self = Entity();
    self.room = room;
    console.log('bullet created at room ' + self.room);
    self.id = Math.random();
    self.xSpeed = Math.cos(angle / 180 * Math.PI) * 10;
    self.ySpeed = Math.sin(angle / 180 * Math.PI) * 10;
    self.parent = parent;
    self.timer = 0;
    self.delBullet = false;
    var entityUpdate = self.update;

    self.update = function () {
        if (self.timer++ > 100) {
            self.delBullet = true;
        }

        entityUpdate();

        for (var i in Player.list) {
            var p = Player.list[i];
           
            if (p.room === self.room) {
                if (checkForCollision(p, self) === 'noHit') {

                } else {
                    if (p.id !== self.parent) {
                        var shooter = Player.list[self.parent];
                        console.log(shooter.username + " has shot " + p.username + " " + p.x + " " + self.x);
                        printMsg(shooter.username + " has shot " + p.username, Rooms.ROOM1, false, null, "server");
                        shooter.score++;
                        Player.list[self.parent] = shooter;
                        console.log("Player new score " + Player.list[self.parent].score);
                        p.respawn();
                        Player.list[p.id] = p;
                        self.delBullet = true;


                    }
                }
            }
          
        }

        for (var i in platforms) {

            var plat = platforms[i];          
            if(checkForCollision(self,plat) === 'noHit')
            {
                
            } else{
               // console.log('WAPGPG' + checkForCollision(self,plat) )
                self.delBullet = true;
            }
            // if (self.getDistance(plat) < 5) {
            //     self.delBullet = true;
            // }
        }
    }


    

    Bullet.list[self.id] = self;
 
    gameData.bullet.push(self.getInfo());
      //  console.log('Player ' + gameData.bullet[0].id);
    

    return self;

}
Bullet.list = {};

Bullet.getAllBulletInfo = function () {
    var bullets = [];
    for (var i in Bullet.list) {
        bullets.push(Bullet.list[i].getInfo());
    }
    return bullets;
}


//Called every frame
Bullet.update = function (room) {

    var bInfo = [];
    for (var i in Bullet.list) {
        var bullet = Bullet.list[i];
        if (bullet.room === room) {
            bullet.update();
        }
     
        if (bullet.delBullet) {
            if(bullet.room === Rooms.ROOM1) {removeEntity.bullet.push(bullet.id)}            
            delete Bullet.list[i];
        }
        else {
            bInfo.push(bullet.getUpdateInfo());
        }

    }
    return bInfo;
}



//Collision Checking
 function checkForCollision(entity1, entity2) {

    //What the vectors get checked against 
    var halfWidths = (entity1.w / 2) + (entity2.w / 2);
    var halfHeights = (entity1.h / 2) + (entity2.h / 2);

    //Entity 
    var vectorX = (entity1.x + (entity1.w / 2)) - (entity2.x + (entity2.w / 2));
    var vectorY = (entity1.y + (entity1.h / 2)) - (entity2.y + (entity2.h / 2));

    var collisionPointer = 'noHit';

    //If Y & X is less than halfHeights there is collision
    if (Math.abs(vectorY) < halfHeights && Math.abs(vectorX) < halfWidths) {
        //How far are the shapes collide into the object    
        var offsetX = halfWidths - Math.abs(vectorX);
        var offsetY = halfHeights - Math.abs(vectorY);


        //Left or right collide
        if (offsetX < offsetY) 
        {
            if (vectorX > 0) {
                entity1.x += offsetX;
                collisionPointer = "left";
                
            } else {
                entity1.x -= offsetX;
                collisionPointer = "right";                
            }

        }
        else {
            if (vectorY > 0) {
                entity1.y += offsetY;
                collisionPointer = "top";                
            }
            else {
                entity1.y -= (offsetY - 5);
                collisionPointer = "bottom";
                
            }
        }
    }
    return collisionPointer;
}

module.exports 

