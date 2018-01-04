Feature: User sending messages to lobby
    As a user i should be able to write out and send messages to the lobby chat

    Scenario: Send message to users in lobby

        Given I have logged in
        Then i write out my message to the lobby
        Then i press enter
        And i should see my message in the lobby chat with my username