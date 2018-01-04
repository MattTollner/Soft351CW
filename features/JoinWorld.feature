Feature: User join game world
    As a user user i should be able to join and leave 3 different worlds

    Scenario: Once in lobby i should be able to join world one and then leave

        Given I have logged in
        Then i can click on the element "JoinWorld" 
        And i will join world one
        Then i can leave the game room
        And i will be back in the lobby