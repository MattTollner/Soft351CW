var socket = io({ transports: ['websocket'], upgrade: false });
var thisUserName = "";
var ctx = document.getElementById("ctx").getContext("2d");

var platforms = [];

var boxes = [];

$(document).ready(function () {

    $("#joinLobby").click(function () {


        if ($("#userInput").val().length === 0) {
            alert('Please enter a username');
        } else {
            socket.emit('checkUsername', $("#userInput").val())
        }

    });


    socket.on('checkUsernameResponse', function (data) {
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



    //Game load
    $('#toGame1').click(function () {
        $('#loginDiv').hide();
        $('#lobbyDiv').hide();
        $('#gameDiv').show();
        $('#worldDisplay').text("World One");
        socket.emit('startGame', { room: 'gameRoom1', username: thisUserName });
    });

    var addLi = (message) => {
        $('#userList').append('<li class="list-group-item">' + message + '</li>');
    };

    socket.on('event', addLi);

    //Game
    socket.on('initPlayer', function (data) {

        for (var i = 0; i < data.player.length; i++) {
            new Player(data.player[i]);
        }

    });

    socket.on('updatePlayer', function (data) {
        for (var i = 0; i < data.player.length; i++) {

            var updatedP = data.player[i];

            var player = Player.list[updatedP.id];
            if (player) {
                if (updatedP.x !== undefined) { player.x = updatedP.x; }
                if (updatedP.y !== undefined) { player.y = updatedP.y; }
            }
        }
    });

    socket.on('removePlayer', function (data) {
        for (var i = 0; i < data.player.length; i++) {
            delete Player.list[data.player[i]];
        }
    });

    //Init Map
    socket.on('loadPlatforms', function (data) {
        ctx.clearRect(0, 0, 500, 500);
        for (var i = 0; i < data.length; i++) {
            platforms.push(data[i]);
        }
    });

    //Keypresses
    document.onkeydown = function (key) {
        //S
        if (key.keyCode === 68) { socket.emit('keyPress', { inputId: 'right', state: true }); }
        //D
        else if (key.keyCode === 83) { socket.emit('keyPress', { inputId: 'down', state: true }); }
        //A
        else if (key.keyCode === 65) { socket.emit('keyPress', { inputId: 'left', state: true }); }
        //W
        else if (key.keyCode === 87) { socket.emit('keyPress', { inputId: 'up', state: true }); }
        //Space
        else if (key.keyCode === 32) { socket.emit('keyPress', { inputId: 'space', state: true }); }

    }
    document.onkeyup = function (event) {
        //D
        if (event.keyCode === 68) { socket.emit('keyPress', { inputId: 'right', state: false }); }
        //S
        else if (event.keyCode === 83) { socket.emit('keyPress', { inputId: 'down', state: false }); }
        //A
        else if (event.keyCode === 65) { socket.emit('keyPress', { inputId: 'left', state: false }); }
        //W
        else if (event.keyCode === 87) { socket.emit('keyPress', { inputId: 'up', state: false }); }
    }


});

setInterval(function () {
    ctx.clearRect(0, 0, 500, 500);
    for (var i in platforms) {
        ctx.fillStyle = 'black';
        ctx.fillRect(platforms[i].x - 5, platforms[i].y, platforms[i].w, platforms[i].h);
    }
    for (var i in Player.list) {
        Player.list[i].draw();
    }

}, 1000 / 30);

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
    self.username = playerInfo.uname;
    self.x = playerInfo.x;
    self.y = playerInfo.y;
    self.hp = playerInfo.hp;
    Player.list[self.id] = self;

    self.draw = function () {
        ctx.fillStyle = 'green';
        ctx.fillRect(self.x - 5, self.y - 5, 5, 5);
    }

    return self;
}

Player.list = {};
