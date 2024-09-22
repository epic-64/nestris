class ActivePiece {
    constructor() {
        this.pos = {x: 0, y: 0};
        this.matrix = null;
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

    reset(arena) {
        this.matrix = tetrisGame.getNewPieceMatrix();

        this.pos.y = 0;
        this.pos.x =
            (arena[0].length / 2 | 0) -
            (this.matrix[0].length / 2 | 0);
    }
}