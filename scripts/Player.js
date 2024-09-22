class Player {
    constructor() {
        this.pos = {x: 0, y: 0};
        this.matrix = null;
        this.score = 0;
    }

    move(dir, arena) {
        this.pos.x += dir;

        if (matrixService.collide(arena, this)) {
            this.pos.x -= dir;
        } else {
            soundModule.playMovementSound();
        }
    }

    rotate(dir, arena) {
        // Rotate the piece
        matrixService.rotate(this.matrix, dir);

        // Check for collision
        if (matrixService.collide(arena, this)) {
            // Undo the rotation
            matrixService.rotate(this.matrix, -dir);
            // Optionally, play a different sound or no sound
            soundModule.playFailedRotationSound();
        } else {
            // Play rotation sound only if rotation is successful
            soundModule.playRotationSound();
        }
    }

    drop(arena) {
        this.pos.y++;

        if (matrixService.collide(arena, this)) {
            this.pos.y--;
            matrixService.merge(arena, this);
            soundModule.playPieceLockSound();

            gameState.softDropLock = true; // interrupt soft drop when piece locks
            this.reset(arena);
            arenaSweep();
        }
    }

    reset(arena) {
        this.matrix = tetrisGame.getNewPieceMatrix();

        this.pos.y = 0;
        this.pos.x =
            (arena[0].length / 2 | 0) -
            (this.matrix[0].length / 2 | 0);

        if (matrixService.collide(arena, this)) {
            gameState.gameOver = true;
            gameState.running = false;
            tetrisGame.showGameOver();
            highScore.update(this.score);
        }
    }
}