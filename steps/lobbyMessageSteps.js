const expect = require('chai').expect;
module.exports = function () {


    this.Given(/^I have logged in$/, function (callback) {
        // Write code here that turns the phrase above into concrete actions
        helpers.loadPage("http://localhost:5000").then(function () {
            driver.findElement(By.id("userInput")).sendKeys("Nate").then(function () {
                driver.findElement(By.id("joinLobby")).click().then(function (result) {
                    var element = driver.findElement(By.id('loginText'));
                    element.getText().then(s => assert.equal(s, "")).then(function () {
                        callback();
                    });
                });
            });
        })
    });

    this.Then(/^i write out my message to the lobby$/, function (callback) {
        driver.findElement(By.id("lobbyChatInput")).sendKeys("Hello").then(function () {
            callback();
        })
    });

    this.Then(/^i press enter to submit "([^"]*)"$/, function (arg1, callback) {
        driver.findElement(By.id(arg1)).submit().then(function () {
            callback();
        })
    });
    

    this.Then(/^i should see my message in the lobby chat with my username$/, function (callback) {
        driver.findElement(By.className('lobbyMsg')).then(function (elements) {
            expect(elements).to.not.equal(undefined);
            callback();
        })

    });





};