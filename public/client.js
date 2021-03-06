
var socket = io({ transports: ['websocket'], upgrade: false });
var thisUserName = "";
var thisId = "";
var canvasG = document.getElementById("canvasG").getContext("2d");

var platforms = [];


var scoreBoard = [[,]];
var enableControls = true;


const Screen = Object.freeze({
    SCREEN_WIDTH: 800,
    SCREEN_HEIGHT: 400
});


var canvasBackgound = new Image();
canvasBackgound.src = '/img/BG.png'
//canvasBackgound.src = "https://i.stack.imgur.com/9WYxT.png"

//Changedsafsaf

$(document).ready(function () {

    $("#joinLobby").click(function () {


        if ($("#userInput").val().length === 0) {
            alert('Please enter a username');
        } else {
            socket.emit('checkUsername', $("#userInput").val())
        }

    });

    socket.on('usernameUnique', function (data) {
        if (data.unique) {
            $('#loginDiv').hide();
            $('gameDiv').hide();
            $('#lobbyDiv').show();
            thisUserName = data.uname;
            thisId = data.id;

        }
        else if (!data.unique) {
            $('#loginText').text(data.uname + ' already in use');
        }
    });

    socket.on('initLobbyUser', function (data) {


        for(i in data.user)
        {
            new User(data.user[i]);       
        }
       

        $('#userList').empty();
        for (i in User.list) {
            $('#userList').append('<li class = "userListItem">' + User.list[i].username + '</li>');
        }
    });

    socket.on('removeLobbyUser', function (data) {
        for(i in data.user)
        {
            delete User.list[data.user[i]];
        }
    });

    //Lobby Chat Controls
    $('#lobbyChatForm').submit(function (lobbyPage) {
        //Prevents page refresh
        lobbyPage.preventDefault();

        socket.emit('lobbyChat', $('#lobbyChatInput').val());
        $('#lobbyChatInput').val('');
    });

    //Adds lobby message
    socket.on('LobbyMsg', function (data) {
        if (data.type == "server")
        {
            $('#lobbyChat').append('<div class = "lobbyMsg" style="color:#FF3232">' + data.msg + '</div >');
        } else 
        {
            $('#lobbyChat').append('<div class = "lobbyMsg" style="color:#BA55D3">' + data.msg + '</div >');
        }

        $('#lobbyChat').scrollTop = $('#lobbyChat').scrollHeight;
        var d = $('#lobbyChat');
        d.scrollTop(d.prop("scrollHeight"));
       
    });

    //Game Chat Controls
    $('#gameChatForm').submit(function (gamePage) {
        //Prevents page refresh
        gamePage.preventDefault();

        socket.emit('gameChat', $('#gameChatInput').val());
        $('#gameChatInput').val('');
    });

    //Adds Game Message 
    socket.on('GameMsg', function (data) {
        if (data.type == "server") {
            $('#gameChat').append('<div class = "gameMsg" style="color:#FF3232">' + data.msg + '</div >');            
            
        } else {
            $('#gameChat').append('<div class = "gameMsg" style="color:#BA55D3">' + data.msg + '</div >');
        }

        var d = $('#gameChat');
        d.scrollTop(d.prop("scrollHeight"));
    });


    //Lobby Load
    $('#toLobby').click(function () {
        $('#loginDiv').hide();
        $('#lobbyDiv').show();
        $('#gameDiv').hide();
        $('#worldDisplay').text("");


        socket.emit('toLobby', thisUserName);
    });


    function gameLoad(roomToJoin) {
        $('#loginDiv').hide();
        $('#lobbyDiv').hide();
        $('#gameDiv').show();
        $('#worldDisplay').text(roomToJoin);
        socket.emit('startGame', { room: roomToJoin, username: thisUserName });
    }

    //Game load
    $('#toGame1').click(function () {
        currentRoom = "gameRoom1"
        gameLoad("gameRoom1");
    });




    //Game
    socket.on('initPlayer', function (data) {


        for(i in data.player)
        {
            new Player(data.player[i]);       
        }

        for (i in data.bullet)
        {
            new Bullet(data.bullet[i]);
        }

        for(i in data.ammo)
        {
            new Ammo(data.ammo[i]);
        }

        $('#playerList').empty();
        for (i in Player.list) {
            scoreBoard.push([Player.list[i].username, Player.list[i].score])  
            if (Player.list[i].id == thisId)
            {
                $('#playerAmmo').text("Ammo : " + Player.list[i].ammo)
            }
            
        }

        scoreBoard.sort(function (a, b) {
            return b[1] - a[1];
        });
       

        for (i in scoreBoard)
        {
            $('#playerList').append('<li class="playerListItem">' + scoreBoard[i][0] + " Score : " + scoreBoard[i][1] + '</li>');
        }

        scoreBoard = [];

    });
   

    //Updates players positions and info 
    socket.on('updatePlayer', function (data) {
        for (i in data.player)
        {
            var updatedP = data.player[i];
            var curPlayer = Player.list[updatedP.id];
           
            curPlayer.x = updatedP.x;
            curPlayer.y = updatedP.y;               
            curPlayer.score = updatedP.score;
            curPlayer.ammo = updatedP.ammo;             
        }

        for(i in data.bullet)
        {
            var updatedB = data.bullet[i];
            var bullet = Bullet.list[data.bullet[i].id];
            bullet.x = updatedB.x; 
            bullet.y = updatedB.y;             
        }

        
    });

    socket.on('removePlayer', function (data) {

        for(i in data.player)
        {
            delete Player.list[data.player[i]];
        }

        for(i in data.bullet)
        {
            delete Bullet.list[data.bullet[i]];
        }

        for(i in data.ammo)
        {
            delete Ammo.list[data.ammo[i]];
        }
       
    });

    //Init Map
    socket.on('loadPlatforms', function (data) {
        canvasG.clearRect(0, 0, Screen.SCREEN_WIDTH, Screen.SCREEN_HEIGHT);
        for(i in data)
        {
            platforms.push(data[i]);
        }
    });

    //Handle Mouse Press

if(enableControls){

    document.onmousedown = function (event)
    {
       //console.log("mouse down");
        socket.emit('inputKey', { outputId: 'leftMouse', pressed: true }); 
    }


    document.onmouseup = function (event) {
        socket.emit('inputKey', { outputId: 'leftMouse', pressed: false }); 
    }

    document.onmousemove = function (event) {      


       socket.emit('inputKey', { outputId: 'mousePos', mouseX: event.clientX, mouseY: event.clientY });
    }
}



    //inputKeyes 
    document.onkeydown = function (key) {
        //S
        if (key.keyCode === 68) { socket.emit('inputKey', { outputId: 'right', pressed: true }); }
        //A
        else if (key.keyCode === 65) { socket.emit('inputKey', { outputId: 'left', pressed: true }); }
        //W        
        else if (key.keyCode === 87) { socket.emit('inputKey', { outputId: 'up', pressed: true }); }

    }
    document.onkeyup = function (event) {
        //D
        if (event.keyCode === 68) { socket.emit('inputKey', { outputId: 'right', pressed: false }); }
        //A
        else if (event.keyCode === 65) { socket.emit('inputKey', { outputId: 'left', pressed: false }); }
        //W
        else if (event.keyCode === 87) { socket.emit('inputKey', { outputId: 'up', pressed: false }); }
    }

   


});

setInterval(function () {
    canvasG.clearRect(0, 0, Screen.SCREEN_WIDTH, Screen.SCREEN_HEIGHT);

    canvasG.drawImage(canvasBackgound,0,0);

    for (var i in platforms) {
        canvasG.fillStyle = 'black';
        canvasG.fillRect(platforms[i].x, platforms[i].y, platforms[i].w, platforms[i].h);
    }
    for (var i in Player.list) {
        Player.list[i].draw();
    }

    for (var i in Bullet.list) {     
      
       Bullet.list[i].draw();        
    }

    for (var i in Ammo.list) {

        Ammo.list[i].draw();
    }

},1000/30);

var User = function (data) {
    var self = {};
    self.id = data.id;
    self.username = data.username;
    User.list[self.id] = self;

    return self;
}

User.list = {};

var Player = function (playerInfo) {
    var self = {};
    self.id = playerInfo.id;
    self.username = playerInfo.username;
    self.x = playerInfo.x;
    self.y = playerInfo.y;
    self.lives = playerInfo.lives;
    self.ammo = playerInfo.ammo;
    self.score = playerInfo.score
    self.h = playerInfo.h;
    self.w = playerInfo.w;
    Player.list[self.id] = self; 

    self.draw = function () {
        canvasG.fillStyle = 'green';
        canvasG.fillRect(self.x - 5, self.y - 5, self.w, self.h);
    }

    return self;
}

Player.list = {};


var Bullet = function (bulletInfo) {
    var self = {};
    self.id = bulletInfo.id;
    self.x = bulletInfo.x;
    self.y = bulletInfo.y;
    self.w = bulletInfo.w;
    self.h = bulletInfo.h;
    Bullet.list[self.id] = self;
  
    self.draw = function () {    
        canvasG.fillStyle = 'red';
        canvasG.fillRect(self.x - 5, self.y - 5, self.w, self.h);
    }
    return self;
}

Bullet.list = {};

var Ammo = function (ammoInfo) {
    var self = {};
    self.id = ammoInfo.id;
    self.x = ammoInfo.x;
    self.y = ammoInfo.y;
    self.w = ammoInfo.w;
    self.h = ammoInfo.h;
    Ammo.list[self.id] = self;

    self.draw = function () {
        canvasG.fillStyle = 'yellow';
        canvasG.fillRect(self.x, self.y, self.w, self.h);
    }
    return self;
}

Ammo.list = {};
