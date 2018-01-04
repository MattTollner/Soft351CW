var expect = require('chai').expect;
module.exports = function () {    

  this.Then(/^i can click on the element "([^"]*)"$/, function (arg1, callback) {
    // Write code here that turns the phrase above into concrete actions
    driver.findElement(By.id("toGame1")).click().then(function(){        
        callback();
    });
  });

  this.Then(/^i will join world one$/, function (callback) {
    var element = driver.findElement(By.id('worldDisplay'));
          element.getText().then(s => assert.equal(s, "World One")).then(function(){
            callback();  
          }); 
  });

  this.Then(/^i can leave the game room$/, function (callback) {
    driver.findElement(By.id("toLobby")).click().then(function(){        
        callback();
    });
  });

  this.Then(/^i will be back in the lobby$/, function (callback) {
    // Write code here that turns the phrase above into concrete actions
    callback(null, 'pending');
  });

}