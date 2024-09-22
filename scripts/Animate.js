class Animate {
    constructor({
        gameState: gameState,
    }) {
        this.gameState = gameState;
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
            this.gameState.animating = true;

            this.animateLineClear(linesCleared, () => {
                // After animation, remove the lines and update the score
                linesCleared.forEach(y => {
                    arena.splice(y, 1);
                    arena.unshift(new Array(arena[0].length).fill(0));
                });

                let points = [0, 40, 100, 300, 1200];
                this.gameState.score += points[linesCleared.length] * (this.gameState.level + 1);
                this.gameState.linesClearedTotal += linesCleared.length;

                let calculatedLevel = this.gameState.startLevel + Math.floor(this.gameState.linesClearedTotal / 10);
                this.gameState.level = Math.min(10, calculatedLevel);

                tetrisGame.updateLevel();
                this.gameState.animating = false;

                // Reset frame count after line clear
                this.gameState.framesSinceLastDrop = 0;

                // Update debug info
                gameDisplay.updateDebugDisplay();
            });
        }
    }

    animateLineClear(linesCleared, callback) {
        this.gameState.pause()

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

        // Use arrow functions to preserve 'this'
        const animateLighting = () => {
            if (currentStep < cellsToAnimate.length) {
                const cell = cellsToAnimate[currentStep];
                tetrisGame.draw(); // Redraw arena and player

                arenaContext.fillStyle = this.gameState.getBrightColor(cell.value);
                arenaContext.fillRect(cell.x, cell.y, 1, 1);

                currentStep++;
                setTimeout(animateLighting, perCellDuration);
            } else {
                currentStep = 0;
                setTimeout(animateDeletion, perCellDuration);
            }
        };

        const animateDeletion = () => {
            if (currentStep < cellsToDelete.length) {
                const cell = cellsToDelete[currentStep];
                arena[cell.y][cell.x] = 0;
                tetrisGame.draw();
                currentStep++;
                setTimeout(animateDeletion, perCellDuration);
            } else {
                this.gameState.unpause();
                this.gameState.framesSinceLastDrop = 0; // Reset frame count after animation
                callback();
            }
        };

        animateLighting();
    }
}