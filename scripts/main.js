const canvas = document.getElementById('gameCanvas');
const canvasContext = canvas.getContext('2d');
canvasContext.scale(20, 20);

const matrixService = new MatrixService();
const soundModule = new SoundModule(new AudioContext());
const gameState = new GameState();
const arena = matrixService.createMatrix(10, 20);
const player = new Player();
const highScore = new HighScore({
    storageKey: 'tetrisHighScore',
    htmlElement: document.getElementById('high-score-inner')
});
highScore.init();

const gameDisplay = new GameDisplay({
    scoreElement:          document.getElementById('score'),
    levelSelectionElement: document.getElementById('levelSelectionOverlay'),
});
const tetrisGame = new TetrisGame();

document.addEventListener('keydown', event => {
    tetrisGame.handleKeyDown(event);
});

document.addEventListener('keyup', event => {
    tetrisGame.handleKeyUp(event);
});

document.getElementById('pauseButton').addEventListener('click', () => {
    if (!gameState.animating && !gameState.gameOver) {
        gameState.togglePause({ pauseOverlay: document.getElementById('pauseOverlay') });
    }
});

document.getElementById('restartButton').addEventListener('click', () => {
    tetrisGame.reset();
});

function onStartGameButtonClick() {
    tetrisGame.start();
}

document.getElementById('startGameButton').addEventListener('click', onStartGameButtonClick);

gameDisplay.showLevelSelection();
gameDisplay.updateScoreDisplay();
tetrisGame.updateDebugDisplay();
