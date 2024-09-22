class TetrisGame {
    constructor() {

    }

    showGameOver() {
        document.getElementById('finalScore').innerText = 'Final Score: ' + player.score;
        document.getElementById('gameOverOverlay').style.display = 'flex';
    }

    // Start the game only after the first piece is generated
    start() {
        // Reset frame counters
        gameState.framesSinceLastDrop = 0;
        gameState.softDropFrameCount = 0;
        gameState.moveFrameCount = gameState.moveFrameInterval;

        // Reset key states
        gameState.keyState = {};

        // Reset lines cleared total
        gameState.linesClearedTotal = 0;

        // Clear the arena
        arena.forEach(row => row.fill(0));

        // Initialize the player's piece
        player.reset(arena);

        gameState.running = true;

        this.updateLevel();
        this.updateDebugDisplay();

        this.update(); // Start the game loop
    }

    // Debug Information Function
    updateDebugDisplay() {
        const framesPerDropValue = gameState.framesPerDropTable[gameState.level] || 1;

        document.getElementById('debugInfo').innerHTML = `
                <strong>Debug Info:</strong><br>
                level: ${gameState.level}<br>
                Lines Cleared: ${gameState.linesClearedTotal}<br>
                Frames Per Drop: ${framesPerDropValue}<br>
                Frames Per Soft Drop: ${gameState.framesPerSoftDrop}
            `;
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

            this.handleInput();

            this.draw();
        }

        requestAnimationFrame(this.update.bind(this));
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
        this.updateDebugDisplay();
    }

    updateLevel() {
        gameState.framesPerDrop = gameState.getFramesPerDrop(gameState.level);
        gameState.framesPerSoftDrop = Math.max(1, Math.min(Math.floor(gameState.framesPerDrop * gameState.softDropSpeedMultiplier), 5));
        gameState.keyState = {};
        gameDisplay.updateScoreDisplay();
        this.updateDebugDisplay();
    }

    handleInput() {
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