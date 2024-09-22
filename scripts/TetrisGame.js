class TetrisGame {
    constructor() {

    }

    showGameOver() {
        document.getElementById('finalScore').innerText = 'Final Score: ' + player.score;
        document.getElementById('gameOverOverlay').style.display = 'flex';
    }

    start() {
        gameState.startLevel = parseInt(document.getElementById('startLevelInput').value);
        if (isNaN(gameState.startLevel) || gameState.startLevel < 0) {
            gameState.startLevel = 0;
        }

        gameState.level = gameState.startLevel;
        gameState.framesSinceLastDrop = 0;
        gameState.softDropFrameCount = 0;
        gameState.moveFrameCount = gameState.moveFrameInterval;

        gameState.keyState = {};
        gameState.linesClearedTotal = 0;
        gameState.running = true;

        arena.forEach(row => row.fill(0));
        player.reset(arena);

        this.updateLevel();
        gameDisplay.hideLevelSelection();
        gameDisplay.updateDebugDisplay();

        this.update(); // Start the game loop
    }

    reset() {
        player.score = 0;
        gameState.gameOver = false;
        gameState.paused = false;
        gameState.running = false; // Stop the game loop
        document.getElementById('gameOverOverlay').style.display = 'none';
        document.getElementById('levelSelectionOverlay').style.display = 'flex';
        gameDisplay.updateScoreDisplay();

        // Reset key states
        gameState.keyState = {};

        // Reset lines cleared total
        gameState.linesClearedTotal = 0;

        // Clear the arena
        arena.forEach(row => row.fill(0));

        // Update debug info
        gameDisplay.updateDebugDisplay();
    }

    update() {
        if (!gameState.running) return;

        if (!gameState.paused && !gameState.animating && !gameState.gameOver) {
            gameState.framesSinceLastDrop++;

            if (gameState.isSoftDropping()) {
                gameState.handleSoftDrop(player, arena);
            } else {
                gameState.softDropFrameCount = 0;

                if (gameState.framesSinceLastDrop >= gameState.framesPerDrop) {
                    player.drop(arena);
                    gameState.framesSinceLastDrop = 0;
                }
            }

            this.handleHorizontalInput();

            this.draw();
        }

        requestAnimationFrame(this.update.bind(this));
    }

    updateLevel() {
        gameState.framesPerDrop = gameState.getFramesPerDrop(gameState.level);
        gameState.framesPerSoftDrop = Math.max(1, Math.min(Math.floor(gameState.framesPerDrop * gameState.softDropSpeedMultiplier), 5));
        gameState.keyState = {};
        gameDisplay.updateScoreDisplay();
        gameDisplay.updateDebugDisplay();
    }

    /**
     * @param event KeyboardEvent
     */
    handleKeyDown(event) {
        if (!gameState.paused && !gameState.animating && !gameState.gameOver) {
            if (!event.repeat) {
                // Process rotations on keydown, ignoring repeats
                if (event.code === 'KeyA') {
                    player.rotate(-1, arena);
                } else if (event.code === 'KeyD') {
                    player.rotate(1, arena);
                } else if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
                    gameState.moveFrameCount = gameState.moveFrameInterval; // Allow immediate move

                    tetrisGame.handleHorizontalInput();
                }
            }
            gameState.keyState[event.code] = true;
        }
        if (event.code === 'Escape') { // Escape key to toggle pause
            if (!gameState.animating && !gameState.gameOver) {
                gameState.togglePause({ pauseOverlay: document.getElementById('pauseOverlay') });
            }
        }
    }

    handleKeyUp(event) {
        if (!gameState.paused && !gameState.animating && !gameState.gameOver) {
            gameState.keyState[event.code] = false;
        }
    }

    handleHorizontalInput() {
        // Move Left
        if (gameState.keyState['ArrowLeft']) {
            gameState.moveFrameCount++;
            if (gameState.moveFrameCount >= gameState.moveFrameInterval) {
                player.move(-1, arena);
                gameState.moveFrameCount = 0;
            }
        }
        // Move Right
        else if (gameState.keyState['ArrowRight']) {
            gameState.moveFrameCount++;
            if (gameState.moveFrameCount >= gameState.moveFrameInterval) {
                player.move(1, arena);
                gameState.moveFrameCount = 0;
            }
        } else {
            gameState.moveFrameCount = gameState.moveFrameInterval; // Reset to allow immediate move on next key press
        }
    }

    draw() {
        canvasContext.fillStyle = '#000';
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);

        matrixService.drawMatrix(arena, {x: 0, y: 0});
        matrixService.drawMatrix(player.matrix, player.pos);
    }
}