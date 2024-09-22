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

// Handle keydown events
document.addEventListener('keydown', event => {
    if (!gameState.paused && !gameState.animating && !gameState.gameOver) {
        if (!event.repeat) {
            // Process rotations on keydown, ignoring repeats
            if (event.code === 'KeyA') {
                player.rotate(-1, arena);
            } else if (event.code === 'KeyD') {
                player.rotate(1, arena);
            } else if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
                gameState.moveFrameCount = gameState.moveFrameInterval; // Allow immediate move
                tetrisGame.handleInput();
            }
        }
        gameState.keyState[event.code] = true;
    }
    if (event.code === 'Escape') { // Escape key to toggle pause
        if (!gameState.animating && !gameState.gameOver) {
            gameState.togglePause({ pauseOverlay: document.getElementById('pauseOverlay') });
        }
    }
});

// Handle keyup events
document.addEventListener('keyup', event => {
    if (!gameState.paused && !gameState.animating && !gameState.gameOver) {
        gameState.keyState[event.code] = false;
    }
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
    gameState.startLevel = parseInt(document.getElementById('startLevelInput').value);
    if (isNaN(gameState.startLevel) || gameState.startLevel < 0) {
        gameState.startLevel = 0;
    }
    gameState.level = gameState.startLevel;
    tetrisGame.updateLevel();

    gameDisplay.hideLevelSelection();

    tetrisGame.start();
}

document.getElementById('startGameButton').addEventListener('click', onStartGameButtonClick);

gameDisplay.showLevelSelection();
gameDisplay.updateScoreDisplay();
tetrisGame.updateDebugDisplay();
