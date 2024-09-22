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
        const pos = this.pos.x;
        let offset = 1;
        matrixService.rotate(this.matrix, dir);

        soundModule.playRotationSound();

        while (matrixService.collide(arena, this)) {
            this.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));

            if (offset > this.matrix[0].length) {
                matrixService.rotate(this.matrix, -dir);
                this.pos.x = pos;

                return;
            }
        }
    }

    drop(arena) {
        this.pos.y++;

        if (matrixService.collide(arena, this)) {
            this.pos.y--;
            matrixService.merge(arena, this);
            soundModule.playPieceLockSound();
            this.reset(arena);
            arenaSweep();
        }
    }

    reset(arena) {
        const pieces = 'TJLOSZI';
        this.matrix = matrixService.createPiece(pieces[pieces.length * Math.random() | 0]);
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