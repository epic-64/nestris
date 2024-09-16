class SoundModule
{
    constructor(audioContext) {
        this.audioCtx = audioContext;
    }

    playSound (frequencies, durations) {
        let time = this.audioCtx.currentTime;

        frequencies.forEach((freq, index) => {
            const oscillator = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);

            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(freq, time);

            gainNode.gain.setValueAtTime(0.2, time);
            gainNode.gain.exponentialRampToValueAtTime(0.001, time + durations[index]);

            oscillator.start(time);
            oscillator.stop(time + durations[index]);

            time += durations[index];
        });
    }

    playPieceLockSound() {
        this.playSound([150], [0.1]);
    }

    playLineClearSound(linesCleared) {
        if (linesCleared === 1) {
            this.playSound([200, 250], [0.1, 0.1]);
        } else if (linesCleared === 2) {
            this.playSound([250, 300, 350], [0.1, 0.1, 0.1]);
        } else if (linesCleared === 3) {
            this.playSound([300, 350, 400, 450], [0.1, 0.1, 0.1, 0.1]);
        } else if (linesCleared === 4) {
            this.playSound([440, 550, 660, 880], [0.15, 0.15, 0.15, 0.15]);
        }
    }
}

