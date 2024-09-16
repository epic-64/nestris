soundModule = {
    audioCtx: new (window.AudioContext)(),
    playSound: function (frequencies, durations) {
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
};

