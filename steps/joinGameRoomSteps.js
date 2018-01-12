const expect = require('chai').expect;
module.exports = function () {

    this.Then(/^i can click on the element "([^"]*)"$/, function (arg1, callback) {  
        driver.findElement(By.id("toGame1")).click().then(function () {
            callback();
        });
    });

    this.Then(/^i will join world one$/, function (callback) {
        var element = driver.findElement(By.id('worldDisplay'));
        element.getText().then(s => assert.equal(s, "gameRoom1")).then(function () {
            callback();
        });
    });

    this.Then(/^i can leave the game room$/, function (callback) {
        driver.findElement(By.id("toLobby")).click().then(function () {
            callback();
        });
    });

    this.Then(/^i will be back in the lobby$/, function (callback) {
        var element = driver.findElement(By.id('lobbyDisplay'));
        element.getText().then(s => assert.equal(s, "Lobby Room")).then(function () {
            callback();
        });
       
    });

}