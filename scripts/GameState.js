class GameState {
    constructor() {

    }

    level = 0;
    startLevel = 0;
    linesClearedTotal = 0;

    running = false;
    paused = false;
    animating = false;
    gameOver = false;

    framesSinceLastDrop = 0;
    framesPerDrop = 48;

    softDropFrameCount = 0;
    softDropSpeedMultiplier = 0.5;
    framesPerSoftDrop = 1;

    keyState = {};

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

    // Frames per drop for each gameState.level (assuming 60 FPS)
    framesPerDropTable = {
        0: 48,
        1: 43,
        2: 38,
        3: 33,
        4: 28,
        5: 23,
        6: 18,
        7: 13,
        8: 8,
        9: 6,
        10: 5,
    };

    pause() {
        this.paused = true;
    }

    unpause() {
        this.paused = false;
    }

    togglePause({pauseOverlay}) {
        this.paused = !this.paused;

        if (this.paused) {
            pauseOverlay.style.display = 'flex';
        } else {
            pauseOverlay.style.display = 'none';

            // Reset frame counters to prevent jumps
            this.framesSinceLastDrop = 0;
            this.softDropFrameCount = 0;
            moveFrameCount = moveFrameInterval;
        }
    }

    getFramesPerDrop(level) {
        return this.framesPerDropTable[level] || 1;
    }
}