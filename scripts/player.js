class Player {
    constructor() {
        this.pos = {x: 0, y: 0};
        this.matrix = null;
        this.score = 0;
    }

    move(dir, arena) {
        this.pos.x += dir;

        if (collide(arena, this)) {
            this.pos.x -= dir;
        }
    }

    rotate(dir, arena) {
        const pos = this.pos.x;
        let offset = 1;
        rotate(this.matrix, dir);

        while (collide(arena, this)) {
            this.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));

            if (offset > this.matrix[0].length) {
                rotate(this.matrix, -dir);
                this.pos.x = pos;

                return;
            }
        }
    }

    drop(arena) {
        this.pos.y++;

        if (collide(arena, this)) {
            this.pos.y--;
            merge(arena, this);
            soundModule.playPieceLockSound();
            this.reset(arena);
            arenaSweep();
        }
    }

    reset(arena) {
        const pieces = 'TJLOSZI';
        this.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
        this.pos.y = 0;
        this.pos.x = (arena[0].length / 2 | 0) -
            (this.matrix[0].length / 2 | 0);

        if (collide(arena, this)) {
            gameOver = true;
            gameRunning = false;
            showGameOver();
            highScore.update(this.score);
        }
    }
}