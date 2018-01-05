Feature: User sending messages to game chat
    As a player i should be able to write out and send messages to the game chat

    Scenario: Send message to players in game

        Given I have logged in
		Then i can click on the element "JoinWorld" 
		And i will join world one
        Then i write out my message to the game
        Then i press enter
        And i should see my message in the game chat with my username