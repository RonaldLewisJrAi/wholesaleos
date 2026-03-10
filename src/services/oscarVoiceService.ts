class OSCARVoiceService {
    private isPlaying: boolean = false;
    private onPlayStateChange: ((isPlaying: boolean) => void) | null = null;
    private onMessageUpdate: ((message: string) => void) | null = null;
    private lastMessage: string = "";
    private lastSpoken: number = 0;
    private voiceOutputEnabled: boolean = true; // Phase 24 Toggle Requirement

    setPlayStateCallback(callback: (isPlaying: boolean) => void) {
        this.onPlayStateChange = callback;
    }

    setTranscriptCallback(callback: (message: string) => void) {
        this.onMessageUpdate = callback;
    }

    setVoiceEnabled(enabled: boolean) {
        this.voiceOutputEnabled = enabled;
        if (!enabled) {
            this.stop();
        }
    }

    getVoiceEnabled() {
        return this.voiceOutputEnabled;
    }

    private updatePlayState(state: boolean) {
        this.isPlaying = state;
        if (this.onPlayStateChange) {
            this.onPlayStateChange(state);
        }
    }

    speak(text: string) {
        this.lastMessage = text;
        if (this.onMessageUpdate) {
            this.onMessageUpdate(text);
        }

        // Phase 24 Rule: "Optional Voice Output"
        if (!this.voiceOutputEnabled) return;

        // Phase 24 Rule: "Prevent Audio Spam"
        const now = Date.now();
        if (now - this.lastSpoken < 2000) return;
        this.lastSpoken = now;

        if (this.isPlaying) {
            this.stop();
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
            const previousState = this.voiceOutputEnabled;
            // Temporarily enable voice to force replay if they clicked a button specifically
            this.voiceOutputEnabled = true;
            this.speak(this.lastMessage);
            this.voiceOutputEnabled = previousState;
        }
    }

    getLastMessage() {
        return this.lastMessage;
    }
}

export const oscarVoiceService = new OSCARVoiceService();
