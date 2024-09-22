class HighScore {
    constructor({storageKey, htmlElement}) {
        this.highScore = 0
        this.storageKey = storageKey
        this.htmlElement = htmlElement
    }

    init() {
        this.load();
        this.display();
    }

    load() {
        this.highScore = localStorage.getItem(this.storageKey) || 0
    }

    save() {
        localStorage.setItem(this.storageKey, this.highScore);
    }

    display() {
        this.htmlElement.innerText = this.highScore;
    }

    update(score) {
        if (score > this.highScore) {
            this.highScore = score;
            this.save();
            this.display();
        }
    }
}