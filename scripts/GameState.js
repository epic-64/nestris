class GameState {
    constructor() {

    }

    framesSinceLastDrop = 0;
    framesPerDrop = 48;
    paused = false;
    animating = false;
    gameOver = false;
    gameRunning = false;
    level = 0;
    linesClearedTotal = 0;
    startLevel = 0;

    colors = [
        null,
        '#FF0D72', // Tetromino T
        '#0DC2FF', // Tetromino O
        '#0DFF72', // Tetromino L
        '#F538FF', // Tetromino J
        '#FF8E0D', // Tetromino I
        '#FFE138', // Tetromino S
        '#3877FF', // Tetromino Z
    ];

    brightColors = [
        null,
        '#FF5A9D', // Brighter T
        '#4DDCFF', // Brighter O
        '#4DFF9F', // Brighter L
        '#FF7AFF', // Brighter J
        '#FFAC4D', // Brighter I
        '#FFEB70', // Brighter S
        '#709AFF', // Brighter Z
    ];
}