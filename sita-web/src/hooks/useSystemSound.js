import { useCallback } from 'react';

export function useSystemSound() {
    const playTone = useCallback((frequency, duration, type = 'sine', volume = 0.1) => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start();
        oscillator.stop(ctx.currentTime + duration);
    }, []);

    const playScan = () => {
        // High pitched rapid bleeps
        playTone(1200, 0.05, 'square', 0.05);
        setTimeout(() => playTone(1200, 0.05, 'square', 0.05), 100);
    };

    const playAccessGranted = () => {
        // Ascending chime
        playTone(800, 0.1, 'sine', 0.1);
        setTimeout(() => playTone(1200, 0.2, 'sine', 0.1), 100);
        setTimeout(() => playTone(1600, 0.4, 'sine', 0.1), 200);
    };

    const playAccessDenied = () => {
        // Low buzzing error
        playTone(150, 0.3, 'sawtooth', 0.2);
        setTimeout(() => playTone(120, 0.3, 'sawtooth', 0.2), 200);
    };

    const playTick = () => {
        // Subtle click
        playTone(2000, 0.01, 'square', 0.02);
    };

    return { playScan, playAccessGranted, playAccessDenied, playTick };
}
