const canvas = document.getElementById('gameCanvas');
const canvasContext = canvas.getContext('2d');
canvasContext.scale(20, 20);

const soundModule = new SoundModule(new AudioContext());
const gameState = new GameState();
const arena = createMatrix(10, 20);
const player = new Player();
const highScore = new HighScore({
    storageKey: 'tetrisHighScore',
    htmlElement: window.document.getElementById('high-score-inner')
});
highScore.init();

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

function handeSoftDrop() {
    gameState.softDropFrameCount++;

    if (gameState.softDropFrameCount >= gameState.framesPerSoftDrop) {
        player.drop(arena);
        gameState.softDropFrameCount = 0;
        gameState.framesSinceLastDrop = 0; // Reset normal drop counter when soft dropping
    }
}

function update() {
    if (!gameState.gameRunning) return;

    if (!gameState.paused && !gameState.animating && !gameState.gameOver) {
        gameState.framesSinceLastDrop++;

        if (isSoftDropping(gameState.keyState)) {
            handeSoftDrop();
        } else {
            gameState.softDropFrameCount = 0;

            if (gameState.framesSinceLastDrop >= gameState.framesPerDrop) {
                player.drop(arena);
                gameState.framesSinceLastDrop = 0;
            }
        }

        handleInput();

        draw();
    }
    requestAnimationFrame(update);
}

function updateScoreDisplay() {
    document.getElementById('score').innerText = 'Score: ' + player.score + ' | level: ' + gameState.level;
}

function updateLevel() {
    gameState.framesPerDrop = getFramesPerDrop(gameState.level);
    gameState.framesPerSoftDrop = Math.max(1, Math.min(Math.floor(gameState.framesPerDrop * gameState.softDropSpeedMultiplier), 5));
    gameState.keyState = {};
    updateScoreDisplay();
    updateDebugDisplay();
}

function getFramesPerDrop(level) {
    return gameState.framesPerDropTable[gameState.level] || 1;
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
            togglePause();
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

function resetGame() {
    player.score = 0;
    gameState.gameOver = false;
    gameState.paused = false;
    gameState.gameRunning = false; // Stop the game loop
    document.getElementById('gameOverOverlay').style.display = 'none';
    document.getElementById('levelSelectionOverlay').style.display = 'flex';
    updateScoreDisplay();

    // Reset key states
    gameState.keyState = {};

    // Reset lines cleared total
    gameState.linesClearedTotal = 0;

    // Clear the arena
    arena.forEach(row => row.fill(0));

    // Update debug info
    updateDebugDisplay();
}

function showGameOver() {
    document.getElementById('finalScore').innerText = 'Final Score: ' + player.score;
    document.getElementById('gameOverOverlay').style.display = 'flex';
}

function togglePause() {
    gameState.paused = !gameState.paused;
    const pauseOverlay = document.getElementById('pauseOverlay');
    if (gameState.paused) {
        pauseOverlay.style.display = 'flex';
    } else {
        pauseOverlay.style.display = 'none';

        // Reset frame counters to prevent jumps
        gameState.framesSinceLastDrop = 0;
        gameState.softDropFrameCount = 0;
        moveFrameCount = moveFrameInterval;
    }
}

// Start the game only after the first piece is generated
function startGame() {
    // Reset frame counters
    gameState.framesSinceLastDrop = 0;
    gameState.softDropFrameCount = 0;
    moveFrameCount = moveFrameInterval;

    // Reset key states
    gameState.keyState = {};

    // Reset lines cleared total
    gameState.linesClearedTotal = 0;

    // Clear the arena
    arena.forEach(row => row.fill(0));

    // Initialize the player's piece
    player.reset(arena);

    // Set gameState.gameRunning to true
    gameState.gameRunning = true;

    updateLevel();
    updateDebugDisplay();

    update(); // Start the game loop
}

document.getElementById('pauseButton').addEventListener('click', () => {
    if (!gameState.animating && !gameState.gameOver) {
        togglePause();
    }
});

document.getElementById('restartButton').addEventListener('click', () => {
    resetGame();
});

document.getElementById('startGameButton').addEventListener('click', () => {
    gameState.startLevel = parseInt(document.getElementById('startLevelInput').value);
    if (isNaN(gameState.startLevel) || gameState.startLevel < 0) {
        gameState.startLevel = 0;
    }
    gameState.level = gameState.startLevel;
    updateLevel();
    document.getElementById('levelSelectionOverlay').style.display = 'none';

    startGame();
});

// Initialize the game (do not start the update loop yet)
document.getElementById('levelSelectionOverlay').style.display = 'flex';

// Debug Information Function
function updateDebugDisplay() {
    const framesPerDropValue = gameState.framesPerDropTable[gameState.level] || 1;

    document.getElementById('debugInfo').innerHTML = `
                <strong>Debug Info:</strong><br>
                level: ${gameState.level}<br>
                Lines Cleared: ${gameState.linesClearedTotal}<br>
                Frames Per Drop: ${framesPerDropValue}<br>
                Frames Per Soft Drop: ${gameState.framesPerSoftDrop}
            `;
}

updateScoreDisplay();
updateDebugDisplay(); // Initial call to display debug info