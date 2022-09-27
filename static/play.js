let foundWords = [];
let score = 0;
let gameStarted = false;
let playedBefore = false;
let timesPlayed;
let highScore;

const startButton = $('#start-button');
const startButtonDiv = $('#start-button-div');
const boardWrapper = $('#board-wrapper');
const wordGuessForm = $('#word-guess-form');
const wordGuessInput = $('#word-guess-input');
const foundWordsList = $('#content ul');
const wordGuessErrorP = $('#word-guess-error-message p');
const timerP = $('#timer');
const scoreP = $('#score');
const popup = $('#game-over-popup');
const popupScore = $('#game-over-score');
const popupCloseX = $('#popup-closeX');
const popupWordsFound = $('#popup-words-found');
const highScoreSpan = $('#highest-score');
const timesPlayedSpan = $('#games-played');

$(document).ready(getStatsOnStart());

startButton.click(startGame);
wordGuessForm.on('submit', wordSubmitted);
popupCloseX.click(closePopup);

async function getStatsOnStart() {
  const res = await axios.get('/stored_stats');
  highScore = res.data.high_score;
  timesPlayed = res.data.times;
  updateStatsOnPage();
}

async function resetGame() {
  boardWrapper.addClass('text-invisible');
  resetDOM();
  const newLetters = await axios.get('/new_letters');
  for (let i = 0; i < newLetters.data.length; i++) {
    for (let j = 0; j < newLetters.data[i].length; j++) {
      $(`#${i * 10 + j}`).text(newLetters.data[i][j]);
    }
  }
}

async function startGame() {
  if (playedBefore) {
    await resetGame();
  }
  hideStartButton();
  await countdown();
  gameStarted = true;
  boardWrapper.removeClass('text-invisible');
  wordGuessForm.toggleClass(['hidden', 'flex-center']);
  wordGuessInput.focus();
  startTimer();
}

function countdown() {
  boardWrapper.append('<div id="countdown">3<div>');
  setTimeout(() => $('#countdown').text('2'), 1000);
  setTimeout(() => $('#countdown').text('1'), 2000);
  return new Promise(function(resolve) {
    setTimeout(resolve, 3000); 
  }).then(() => $('#countdown').remove());
  // can use callback instead
}

function hideStartButton() {
  startButtonDiv.toggleClass(['hidden', 'flex-center']);
}

async function wordSubmitted(evt) {
  evt.preventDefault();
  const word = wordGuessInput.val();
  wordGuessInput.val('');
  if (!gameStarted) {
    return
  }
  const result = await checkWord(word);
  if (result[0] === 'f') {
    addToArray(word);
    displayOnPage(word);
    addToScore(word);
  }
  displayMsg(result);
}

async function checkWord(word) {
  if (word.length < 3) {
    return "Word must be 3 letters or more";
  }
  if (foundWords.includes(word)) {
    return `"${word}" already found`;
  }
  const res = await axios.get('/check_word', {params: {word: word}});
  return res.data
}

function startTimer() {
  let time = 60;
  const intervalID = setInterval(() => {
    time--;
    displayTime(time);
    if (time <= 0) {
      stopTimer(intervalID);
      endGame();
    }
  }, 1000);
}

function addToArray(word) {
  foundWords.push(word);
}

function displayOnPage(word) {
  foundWordsList.prepend(`<li>${word}</li>`);
}

function displayMsg(result) {
  // wordGuessErrorP.empty();
  // wordGuessErrorP.css('opacity', '1');
  wordGuessErrorP.text(result);
  // setTimeout(() => wordGuessErrorP.css('opacity', '0'));
}

function addToScore(word) {
  score += word.length;
  updateScoreOnPage(score);
}

function updateScoreOnPage(score) {
  scoreP.text(score);
}

function displayTime(time) {
  time < 10 ? timerP.text(`0:0${time}`) : timerP.text(`0:${time}`);
}

function stopTimer(intervalID) {
  clearInterval(intervalID);
}

function endGame() {
  gameStarted = false;
  playedBefore = true;
  wordGuessForm.toggleClass(['hidden', 'flex-center']);
  startButtonDiv.toggleClass(['flex-center', 'hidden']);
  updateStats();
  storeStats();
  gameOverPopup();
  resetValues();
}

function gameOverPopup() {
  popupScore.text(score);
  const reorderedFoundWords = reorderFoundWordsByLength();
  popupWordsFound.text(reorderedFoundWords.join(', '));
  popup.removeClass(['hidden']);
}

function reorderFoundWordsByLength() {
  const longestWordLength = foundWords.reduce((longestWordLength, word) => {
    if (word.length > longestWordLength) {
      return word.length;
    }
    return longestWordLength;
  }, 0);
  let reorderedFoundWords = [];
  for (let i = longestWordLength; i > 2; i--) {
    const wordsAtLength = foundWords.filter((word) => word.length === i);
    reorderedFoundWords.push(...wordsAtLength);
  }
  return reorderedFoundWords;
}

function closePopup() {
  popup.addClass(['hidden']);
}

function updateStats() {
  if (score > highScore) {
    highScore = score;
  }
  timesPlayed++;
  updateStatsOnPage();
}

function updateStatsOnPage() {
  highScoreSpan.text(highScore);
  timesPlayedSpan.text(timesPlayed);
}

async function storeStats() {
  const data = {high_score: highScore, times: timesPlayed};
  const res = await axios.post('/stored_stats', data);
}

function resetValues() {
  foundWords = [];
  score = 0;
}

function resetDOM() {
  boardWrapper.addClass('text-invisible');
  scoreP.text('0');
  timerP.text('1:00');
  foundWordsList.empty();
  wordGuessInput.val('');
  wordGuessErrorP.empty();
}