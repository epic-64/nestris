const highScoreModule = {
    highScore: 0,
    storageKey: 'highScore',
    load() {
        this.highScore = localStorage.getItem(this.storageKey) || 0;
    },
    save() {
        localStorage.setItem(this.storageKey, this.highScore);
    },
    display() {
        document.getElementById(this.storageKey).innerText = 'High Score: ' + this.highScore;
    },
    update(score) {
        if (score > this.highScore) {
            this.highScore = score;
            this.save();
            this.display();
        }
    }
}