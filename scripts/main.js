const arenaCanvas = document.getElementById('gameCanvas');
const arenaContext = arenaCanvas.getContext('2d');
arenaContext.scale(20, 20);

const nextPieceCanvas = document.getElementById('nextPieceCanvas');
const nextPieceContext = nextPieceCanvas.getContext('2d');
nextPieceContext.scale(20, 20);

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
    scoreElement: document.getElementById('score'),
    levelSelectionElement: document.getElementById('levelSelectionOverlay'),
});
const tetrisGame = new TetrisGame();

document.addEventListener('keydown', event => {
    tetrisGame.handleKeyDown(event);
});

document.addEventListener('keyup', event => {
    tetrisGame.handleKeyUp(event);
});

document.getElementById('startGameButton').addEventListener('click', () => {
    tetrisGame.start()
});

document.getElementById('restartButton').addEventListener('click', () => {
    tetrisGame.reset();
});

document.getElementById('pauseButton').addEventListener('click', () => {
    if (!gameState.animating && !gameState.gameOver) {
        gameState.togglePause({ pauseOverlay: document.getElementById('pauseOverlay') });
    }
});

gameDisplay.showLevelSelection();
gameDisplay.updateScoreDisplay();
gameDisplay.updateDebugDisplay();
