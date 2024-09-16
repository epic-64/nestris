const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

context.scale(20, 20);

const arena = createMatrix(10, 20);
let framesSinceLastDrop = 0;
let framesPerDrop = 48;
let paused = false;
let animating = false;
let gameOver = false;
let gameRunning = false;
let level = 0;
let linesClearedTotal = 0;

highScore = new HighScore({storageKey: 'tetrisHighScore', htmlElementId: 'highScore'});
highScore.init();

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0
};

const colors = [
    null,
    '#FF0D72', // Tetromino T
    '#0DC2FF', // Tetromino O
    '#0DFF72', // Tetromino L
    '#F538FF', // Tetromino J
    '#FF8E0D', // Tetromino I
    '#FFE138', // Tetromino S
    '#3877FF', // Tetromino Z
];

const brightColors = [
    null,
    '#FF5A9D', // Brighter T
    '#4DDCFF', // Brighter O
    '#4DFF9F', // Brighter L
    '#FF7AFF', // Brighter J
    '#FFAC4D', // Brighter I
    '#FFEB70', // Brighter S
    '#709AFF', // Brighter Z
];

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

// Frames per drop for each level (assuming 60 FPS)
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

function playPieceLockSound() {
    soundModule.playSound([150], [0.1]);
}

function playLineClearSound(linesCleared) {
    if (linesCleared === 1) {
        soundModule.playSound([200, 250], [0.1, 0.1]);
    } else if (linesCleared === 2) {
        soundModule.playSound([250, 300, 350], [0.1, 0.1, 0.1]);
    } else if (linesCleared === 3) {
        soundModule.playSound([300, 350, 400, 450], [0.1, 0.1, 0.1, 0.1]);
    } else if (linesCleared === 4) {
        soundModule.playSound([440, 550, 660, 880], [0.15, 0.15, 0.15, 0.15]);
    }
}

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
        playLineClearSound(linesCleared.length);
        animating = true;
        animateLineClear(linesCleared, () => {
            // After animation, remove the lines and update the score
            linesCleared.forEach(y => {
                arena.splice(y, 1);
                arena.unshift(new Array(arena[0].length).fill(0));
            });

            let points = [0, 40, 100, 300, 1200];
            player.score += points[linesCleared.length] * (level + 1);
            linesClearedTotal += linesCleared.length;
            level = Math.min(10, startLevel + Math.floor(linesClearedTotal / 10));
            updateLevel();
            animating = false;

            // Reset frame count after line clear
            framesSinceLastDrop = 0;

            // Update debug info
            updateDebugDisplay();
        });
    }
}

function animateLineClear(linesCleared, callback) {
    paused = true;

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
            paused = false;
            framesSinceLastDrop = 0; // Reset frame count after animation
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
    return colors[value];
}

function getBrightColor(value) {
    return brightColors[value];
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playPieceLockSound();
        playerReset();
        arenaSweep();
    }
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    const pieces = 'TJLOSZI';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
        (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        gameOver = true;
        gameRunning = false; // Stop the game loop
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
        playerDrop();
        softDropFrameCount = 0;
        framesSinceLastDrop = 0; // Reset normal drop counter when soft dropping
    }
}

function update() {
    if (!gameRunning) return;

    if (!paused && !animating && !gameOver) {
        framesSinceLastDrop++;

        if (isSoftDropping(keyState)) {
            handeSoftDrop();
        } else {
            softDropFrameCount = 0;

            if (framesSinceLastDrop >= framesPerDrop) {
                playerDrop();
                framesSinceLastDrop = 0;
            }
        }

        handleInput();

        draw();
    }
    requestAnimationFrame(update);
}

function updateScoreDisplay() {
    document.getElementById('score').innerText = 'Score: ' + player.score + ' | Level: ' + level;
}

function updateLevel() {
    framesPerDrop = getFramesPerDrop(level);
    framesPerSoftDrop = Math.max(1, Math.min(Math.floor(framesPerDrop * softDropSpeedMultiplier), 5));
    keyState = {};
    updateScoreDisplay();
    updateDebugDisplay();
}

function getFramesPerDrop(level) {
    return framesPerDropTable[level] || 5; // Default to 5 frames if level exceeds defined levels
}

function handleInput() {
    // Move Left
    if (keyState['ArrowLeft']) {
        moveFrameCount++;
        if (moveFrameCount >= moveFrameInterval) {
            playerMove(-1);
            moveFrameCount = 0;
        }
    }

    // Move Right
    else if (keyState['ArrowRight']) {
        moveFrameCount++;
        if (moveFrameCount >= moveFrameInterval) {
            playerMove(1);
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
    if (!paused && !animating && !gameOver) {
        if (!event.repeat) {
            // Process rotations on keydown, ignoring repeats
            if (event.code === 'KeyQ') {
                playerRotate(-1);
            } else if (event.code === 'KeyW' || event.code === 'ArrowUp') {
                playerRotate(1);
            } else if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
                moveFrameCount = moveFrameInterval; // Allow immediate move
                handleInput();
            }
        }
        keyState[event.code] = true;
    }
    if (event.code === 'Escape') { // Escape key to toggle pause
        if (!animating && !gameOver) {
            togglePause();
        }
    }
});

// Handle keyup events
document.addEventListener('keyup', event => {
    if (!paused && !animating && !gameOver) {
        keyState[event.code] = false;
    }
});

// Movement delays
let moveFrameCount = 0;
const moveFrameInterval = 10; // Frames between moves (adjust for desired speed)

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function resetGame() {
    player.score = 0;
    gameOver = false;
    paused = false;
    gameRunning = false; // Stop the game loop
    document.getElementById('gameOverOverlay').style.display = 'none';
    document.getElementById('levelSelectionOverlay').style.display = 'flex';
    updateScoreDisplay();

    // Reset key states
    keyState = {};

    // Reset lines cleared total
    linesClearedTotal = 0;

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
    paused = !paused;
    const pauseOverlay = document.getElementById('pauseOverlay');
    if (paused) {
        pauseOverlay.style.display = 'flex';
    } else {
        pauseOverlay.style.display = 'none';

        // Reset frame counters to prevent jumps
        framesSinceLastDrop = 0;
        softDropFrameCount = 0;
        moveFrameCount = moveFrameInterval;
    }
}

// Start the game only after the first piece is generated
function startGame() {
    // Reset frame counters
    framesSinceLastDrop = 0;
    softDropFrameCount = 0;
    moveFrameCount = moveFrameInterval;

    // Reset key states
    keyState = {};

    // Reset lines cleared total
    linesClearedTotal = 0;

    // Clear the arena
    arena.forEach(row => row.fill(0));

    // Initialize the player's piece
    playerReset();

    // Set gameRunning to true
    gameRunning = true;

    updateLevel();
    updateDebugDisplay();

    update(); // Start the game loop
}

document.getElementById('pauseButton').addEventListener('click', () => {
    if (!animating && !gameOver) {
        togglePause();
    }
});

document.getElementById('restartButton').addEventListener('click', () => {
    resetGame();
});

let startLevel = 0;
document.getElementById('startGameButton').addEventListener('click', () => {
    startLevel = parseInt(document.getElementById('startLevelInput').value);
    if (isNaN(startLevel) || startLevel < 0 || startLevel > 10) {
        startLevel = 0;
    }
    level = startLevel;
    updateLevel();
    document.getElementById('levelSelectionOverlay').style.display = 'none';

    startGame();
});

// Initialize the game (do not start the update loop yet)
document.getElementById('levelSelectionOverlay').style.display = 'flex';

// Debug Information Function
function updateDebugDisplay() {
    const framesPerDropValue = framesPerDropTable[level] || 5;
    document.getElementById('debugInfo').innerHTML = `
                <strong>Debug Info:</strong><br>
                Level: ${level}<br>
                Lines Cleared: ${linesClearedTotal}<br>
                Frames Per Drop: ${framesPerDropValue}<br>
                Frames Per Soft Drop: ${framesPerSoftDrop}
            `;
}

updateScoreDisplay();
updateDebugDisplay(); // Initial call to display debug info