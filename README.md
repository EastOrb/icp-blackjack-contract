A simple blackjack game contract

User starts with adding funds to budget using a addToUserBudget function, user can check his balance using getUserBudget function.

1. In blackjack, each card has a value – face cards (kings, queens, jacks) are worth 10 and aces are worth 11.
2. To start the game user needs to use function startGame and set a bet as a parameter. 
3. The dealer will begin by dealing two cards to themselves and two cards to you. These are the starting hands.
4. User and dealer can win at after start if one of them get 21 (user will get 3/2 from his starting bet).
5. You add up the value of all the cards in your hand to get your score. (cards in the deck can be viewed by using viewDecks function)
6. Once the starting hand is drawn, you can choose two options: hit or stand.
6.1. If you Hit the dealer will deal you another card. 
6.2. If you Stand you will not recieve any more cards and game will stop. 
7. The goal is to get closer to 21 than the dealer without going over. If you go over 21, you immedietly lose.
8. You can continue to hit until you either bust or choose to stand
9. Once you decide to stand, the dealer draws a card for themselves and whoever’s score is closest to 21 without going over wins!
