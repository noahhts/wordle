const rows = document.querySelectorAll(".row");
const keyButtons = document.querySelectorAll("#keyboard button");
let currentRow = 0;
let currentIndex = 0; // the first empty space in the current row
let rowIsFull = false;
let rowIsEmpty = true;
let gameIsOver = false;
let isLoading = true;
const loader = document.querySelector(".loading");
const statusLine = document.querySelector(".status");
const ROW_LENGTH = 5; // or word or answer length

function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}

function getEmptySpot() {
  for (let i = 0; i < ROW_LENGTH; i++) {
    if (!rows[currentRow].children[i].innerText) {
      currentIndex = i + 1; // +1 here b/c i will get filled with a letter from keydown
      return rows[currentRow].children[i];
    }
  }
}

function getUserWord() {
  let word = "";
  for (let i = 0; i < ROW_LENGTH; i++) {
    word += rows[currentRow].children[i].innerText;
  }
  return word;
}

function makeMap(array) {
  const obj = {};
  for (let i = 0; i < array.length; i++) {
    const letter = array[i];
    if (obj[letter]) obj[letter]++;
    else obj[letter] = 1;
  }
  return obj;
}

function markGuess(correctWord) {
  const guessParts = rows[currentRow].children;
  const map = makeMap(correctWord.split(""));
  const correctLetters = [];
  const almostLetters = [];
  const wrongLetters = [];

  for (let i = 0; i < ROW_LENGTH; i++) {
    const letter = guessParts[i];
    if (letter.innerText === correctWord[i]) {
      correctLetters.push(letter.innerText);
      letter.classList.add("correct");
      map[letter.innerText]--;
    }
  }

  for (let i = 0; i < ROW_LENGTH; i++) {
    const letter = guessParts[i];
    if (map[letter.innerText] > 0) {
      almostLetters.push(letter.innerText);
      letter.classList.add("almost");
      map[letter.innerText]--;
    } else {
      wrongLetters.push(letter.innerText);
      letter.classList.add("wrong");
    }
  }

  // mark onscreen keyboard
  for (let i = 0; i < keyButtons.length; i++) {
    if (correctLetters.includes(keyButtons[i].value))
      keyButtons[i].classList.add("correct");
    if (almostLetters.includes(keyButtons[i].value))
      keyButtons[i].classList.add("almost");
    if (wrongLetters.includes(keyButtons[i].value))
      keyButtons[i].classList.add("wrong");
  }
}

async function makeGuess(correctWord) {
  const word = getUserWord();
  isLoading = true;
  setLoading(true);
  const res = await fetch("https://words.dev-apis.com/validate-word", {
    method: "POST",
    body: JSON.stringify({ word: word }),
  });
  const resObj = await res.json();
  const validWord = resObj.validWord;
  isLoading = false;
  setLoading(false);
  if (!validWord) {
    for (let i = 0; i < ROW_LENGTH; i++) {
      rows[currentRow].children[i].classList.add("invalid");
      setTimeout(function () {
        rows[currentRow].children[i].classList.remove("invalid");
      }, 1000);
    }
    statusLine.innerText = "Invalid word";
    return;
  }

  markGuess(correctWord);
  statusLine.innerText = "Keep guessing";

  if (word === correctWord) {
    endGame("win");
    return;
  } else if (currentRow === 5) {
    endGame("lose", correctWord);
    return;
  }

  currentRow++;
  currentIndex = 0;
}

function endGame(state, word) {
  if (state === "win") {
    statusLine.innerText = "You win!";
    statusLine.classList.add("win");
    for (let i = 0; i < ROW_LENGTH; i++) {
      rows[currentRow].children[i].classList.add("winner");
      rows[currentRow].children[i].style.animationDelay = `${i * 100}ms`;
    }
  } else {
    statusLine.innerText = "You lose, the word was " + word;
  }
  gameIsOver = true;
}

function setLoading(isLoading) {
  loader.classList.toggle("hide", !isLoading);
  statusLine.classList.toggle("hide", isLoading);
}

async function init() {
  const response = await fetch("https://words.dev-apis.com/word-of-the-day");
  const resObj = await response.json();
  const wordOfDay = resObj.word.toUpperCase();
  setLoading(false);
  isLoading = false;
  // gameIsOver = localStorage.getItem("gameOver");

  // physical/device keyboard interaction
  document.addEventListener("keydown", async function (event) {
    if (gameIsOver || isLoading) return;

    if (isLetter(event.key)) {
      const emptySpot = getEmptySpot();
      if (!rowIsFull) emptySpot.innerText = event.key.toUpperCase();
    }

    if (event.key === "Enter" && rowIsFull) {
      await makeGuess(wordOfDay);
    }

    if (event.key === "Backspace" && !rowIsEmpty) {
      currentIndex--;
      rows[currentRow].children[currentIndex].innerText = "";
    }

    if (currentIndex === 0) rowIsEmpty = true;
    else rowIsEmpty = false;

    if (currentIndex === ROW_LENGTH) rowIsFull = true;
    else rowIsFull = false;

    // localStorage.setItem("gameOver", String(gameIsOver));
    // console.log(localStorage.getItem("gameOver"));
  });

  // on screen keyboard interaction
  const keyboard = document.querySelector("#keyboard");
  keyboard.addEventListener("click", async function (event) {
    const letter = event.target.value;

    if (gameIsOver || isLoading) return;

    if (isLetter(letter)) {
      const emptySpot = getEmptySpot();
      if (!rowIsFull) emptySpot.innerText = letter.toUpperCase();
    }

    if (letter === "enter" && rowIsFull) {
      await makeGuess(wordOfDay);
    }

    if (letter === "delete" && !rowIsEmpty) {
      currentIndex--;
      rows[currentRow].children[currentIndex].innerText = "";
    }

    if (currentIndex === 0) rowIsEmpty = true;
    else rowIsEmpty = false;

    if (currentIndex === ROW_LENGTH) rowIsFull = true;
    else rowIsFull = false;
  });
}

init();
