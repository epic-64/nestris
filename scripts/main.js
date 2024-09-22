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
    htmlElement: window.document.getElementById('high-score-inner')
});
highScore.init();

const tetrisGame = new TetrisGame();

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                canvasContext.fillStyle = getColor(value);
                canvasContext.fillRect(x + offset.x,
                    y + offset.y,
                    1, 1);
            }
        });
    });
}

function draw() {
    canvasContext.fillStyle = '#000';
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

function getColor(value) {
    return gameState.colors[value];
}

function getBrightColor(value) {
    return gameState.brightColors[value];
}

function isSoftDropping(keyState) {
    return gameState.keyState['ArrowDown'];
}

function handleSoftDrop() {
    gameState.softDropFrameCount++;

    if (gameState.softDropFrameCount >= gameState.framesPerSoftDrop) {
        player.drop(arena);
        gameState.softDropFrameCount = 0;
        gameState.framesSinceLastDrop = 0; // Reset normal drop counter when soft dropping
    }
}

function updateScoreDisplay() {
    document.getElementById('score').innerText = 'Score: ' + player.score + ' | level: ' + gameState.level;
}

function updateLevel() {
    gameState.framesPerDrop = gameState.getFramesPerDrop(gameState.level);
    gameState.framesPerSoftDrop = Math.max(1, Math.min(Math.floor(gameState.framesPerDrop * gameState.softDropSpeedMultiplier), 5));
    gameState.keyState = {};
    updateScoreDisplay();
    tetrisGame.updateDebugDisplay();
}

function handleInput() {
    // Move Left
    if (gameState.keyState['ArrowLeft']) {
        moveFrameCount++;
        if (moveFrameCount >= moveFrameInterval) {
            player.move(-1, arena);
            moveFrameCount = 0;
        }
    }

    // Move Right
    else if (gameState.keyState['ArrowRight']) {
        moveFrameCount++;
        if (moveFrameCount >= moveFrameInterval) {
            player.move(1, arena);
            moveFrameCount = 0;
        }
    } else {
        moveFrameCount = moveFrameInterval; // Reset to allow immediate move on next key press
    }
}

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
                moveFrameCount = moveFrameInterval; // Allow immediate move
                handleInput();
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

// Movement delays
let moveFrameCount = 0;
const moveFrameInterval = 10; // Frames between moves (adjust for desired speed)

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
    updateLevel();
    document.getElementById('levelSelectionOverlay').style.display = 'none';

    tetrisGame.startGame();
}

document.getElementById('startGameButton').addEventListener('click', onStartGameButtonClick);

// Initialize the game (do not start the update loop yet)
document.getElementById('levelSelectionOverlay').style.display = 'flex';

updateScoreDisplay();
tetrisGame.updateDebugDisplay();
