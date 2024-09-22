class TetrisGame {
    constructor() {

    }

    showGameOver() {
        document.getElementById('finalScore').innerText = 'Final Score: ' + player.score;
        document.getElementById('gameOverOverlay').style.display = 'flex';
    }

    // Start the game only after the first piece is generated
    startGame() {
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

        gameState.running = true;

        updateLevel();
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

            if (isSoftDropping(gameState.keyState)) {
                handleSoftDrop();
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

        requestAnimationFrame(this.update.bind(this));
    }

    reset() {
        player.score = 0;
        gameState.gameOver = false;
        gameState.paused = false;
        gameState.running = false; // Stop the game loop
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
        this.updateDebugDisplay();
    }
}