
var webdriver = require('selenium-webdriver');
var browser = new webdriver.Builder().usingServer().withCapabilities({'browserName': 'chrome' }).build();
 
browser.get('http://localhost:5000');

browser.findElement(webdriver.By.id("userInput")).sendKeys("NateDog");
browser.findElement(webdriver.By.id("joinLobby")).click();



//var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();

// driver.get('https://localhost:5000');