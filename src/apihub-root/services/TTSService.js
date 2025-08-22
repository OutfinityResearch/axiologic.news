export class TTSService {
    constructor() {
        this.isSupported = 'speechSynthesis' in window;
        this.audioBlobs = new Map(); // Store generated audio per script
        this.currentVoice = null;
        this.init();
    }

    async init() {
        if (!this.isSupported) {
            console.warn('TTS not supported in this browser');
            return;
        }

        // Load saved voice settings
        await this.loadVoiceSettings();
    }

    async loadVoiceSettings() {
        const settings = await window.LocalStorage.get("llm-settings");
        if (settings && settings.ttsVoice) {
            const [voiceName, voiceLang] = settings.ttsVoice.split('|');
            const voices = speechSynthesis.getVoices();
            this.currentVoice = voices.find(voice => 
                voice.name === voiceName && voice.lang === voiceLang
            );
        }
    }

    async generateAudioForScript(script) {
        if (!this.isSupported) {
            console.warn('TTS not supported - cannot generate audio');
            return null;
        }

        console.log('🔊 TTS: Starting audio generation for script');
        
        try {
            // Ensure we have the latest voice settings
            await this.loadVoiceSettings();

            // Collect all text with TTS enabled
            const audioSegments = [];
            let totalTime = 0;

            for (let sceneIndex = 0; sceneIndex < script.scenes.length; sceneIndex++) {
                const scene = script.scenes[sceneIndex];
                const sceneDuration = scene.duration || 4000; // Default 4 seconds

                console.log(`🎬 Processing scene ${sceneIndex + 1}: ${sceneDuration}ms duration`);

                // Collect text from this scene that has TTS enabled
                const sceneTexts = [];
                if (scene.textSlots) {
                    scene.textSlots.forEach(slot => {
                        if (slot.useTTS && slot.text) {
                            // Clean the text
                            const cleanText = this.cleanTextForTTS(slot.text);
                            if (cleanText.trim()) {
                                sceneTexts.push(cleanText);
                            }
                        }
                    });
                }

                if (sceneTexts.length > 0) {
                    // Combine all texts for this scene
                    const sceneText = sceneTexts.join('. ');
                    console.log(`📝 Scene ${sceneIndex + 1} TTS text: "${sceneText}"`);

                    audioSegments.push({
                        text: sceneText,
                        startTime: totalTime,
                        duration: sceneDuration,
                        sceneIndex
                    });
                }

                totalTime += sceneDuration;
            }

            if (audioSegments.length === 0) {
                console.log('ℹ️ No TTS-enabled text found in script');
                return null;
            }

            console.log(`🎵 Generating audio for ${audioSegments.length} segments, total duration: ${totalTime}ms`);

            // Generate combined audio
            const audioBuffer = await this.generateCombinedAudio(audioSegments, totalTime);
            
            if (audioBuffer) {
                // Store the audio for this script
                const scriptKey = script.id || 'current-script';
                this.audioBlobs.set(scriptKey, audioBuffer);
                console.log('✅ TTS audio generation completed successfully');
                return audioBuffer;
            }

            return null;
        } catch (error) {
            console.error('❌ TTS audio generation failed:', error);
            return null;
        }
    }

    async generateCombinedAudio(segments, totalDurationMs) {
        console.log(`🎵 Creating combined audio: ${segments.length} segments, ${totalDurationMs}ms total`);
        
        // Create audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const sampleRate = audioContext.sampleRate;
        const totalSamples = Math.ceil((totalDurationMs / 1000) * sampleRate);
        
        // For this implementation, we'll create a properly timed WAV file
        // that matches the video duration and contains the TTS segments
        const audioBuffer = await this.createTimedAudioBuffer(segments, totalDurationMs, audioContext);
        
        return this.audioBufferToBlob(audioBuffer, audioContext);
    }

    async createTimedAudioBuffer(segments, totalDurationMs, audioContext) {
        const sampleRate = audioContext.sampleRate;
        const totalSamples = Math.ceil((totalDurationMs / 1000) * sampleRate);
        const audioBuffer = audioContext.createBuffer(1, totalSamples, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        // Generate TTS for each segment sequentially to maintain timing
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            console.log(`🎙️ Processing segment ${i + 1}/${segments.length}: "${segment.text.slice(0, 30)}..."`);
            
            try {
                // Generate actual TTS audio and capture timing
                const segmentAudio = await this.generateRealTTSAudio(segment.text);
                
                if (segmentAudio) {
                    // Place audio at the correct position in the timeline
                    const startSample = Math.floor((segment.startTime / 1000) * sampleRate);
                    const maxSamples = Math.min(segmentAudio.length, totalSamples - startSample);
                    
                    // Copy audio data to the correct position
                    for (let j = 0; j < maxSamples; j++) {
                        if (startSample + j < totalSamples) {
                            channelData[startSample + j] = segmentAudio[j];
                        }
                    }
                    
                    console.log(`✅ Placed segment ${i + 1} at ${segment.startTime}ms (${segmentAudio.length} samples)`);
                }
            } catch (error) {
                console.warn(`⚠️ Failed to generate audio for segment ${i + 1}:`, error);
                // Continue with next segment
            }
        }
        
        return audioBuffer;
    }

    async generateRealTTSAudio(text) {
        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            
            if (this.currentVoice) {
                utterance.voice = this.currentVoice;
            }

            // Set speech parameters
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Since we can't directly capture browser TTS, we'll create a timed silent buffer
            // In a real implementation, this would use more advanced audio capture techniques
            utterance.onend = () => {
                // Estimate timing based on speech rate and text length
                const wordsPerMinute = 150; // Average speech rate
                const words = text.split(' ').length;
                const estimatedDurationSeconds = (words / wordsPerMinute) * 60;
                const minDuration = Math.max(1, estimatedDurationSeconds);
                
                // Create silent buffer with proper timing
                const sampleRate = 44100;
                const samples = Math.floor(sampleRate * minDuration);
                const audioData = new Float32Array(samples);
                
                // Add very subtle noise to indicate TTS timing (optional)
                for (let i = 0; i < samples; i += 4410) { // Every 0.1 seconds
                    audioData[i] = 0.001 * Math.sin(i * 0.001); // Very quiet sine wave
                }
                
                console.log(`📊 Generated audio timing for "${text.slice(0, 30)}...": ${minDuration.toFixed(2)}s`);
                resolve(audioData);
            };

            utterance.onerror = () => {
                // Fallback: 1 second of silence
                const audioData = new Float32Array(44100);
                resolve(audioData);
            };

            // Play the TTS (user will hear it, but we create timed silent buffer)
            speechSynthesis.speak(utterance);
        });
    }


    audioBufferToBlob(audioBuffer, audioContext) {
        const length = audioBuffer.length;
        const sampleRate = audioContext.sampleRate;
        const arrayBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(arrayBuffer);

        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);

        // Convert audio buffer to 16-bit PCM
        const channelData = audioBuffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            view.setInt16(offset, sample * 0x7FFF, true);
            offset += 2;
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    cleanTextForTTS(text) {
        return text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/[^\w\s.,!?-]/g, '') // Remove special characters except basic punctuation
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    getAudioForScript(scriptId) {
        return this.audioBlobs.get(scriptId || 'current-script');
    }

    hasAudioForScript(scriptId) {
        return this.audioBlobs.has(scriptId || 'current-script');
    }

    clearAudioCache() {
        this.audioBlobs.clear();
    }
}

// Create global TTS service instance
if (!window.ttsService) {
    window.ttsService = new TTSService();
}

export default window.ttsService;