class VoiceAssistantService {
    private isPlaying: boolean = false;
    private onPlayStateChange: ((isPlaying: boolean) => void) | null = null;
    private onMessageUpdate: ((message: string) => void) | null = null;
    private lastMessage: string = "";
    private lastSpoken: number = 0;

    setPlayStateCallback(callback: (isPlaying: boolean) => void) {
        this.onPlayStateChange = callback;
    }

    setTranscriptCallback(callback: (message: string) => void) {
        this.onMessageUpdate = callback;
    }

    private updatePlayState(state: boolean) {
        this.isPlaying = state;
        if (this.onPlayStateChange) {
            this.onPlayStateChange(state);
        }
    }

    speak(text: string) {
        const now = Date.now();
        if (now - this.lastSpoken < 2000) return;
        this.lastSpoken = now;

        // Prevent strictly overlapping audio or duplicate consecutive spam
        if (this.isPlaying) {
            this.stop();
        }

        this.lastMessage = text;
        if (this.onMessageUpdate) {
            this.onMessageUpdate(text);
        }

        const utterance = new SpeechSynthesisUtterance(text);

        // Bloomberg-style analyst tone parameters
        utterance.rate = 0.9;
        utterance.pitch = 0.9;
        utterance.volume = 1.0;
        utterance.lang = "en-US";

        utterance.onstart = () => this.updatePlayState(true);
        utterance.onend = () => this.updatePlayState(false);
        utterance.onerror = () => this.updatePlayState(false);

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }

    stop() {
        window.speechSynthesis.cancel();
        this.updatePlayState(false);
    }

    replayLast() {
        if (this.lastMessage) {
            this.speak(this.lastMessage);
        }
    }

    getLastMessage() {
        return this.lastMessage;
    }
}

export const voiceAssistant = new VoiceAssistantService();
