class TetrisGame {
    constructor() {
        this.nextPiece = this.getNewNextPiece();
    }

    showGameOver() {
        document.getElementById('finalScore').innerText = 'Final Score: ' + gameState.score;
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
        this.resetActivePiece(arena);

        this.updateLevel();
        gameDisplay.hideLevelSelection();
        gameDisplay.updateDebugDisplay();

        this.update(); // Start the game loop
    }

    reset() {
        gameState.score = 0;
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
                gameState.handleSoftDrop(activePiece, arena);
            } else {
                gameState.softDropFrameCount = 0;

                if (gameState.framesSinceLastDrop >= gameState.framesPerDrop) {
                    activePiece.drop(arena);
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
                    activePiece.rotate(-1, arena);
                } else if (event.code === 'KeyD') {
                    activePiece.rotate(1, arena);
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

        gameState.softDropLock = false;
    }

    handleHorizontalInput() {
        // Move Left
        if (gameState.keyState['ArrowLeft']) {
            gameState.moveFrameCount++;
            if (gameState.moveFrameCount >= gameState.moveFrameInterval) {
                activePiece.move(-1, arena);
                gameState.moveFrameCount = 0;
            }
        }
        // Move Right
        else if (gameState.keyState['ArrowRight']) {
            gameState.moveFrameCount++;
            if (gameState.moveFrameCount >= gameState.moveFrameInterval) {
                activePiece.move(1, arena);
                gameState.moveFrameCount = 0;
            }
        } else {
            gameState.moveFrameCount = gameState.moveFrameInterval; // Reset to allow immediate move on next key press
        }
    }

    draw() {
        arenaContext.fillStyle = '#000';
        arenaContext.fillRect(0, 0, arenaCanvas.width, arenaCanvas.height);

        matrixService.drawMatrix(arenaContext, arena, {x: 0, y: 0});
        matrixService.drawMatrix(arenaContext, activePiece.matrix, activePiece.pos);

        nextPieceContext.fillStyle = '#000';
        nextPieceContext.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);

        matrixService.drawMatrix(nextPieceContext, this.nextPiece.matrix, {x: 1, y: 1});
    }

    getNewPieceMatrix() {
        // new piece is the next piece
        let newPiece =  this.nextPiece;

        // create a new next piece (for the future)
        this.nextPiece = this.getNewNextPiece();

        // if the next piece is the same as last time, generate a new one (once)
        if (this.nextPiece.letter === newPiece.letter) {
            this.nextPiece = this.getNewNextPiece();
        }

        return newPiece.matrix;
    }

    getNewNextPiece() {
        const letters = 'TJLOSZI';

        let newLetter = letters[letters.length * Math.random() | 0];

        return {
            letter: newLetter,
            matrix: matrixService.createPiece(newLetter)
        };
    }

    resetActivePiece() {
        activePiece.reset(arena);

        if (matrixService.collide(arena, activePiece)) {
            gameState.gameOver = true;
            gameState.running = false;
            tetrisGame.showGameOver();
            highScore.update(gameState.score);
        }
    }

    arenaSweep() {
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
            this.animateLineClear(linesCleared, () => {
                // After animation, remove the lines and update the score
                linesCleared.forEach(y => {
                    arena.splice(y, 1);
                    arena.unshift(new Array(arena[0].length).fill(0));
                });

                let points = [0, 40, 100, 300, 1200];
                gameState.score += points[linesCleared.length] * (gameState.level + 1);
                gameState.linesClearedTotal += linesCleared.length;
                gameState.level = Math.min(10, gameState.startLevel + Math.floor(gameState.linesClearedTotal / 10));
                tetrisGame.updateLevel();
                gameState.animating = false;

                // Reset frame count after line clear
                gameState.framesSinceLastDrop = 0;

                // Update debug info
                gameDisplay.updateDebugDisplay();
            });
        }
    }

    animateLineClear(linesCleared, callback) {
        gameState.pause()

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
                tetrisGame.draw(); // Redraw arena and player

                // Draw lit-up cell
                arenaContext.fillStyle = gameState.getBrightColor(cell.value);
                arenaContext.fillRect(cell.x, cell.y, 1, 1);

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
                tetrisGame.draw();
                currentStep++;
                setTimeout(animateDeletion, perCellDuration);
            } else {
                gameState.unpause();
                gameState.framesSinceLastDrop = 0; // Reset frame count after animation
                callback();
            }
        }

        animateLighting();
    }
}