/**
 * Speech Manager - Coordinates speech output and voice recognition
 * Prevents echo by pausing recognition during app speech
 */

import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

type SpeechCallback = () => void;

class SpeechManager {
  private isSpeaking: boolean = false;
  private speechQueue: Array<{ text: string; options: any; onComplete?: SpeechCallback }> = [];
  private onSpeechStartCallbacks: SpeechCallback[] = [];
  private onSpeechEndCallbacks: SpeechCallback[] = [];
  private isProcessing: boolean = false;

  /**
   * Register callback for when speech starts
   */
  onSpeechStart(callback: SpeechCallback) {
    this.onSpeechStartCallbacks.push(callback);
  }

  /**
   * Register callback for when speech ends
   */
  onSpeechEnd(callback: SpeechCallback) {
    this.onSpeechEndCallbacks.push(callback);
  }

  /**
   * Remove callback
   */
  removeCallback(callback: SpeechCallback) {
    this.onSpeechStartCallbacks = this.onSpeechStartCallbacks.filter(cb => cb !== callback);
    this.onSpeechEndCallbacks = this.onSpeechEndCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Remove all callbacks for a specific component
   */
  removeAllCallbacks(componentCallbacks: SpeechCallback[]) {
    componentCallbacks.forEach(callback => {
      this.removeCallback(callback);
    });
  }

  /**
   * Check if app is currently speaking
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Speak text with echo cancellation
   */
  speak(text: string, options: any = {}, onComplete?: SpeechCallback) {
    if (Platform.OS === 'web') {
      // Web platform - no speech support, just call callback
      if (onComplete) {
        setTimeout(onComplete, 1000);
      }
      return;
    }

    // Add to queue
    this.speechQueue.push({ text, options, onComplete });
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process speech queue
   */
  private async processQueue() {
    if (this.speechQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const { text, options, onComplete } = this.speechQueue.shift()!;

    // Notify that speech is starting
    this.isSpeaking = true;
    this.onSpeechStartCallbacks.forEach(cb => cb());

    try {
      await Speech.speak(text, {
        ...options,
        rate: options.rate || 1,
        language: options.language || 'en-US',
        onDone: () => {
          // Speech finished successfully
          this.isSpeaking = false;
          this.onSpeechEndCallbacks.forEach(cb => cb());
          
          if (onComplete) {
            onComplete();
          }
          
          // Process next in queue
          this.processQueue();
        },
        onError: () => {
          // Speech failed
          this.isSpeaking = false;
          this.onSpeechEndCallbacks.forEach(cb => cb());
          
          if (onComplete) {
            onComplete();
          }
          
          // Process next in queue
          this.processQueue();
        },
      });
    } catch (error) {
      console.error('Speech error:', error);
      this.isSpeaking = false;
      this.onSpeechEndCallbacks.forEach(cb => cb());
      
      if (onComplete) {
        onComplete();
      }
      
      // Process next in queue
      this.processQueue();
    }
  }

  /**
   * Stop current speech and clear queue
   */
  stop() {
    try {
      Speech.stop();
    } catch (error) {
      console.error('Stop speech error:', error);
    }
    
    this.speechQueue = [];
    this.isSpeaking = false;
    this.isProcessing = false;
    this.onSpeechEndCallbacks.forEach(cb => cb());
  }

  /**
   * Clear all callbacks
   */
  clearCallbacks() {
    this.onSpeechStartCallbacks = [];
    this.onSpeechEndCallbacks = [];
  }

  /**
   * Clear all callbacks - use with caution as this affects all components
   */
  clearAllCallbacks() {
    this.onSpeechStartCallbacks = [];
    this.onSpeechEndCallbacks = [];
  }

  /**
   * Get callback counts for debugging
   */
  getCallbackCounts() {
    return {
      startCallbacks: this.onSpeechStartCallbacks.length,
      endCallbacks: this.onSpeechEndCallbacks.length
    };
  }
}

// Export singleton instance
export const speechManager = new SpeechManager();
