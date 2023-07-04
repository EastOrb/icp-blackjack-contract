import { $query, $update, Record, StableBTreeMap, Result, nat32 } from 'azle'
import { v4 as uuidv4 } from 'uuid'

const suits: string[] = ["Spades", "Hearts", "Clubs", "Diamonds"]

const cards: string[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

interface ValuesType {
    [key: string]: nat32;
}

const cards_values: ValuesType = {
    "A": 11,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "J": 10,
    "Q": 10,
    "K": 10
}

type Deck = Record<{
    id: string;
    card: string;
    suit: string;
    value: nat32;
}>

const userStorage = new StableBTreeMap<string, Deck>(0, 44, 100);

const dealerStorage = new StableBTreeMap<string, Deck>(1, 44, 1_00);

type Budget = Record<{
    amount: nat32;
}>

let budget: Budget = { amount: 0 }

let game_bet: Budget = { amount: 0 }

$update;
export function addToUserBudget(amount: nat32): Result<Budget, string> {
    budget.amount = (budget.amount + amount)
    
    return Result.Ok(budget)
}

$query;
export function getUserBudget(): Result<nat32, string> {
    return Result.Ok(budget.amount)
}

$update;
export function startGame(bet: nat32): Result<string, string> {
    if (budget.amount >= bet) {

        clearDecks()

        budget.amount = (budget.amount - bet)

        game_bet.amount = bet

        return giveCards(2, 2)
    } else {
        return Result.Err("You have not enough budget")
    }
}

$update;
export function Hit(): Result<string, string> {
    const dealer_cards: Deck[] = dealerStorage.values()
    const user_cards: Deck[] = userStorage.values()

    if (dealer_cards.length >= 2 && user_cards.length >= 2) {
        return giveCards(0, 1)
    }

    return Result.Err("you cannot hit before start")
}

$update;
export function Stand(): Result<string, string> {
    const dealer_cards: Deck[] = dealerStorage.values()
    const user_cards: Deck[] = userStorage.values()

    if (dealer_cards.length >= 2 && user_cards.length >= 2) {
        return giveCards(1, 0)
    }

    return Result.Err("you cannot stand before start")
}

function generateMessage(el: Deck, i: nat32, length: nat32): string {
    return `${el.suit} ${el.card}${i !== length - 1 ? ', ' : ''}`
}

// returns user's and dealer's decks
$query;
export function viewDecks(): Result<string, string> {

    const dealer_cards: Deck[] = dealerStorage.values()
    const user_cards: Deck[] = userStorage.values()

    // game started
    if (dealer_cards.length > 0 && user_cards.length > 0) {

        let message: string = `dealer got ${dealer_cards.length} cards:`

        dealerStorage.values().forEach((el, i) =>
            message += generateMessage(el, i, dealer_cards.length))

        message += `; user got ${user_cards.length} cards:`

        userStorage.values().forEach((el, i) =>
            message += generateMessage(el, i, user_cards.length))

        return Result.Ok(message)
    }

    return Result.Err("no cards in the hands")
}

// check if card was not added to decks before
function checkIfUniqueCard(card: string, suit: string): boolean {

    const arr: Deck[] = dealerStorage.values().concat(userStorage.values())

    if (arr.find((el) => el.card === card && el.suit === suit))
        return false

    return true
}

$update;
export function clearDecks(): void {
    dealerStorage.values().forEach((t) => {
        dealerStorage.remove(t.id);
    });

    userStorage.values().forEach((t) => {
        userStorage.remove(t.id);
    });

    game_bet.amount = 0
}

function generateCard(): Deck {

    const card: string = cards[Math.floor(Math.random() * 12)]
    const suit: string = suits[Math.floor(Math.random() * 3)]

    // regenerate card if it is not unique
    if (checkIfUniqueCard(card, suit) === false)
        return generateCard()

    const value: nat32 = cards_values[card]

    const card_: Deck = {
        id: uuidv4(),
        card,
        suit,
        value
    }

    return card_;
}

// value of dealer's cards
function dealerValue(): nat32 {
    return dealerStorage.values().reduce((total, obj) => obj.value + total, 0)
}

// value of user's cards
function userValue(): nat32 {
    return userStorage.values().reduce((total, obj) => obj.value + total, 0)
}

$update;
export function giveCards(dealer_cards: nat32, user_cards: nat32): Result<string, string> {

    let message: string = ""

    if (dealer_cards > 0) {

        message = `dealer got ${dealer_cards} cards:`

        for (let i = 0; i < dealer_cards; i++) {
            const card = generateCard()

            dealerStorage.insert(card.id, card)

            message += generateMessage(card, i, dealer_cards)
        }
    }

    if (dealer_cards > 0 && user_cards > 0) message += "; "

    if (user_cards > 0) {

        message = `user got ${user_cards} cards:`

        for (let i = 0; i < user_cards; i++) {
            const card = generateCard()

            userStorage.insert(card.id, card)

            message += generateMessage(card, i, user_cards)
        }
    }

    const user_value = userValue()
    const dealer_value = dealerValue()

    // user choose to stand
    if (dealer_cards === 1 && user_cards === 0) {

        if (dealer_value > 21 || dealer_value < user_value) {
            budget.amount += game_bet.amount + (game_bet.amount / 2)

            message += `; User wins ${(game_bet.amount / 2)}`
        } else if(dealer_value === user_value) {
            budget.amount += game_bet.amount

            message += `; Draw`
        } else {
            message += `; User lose`
        }

        clearDecks()

        return Result.Ok(message)
    }

    // user choose to hit
    if (dealer_cards === 0 && user_cards === 1) {
        if (user_value > 21) {
            clearDecks()
            
            return Result.Ok(`${message}; User lose with ${user_value}`)
        }
    }

    if(dealer_value > 21) {
        clearDecks()

        message += `; User wins ${(game_bet.amount / 2)}`
    } else if(user_value > 21) {
        clearDecks()

        message += `; User lose`
    }

    if (user_value === 21 && dealer_value !== 21) {
        budget.amount += game_bet.amount + (game_bet.amount / 2)

        clearDecks()

        message += `; User wins ${(game_bet.amount / 2)}`
    } else if (user_value === 21 && dealer_value === 21) {
        budget.amount += game_bet.amount

        clearDecks()

        message += `; Draw`
    }

    return Result.Ok(message)
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
    getRandomValues: () => {
        let array = new Uint8Array(32)

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256)
        }

        return array
    }
}