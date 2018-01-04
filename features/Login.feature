Feature: User Loging in
    As a user i should be able to enter a nick name and join the lobby

    Scenario: Load website, enter nickname and join lobby

        Given I navigate to "http://localhost:5000"
        Then i enter the nickname "Nate" into input field with id "userInput"
        Then i press enter element "loginForm"
        And join the lobby if my username is unique