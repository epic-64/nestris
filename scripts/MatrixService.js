class MatrixService {
    tetrominoes= {
        'T': [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ],
        'O': [
            [2, 2],
            [2, 2],
        ],
        'L': [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3],
        ],
        'J': [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0],
        ],
        'I': [
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
        ],
        'S': [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ],
        'Z': [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0],
        ],
    };

    createMatrix(w, h) {
        const matrix = [];
        while (h--) {
            matrix.push(new Array(w).fill(0));
        }
        return matrix;
    }

    merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }

    collide(arena, player) {
        const m = player.matrix;
        const o = player.pos;
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (arena[y + o.y] &&
                        arena[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [
                    matrix[x][y],
                    matrix[y][x],
                ] = [
                    matrix[y][x],
                    matrix[x][y],
                ];
            }
        }

        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }

    createPiece(type) {
        return this.tetrominoes[type];
    }
}