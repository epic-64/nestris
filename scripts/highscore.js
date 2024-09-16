class HighScore {
    constructor({storageKey, htmlElementId}) {
        console.log('HighScore constructor')
        console.log(storageKey)
        console.log(htmlElementId)

        this.highScore = 0
        this.storageKey = storageKey
        this.htmlElementId = htmlElementId
    }

    init() {
        this.load();
        this.display();
    }

    load() {
        this.highScore = window.localStorage.getItem(this.storageKey) || 0
    }

    save() {
        window.localStorage.setItem(this.storageKey, this.highScore);
    }

    display() {
        // window.document.getElementById(this.htmlElementId).innerText = 'High Score: ' + this.highScore;
    }

    update(score) {
        if (score > this.highScore) {
            this.highScore = score;
            this.save();
            this.display();
        }
    }
}