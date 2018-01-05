const expect = require('chai').expect;
module.exports = function () {

     
    this.Then(/^i write out my message to the game$/, function (callback) {
        driver.findElement(By.id("gameChatInput")).sendKeys("Hello").then(function () {
            callback();
        })  
    });

   

    this.Then(/^i should see my message in the game chat with my username$/, function (callback) {
        driver.findElement(By.className('gameMsg')).then(function (elements) {
            expect(elements).to.not.equal(undefined);
            callback();
        })
    });




};