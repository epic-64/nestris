class TetrisGame {
    constructor({
        gameState: gameState,
    }) {
        this.gameState = gameState;
        this.nextPiece = this.getNewNextPiece();
    }

    showGameOver() {
        document.getElementById('finalScore').innerText = 'Final Score: ' + this.gameState.score;
        document.getElementById('gameOverOverlay').style.display = 'flex';
    }

    start() {
        this.gameState.startLevel = parseInt(document.getElementById('startLevelInput').value);
        if (isNaN(this.gameState.startLevel) || this.gameState.startLevel < 0) {
            this.gameState.startLevel = 0;
        }

        this.gameState.level = this.gameState.startLevel;
        this.gameState.framesSinceLastDrop = 0;
        this.gameState.softDropFrameCount = 0;
        this.gameState.moveFrameCount = this.gameState.moveFrameInterval;

        this.gameState.keyState = {};
        this.gameState.linesClearedTotal = 0;
        this.gameState.running = true;

        arena.forEach(row => row.fill(0));
        this.resetActivePiece(arena);

        this.updateLevel();
        gameDisplay.hideLevelSelection();
        gameDisplay.updateDebugDisplay();

        this.update(); // Start the game loop
    }

    reset() {
        this.gameState.score = 0;
        this.gameState.gameOver = false;
        this.gameState.paused = false;
        this.gameState.running = false; // Stop the game loop
        document.getElementById('gameOverOverlay').style.display = 'none';
        document.getElementById('levelSelectionOverlay').style.display = 'flex';
        gameDisplay.updateScoreDisplay();

        // Reset key states
        this.gameState.keyState = {};

        // Reset lines cleared total
        this.gameState.linesClearedTotal = 0;

        // Clear the arena
        arena.forEach(row => row.fill(0));

        // Update debug info
        gameDisplay.updateDebugDisplay();
    }

    update() {
        if (!this.gameState.running) return;

        if (!this.gameState.paused && !this.gameState.animating && !this.gameState.gameOver) {
            this.gameState.framesSinceLastDrop++;

            this.gameState.isSoftDropping()
                ? this.gameState.onSoftDrop(() => this.dropActivePiece())
                : this.gameState.onRegularDrop(() => this.dropActivePiece())

            this.handleHorizontalInput();

            this.draw();
        }

        requestAnimationFrame(this.update.bind(this));
    }

    dropActivePiece() {
        activePiece.pos.y++;

        if (matrixService.collide(arena, activePiece)) {
            activePiece.pos.y--;
            matrixService.merge(arena, activePiece);
            soundModule.playPieceLockSound();

            this.gameState.softDropLock = true; // interrupt soft drop when piece locks
            this.resetActivePiece(arena);
            animate.arenaSweep();
        }
    }

    updateLevel() {
        this.gameState.framesPerDrop = this.gameState.getFramesPerDrop(this.gameState.level);

        const maxFramesPerDrop = 5;
        const calculatedFramesPerDrop = Math.floor(
            this.gameState.framesPerDrop * this.gameState.softDropSpeedMultiplier
        );

        this.gameState.framesPerSoftDrop = Math.max(1, Math.min(maxFramesPerDrop, calculatedFramesPerDrop));
        this.gameState.keyState = {};

        gameDisplay.updateScoreDisplay();
        gameDisplay.updateDebugDisplay();
    }

    /**
     * @param event KeyboardEvent
     */
    handleKeyDown(event) {
        if (!this.gameState.paused && !this.gameState.animating && !this.gameState.gameOver) {
            if (!event.repeat) {
                // Process rotations on keydown, ignoring repeats
                if (event.code === 'KeyA') {
                    activePiece.rotate(-1, arena);
                } else if (event.code === 'KeyD') {
                    activePiece.rotate(1, arena);
                } else if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
                    this.gameState.moveFrameCount = this.gameState.moveFrameInterval; // Allow immediate move

                    tetrisGame.handleHorizontalInput();
                }
            }
            this.gameState.keyState[event.code] = true;
        }
        if (event.code === 'Escape') { // Escape key to toggle pause
            if (!this.gameState.animating && !this.gameState.gameOver) {
                this.gameState.togglePause({ pauseOverlay: document.getElementById('pauseOverlay') });
            }
        }
    }

    handleKeyUp(event) {
        if (!this.gameState.paused && !this.gameState.animating && !this.gameState.gameOver) {
            this.gameState.keyState[event.code] = false;
        }

        this.gameState.softDropLock = false;
    }

    handleHorizontalInput() {
        // Move Left
        if (this.gameState.keyState['ArrowLeft']) {
            this.gameState.moveFrameCount++;
            if (this.gameState.moveFrameCount >= this.gameState.moveFrameInterval) {
                activePiece.move(-1, arena);
                this.gameState.moveFrameCount = 0;
            }
        }
        // Move Right
        else if (this.gameState.keyState['ArrowRight']) {
            this.gameState.moveFrameCount++;
            if (this.gameState.moveFrameCount >= this.gameState.moveFrameInterval) {
                activePiece.move(1, arena);
                this.gameState.moveFrameCount = 0;
            }
        } else {
            // Reset to allow immediate move on next key press
            this.gameState.moveFrameCount = this.gameState.moveFrameInterval;
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
            this.gameState.gameOver = true;
            this.gameState.running = false;
            this.showGameOver();
            highScore.update(this.gameState.score);
        }
    }
}