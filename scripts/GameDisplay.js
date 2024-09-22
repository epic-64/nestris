class GameDisplay {
    constructor({
        scoreElement: scoreElement,
        levelSelectionElement: levelSelectionElement,
    }) {
        this.scoreElement = scoreElement;
        this.levelSelectionElement = levelSelectionElement;
    }

    updateScoreDisplay() {
        this.scoreElement.innerText = 'Score: ' + player.score + ' | level: ' + gameState.level;
    }

    hideLevelSelection() {
        this.levelSelectionElement.style.display = 'none';
    }

    showLevelSelection() {
        this.levelSelectionElement.style.display = 'flex';
    }

    // Debug Information Function
    updateDebugDisplay() {
        const framesPerDropValue = gameState.framesPerDropTable[gameState.level] || 1;

        document.getElementById('debugInfo').innerHTML = `
                <strong>Debug Info:</strong><br>
                level: ${gameState.level}<br>
                Lines Cleared: ${gameState.linesClearedTotal}<br>
                Frames Per Drop: ${framesPerDropValue}<br>
                Frames Per Soft Drop: ${gameState.framesPerSoftDrop}
            `;
    }
}