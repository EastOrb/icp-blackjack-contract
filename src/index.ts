import { v4 as uuidv4 } from 'uuid';

const suits: string[] = ["Spades", "Hearts", "Clubs", "Diamonds"];

const cards: string[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

interface Deck {
  id: string;
  card: string;
  suit: string;
  value: number;
}

type Budget = {
  amount: number;
};

const userStorage = new Map<string, Deck>();
const dealerStorage = new Map<string, Deck>();

let budget: Budget = { amount: 0 };
let game_bet: Budget = { amount: 0 };

export function addToUserBudget(amount: number): Budget {
  budget.amount += amount;
  return budget;
}

export function getUserBudget(): number {
  return budget.amount;
}

export function startGame(bet: number): string {
  if (budget.amount >= bet) {
    clearDecks();
    budget.amount -= bet;
    game_bet.amount = bet;
    return giveCards(2, 2);
  } else {
    return "You do not have enough budget.";
  }
}

export function Hit(): string {
  const dealer_cards: Deck[] = Array.from(dealerStorage.values());
  const user_cards: Deck[] = Array.from(userStorage.values());

  if (dealer_cards.length >= 2 && user_cards.length >= 2) {
    return giveCards(0, 1);
  }

  return "You cannot hit before the game starts.";
}

export function Stand(): string {
  const dealer_cards: Deck[] = Array.from(dealerStorage.values());
  const user_cards: Deck[] = Array.from(userStorage.values());

  if (dealer_cards.length >= 2 && user_cards.length >= 2) {
    return giveCards(1, 0);
  }

  return "You cannot stand before the game starts.";
}

function generateMessage(el: Deck, i: number, length: number): string {
  return `${el.suit} ${el.card}${i !== length - 1 ? ", " : ""}`;
}

export function viewDecks(): string {
  const dealer_cards: Deck[] = Array.from(dealerStorage.values());
  const user_cards: Deck[] = Array.from(userStorage.values());

  if (dealer_cards.length > 0 && user_cards.length > 0) {
    let message: string = `Dealer has ${dealer_cards.length} cards: `;

    dealer_cards.forEach((el, i) => {
      message += generateMessage(el, i, dealer_cards.length);
    });

    message += `; User has ${user_cards.length} cards: `;

    user_cards.forEach((el, i) => {
      message += generateMessage(el, i, user_cards.length);
    });

    return message;
  }

  return "There are no cards in the hands.";
}

function checkIfUniqueCard(card: string, suit: string): boolean {
  const arr: Deck[] = Array.from(dealerStorage.values()).concat(Array.from(userStorage.values()));
  return !arr.some((el) => el.card === card && el.suit === suit);
}

export function clearDecks(): void {
  dealerStorage.clear();
  userStorage.clear();
  game_bet.amount = 0;
}

function generateCard(): Deck {
  const card: string = cards[Math.floor(Math.random() * cards.length)];
  const suit: string = suits[Math.floor(Math.random() * suits.length)];

  if (!checkIfUniqueCard(card, suit)) {
    return generateCard();
  }

  const value: number = cards_values[card];

  const card_: Deck = {
    id: uuidv4(),
    card,
    suit,
    value,
  };

  return card_;
}

function dealerValue(): number {
  return Array.from(dealerStorage.values()).reduce((total, obj) => obj.value + total, 0);
}

function userValue(): number {
  return Array.from(userStorage.values()).reduce((total, obj) => obj.value + total, 0);
}

export function giveCards(dealer_cards: number, user_cards: number): string {
  let message: string = "";

  if (dealer_cards > 0) {
    message = `Dealer got ${dealer_cards} card${dealer_cards > 1 ? "s" : ""}: `;
    for (let i = 0; i < dealer_cards; i++) {
      const card = generateCard();
      dealerStorage.set(card.id, card);
      message += generateMessage(card, i, dealer_cards);
    }
  }

  if (dealer_cards > 0 && user_cards > 0) {
    message += "; ";
  }

  if (user_cards > 0) {
    message += `User got ${user_cards} card${user_cards > 1 ? "s" : ""}: `;
    for (let i = 0; i < user_cards; i++) {
      const card = generateCard();
      userStorage.set(card.id, card);
      message += generateMessage(card, i, user_cards);
    }
  }

  const user_value = userValue();
  const dealer_value = dealerValue();

  if (dealer_cards === 1 && user_cards === 0) {
    if (dealer_value > 21 || dealer_value < user_value) {
      budget.amount += game_bet.amount + game_bet.amount;
      message += `; User wins ${game_bet.amount}`;
    } else if (dealer_value === user_value) {
      budget.amount += game_bet.amount;
      message += "; Draw";
    } else {
      message += "; User loses";
    }

    clearDecks();

    return message;
  }

  if (dealer_cards === 0 && user_cards === 1) {
    if (user_value > 21) {
      clearDecks();
      return `${message}; User loses with ${user_value}`;
    }
  }

  if (dealer_value > 21) {
    clearDecks();
    message += `; User wins ${game_bet.amount}`;
  } else if (user_value > 21) {
    clearDecks();
    message += "; User loses";
  }

  if (user_value === 21 && dealer_value !== 21) {
    budget.amount += game_bet.amount + game_bet.amount;
    clearDecks();
    message += `; User wins ${game_bet.amount}`;
  } else if (user_value === 21 && dealer_value === 21) {
    budget.amount += game_bet.amount;
    clearDecks();
    message += "; Draw";
  }

  return message;
}

// Mocking getRandomValues for uuidv4
global.crypto = {
  getRandomValues: (array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
};
