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
}