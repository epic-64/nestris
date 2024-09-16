const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
context.scale(20, 20);

const soundModule = new SoundModule(new AudioContext());
const gameState = new GameState();
const arena = createMatrix(10, 20);
const player = new Player();
const highScore = new HighScore({
    storageKey: 'tetrisHighScore',
    htmlElement: window.document.getElementById('high-score-inner')
});
highScore.init();

const tetrominoes = {
    'T': [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
    ],
    'O': [
        [2, 2],
        [2, 2],
    ],
    'L': [
        [0, 3, 0],
        [0, 3, 0],
        [0, 3, 3],
    ],
    'J': [
        [0, 4, 0],
        [0, 4, 0],
        [4, 4, 0],
    ],
    'I': [
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0],
    ],
    'S': [
        [0, 6, 6],
        [6, 6, 0],
        [0, 0, 0],
    ],
    'Z': [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
    ],
};

// Frames per drop for each gameState.level (assuming 60 FPS)
const framesPerDropTable = {
    0: 48,
    1: 43,
    2: 38,
    3: 33,
    4: 28,
    5: 23,
    6: 18,
    7: 13,
    8: 8,
    9: 6,
    10: 5,
};

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                    arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function arenaSweep() {
    let linesCleared = [];
    outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        linesCleared.unshift(y);
    }

    if (linesCleared.length > 0) {
        soundModule.playLineClearSound(linesCleared.length);
        gameState.animating = true;
        animateLineClear(linesCleared, () => {
            // After animation, remove the lines and update the score
            linesCleared.forEach(y => {
                arena.splice(y, 1);
                arena.unshift(new Array(arena[0].length).fill(0));
            });

            let points = [0, 40, 100, 300, 1200];
            player.score += points[linesCleared.length] * (gameState.level + 1);
            gameState.linesClearedTotal += linesCleared.length;
            gameState.level = Math.min(10, gameState.startLevel + Math.floor(gameState.linesClearedTotal / 10));
            updateLevel();
            gameState.animating = false;

            // Reset frame count after line clear
            gameState.framesSinceLastDrop = 0;

            // Update debug info
            updateDebugDisplay();
        });
    }
}

function animateLineClear(linesCleared, callback) {
    gameState.paused = true;

    let cellsToAnimate = [];

    // Collect cells to light up (bottom to top, left to right)
    for (let y of linesCleared) {
        for (let x = 0; x < arena[y].length; x++) {
            let value = arena[y][x];
            cellsToAnimate.push({x, y, value});
        }
    }

    // Collect cells to delete (top to bottom, right to left)
    let cellsToDelete = [];
    for (let y of linesCleared.slice().reverse()) {
        for (let x = arena[y].length - 1; x >= 0; x--) {
            cellsToDelete.push({x, y});
        }
    }

    const perCellDuration = 20; // milliseconds per cell

    let currentStep = 0;

    function animateLighting() {
        if (currentStep < cellsToAnimate.length) {
            const cell = cellsToAnimate[currentStep];
            draw(); // Redraw arena and player

            // Draw lit-up cell
            context.fillStyle = getBrightColor(cell.value);
            context.fillRect(cell.x, cell.y, 1, 1);

            currentStep++;
            setTimeout(animateLighting, perCellDuration);
        } else {
            currentStep = 0;
            setTimeout(animateDeletion, perCellDuration);
        }
    }

    function animateDeletion() {
        if (currentStep < cellsToDelete.length) {
            const cell = cellsToDelete[currentStep];
            arena[cell.y][cell.x] = 0;
            draw(); // Redraw arena and player
            currentStep++;
            setTimeout(animateDeletion, perCellDuration);
        } else {
            gameState.paused = false;
            gameState.framesSinceLastDrop = 0; // Reset frame count after animation
            callback();
        }
    }

    animateLighting();
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = getColor(value);
                context.fillRect(x + offset.x,
                    y + offset.y,
                    1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

function getColor(value) {
    return gameState.colors[value];
}

function getBrightColor(value) {
    return gameState.brightColors[value];
}

function playerReset() {
    const pieces = 'TJLOSZI';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
        (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        gameState.gameOver = true;
        gameState.gameRunning = false; // Stop the game loop
        showGameOver();
        highScore.update(player.score);
    }
}

function createPiece(type) {
    return tetrominoes[type];
}

// Soft Drop Variables
let softDropFrameCount = 0;
const softDropSpeedMultiplier = 0.5; // Adjust this value for desired soft drop speed (0 < multiplier <= 1)
let framesPerSoftDrop = null;

function isSoftDropping(keyState) {
    return keyState['ArrowDown'];
}

function handeSoftDrop() {
    softDropFrameCount++;

    if (softDropFrameCount >= framesPerSoftDrop) {
        player.drop(arena);
        softDropFrameCount = 0;
        gameState.framesSinceLastDrop = 0; // Reset normal drop counter when soft dropping
    }
}

function update() {
    if (!gameState.gameRunning) return;

    if (!gameState.paused && !gameState.animating && !gameState.gameOver) {
        gameState.framesSinceLastDrop++;

        if (isSoftDropping(keyState)) {
            handeSoftDrop();
        } else {
            softDropFrameCount = 0;

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
    framesPerSoftDrop = Math.max(1, Math.min(Math.floor(gameState.framesPerDrop * softDropSpeedMultiplier), 5));
    keyState = {};
    updateScoreDisplay();
    updateDebugDisplay();
}

function getFramesPerDrop(level) {
    return framesPerDropTable[gameState.level] || 1;
}

function handleInput() {
    // Move Left
    if (keyState['ArrowLeft']) {
        moveFrameCount++;
        if (moveFrameCount >= moveFrameInterval) {
            player.move(-1, arena);
            moveFrameCount = 0;
        }
    }

    // Move Right
    else if (keyState['ArrowRight']) {
        moveFrameCount++;
        if (moveFrameCount >= moveFrameInterval) {
            player.move(1, arena);
            moveFrameCount = 0;
        }
    } else {
        moveFrameCount = moveFrameInterval; // Reset to allow immediate move on next key press
    }
}

// Key state map to track which keys are pressed
let keyState = {};

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
        keyState[event.code] = true;
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
        keyState[event.code] = false;
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
    keyState = {};

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
        softDropFrameCount = 0;
        moveFrameCount = moveFrameInterval;
    }
}

// Start the game only after the first piece is generated
function startGame() {
    // Reset frame counters
    gameState.framesSinceLastDrop = 0;
    softDropFrameCount = 0;
    moveFrameCount = moveFrameInterval;

    // Reset key states
    keyState = {};

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
    const framesPerDropValue = framesPerDropTable[gameState.level] || 5;
    document.getElementById('debugInfo').innerHTML = `
                <strong>Debug Info:</strong><br>
                level: ${gameState.level}<br>
                Lines Cleared: ${gameState.linesClearedTotal}<br>
                Frames Per Drop: ${framesPerDropValue}<br>
                Frames Per Soft Drop: ${framesPerSoftDrop}
            `;
}

updateScoreDisplay();
updateDebugDisplay(); // Initial call to display debug info