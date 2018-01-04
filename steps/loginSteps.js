
var assert = require('assert');
var hello = "hello";
module.exports = function () {
    this.Given(/^I navigate to "([^"]*)"$/, function (arg1, callback) {
        // Write code here that turns the phrase above into concrete actions

        helpers.loadPage(arg1).then(function(){
            callback();
        })     
 
    });

    this.Then(/^i enter the nickname "([^"]*)" into input field with id "([^"]*)"$/, function (arg1, arg2, callback) {
        // Write code here that turns the phrase above into concrete actions

        driver.findElement(By.id(arg2)).sendKeys(arg1).then(function(result){
               
            callback();
        });   

    });


    this.Then(/^i press enter element "([^"]*)"$/, function (arg1, callback) {
        // Write code here that turns the phrase above into concrete actions
        driver.findElement(By.id(arg1)).submit().then(function(result){
            var element = driver.findElement(By.id('loginText'));
            element.getText().then(s => assert.equal(s, "")).then(function(){
              callback();  
            });    
            //callback();            
        });
    });

    this.Then(/^join the lobby if my username is unique$/, function (callback) {
        // Write code here that turns the phrase above into concrete actions
        
        driver.findElement(By.className('userListItem')).then(function (elements) {
        expect(elements).to.not.equal(undefined);  
       
        callback();
      });

    });

}


