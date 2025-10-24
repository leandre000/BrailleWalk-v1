# Voice Command System - BrailleWalk

## Overview

BrailleWalk now includes a comprehensive voice command system that allows visually impaired users to control the app entirely through voice. The system supports two activation methods:

1. **Wake Word Activation**: Say "Hey BrailleWalk" followed by your command (hands-free)
2. **Tap-to-Speak**: Tap the blue microphone button and speak your command

## Features

- **Continuous Wake Word Listening**: Always listening for "Hey BrailleWalk" in the background
- **Tap-to-Activate**: Blue floating button on all screens for manual voice input
- **Voice Feedback**: App speaks back confirmations and responses
- **Visual Indicators**: Shows listening status and recognized text
- **Smart Command Recognition**: Understands natural language variations

## How to Use

### Wake Word Method (Hands-Free)
1. Say **"Hey BrailleWalk"**
2. Wait for confirmation sound and "Yes, I am listening"
3. Speak your command within 5 seconds
4. App executes the command and provides voice feedback

### Tap-to-Speak Method
1. Tap the **blue microphone button** (bottom-right corner)
2. Wait for "Listening" confirmation
3. Speak your command within 5 seconds
4. App executes the command and provides voice feedback

## Voice Commands by Screen

### Authentication Screen
**Available Commands:**
- "Login" / "Sign in" / "Authenticate" / "Start" → Starts authentication

**Example:**
```
You: "Hey BrailleWalk"
App: "Yes, I am listening"
You: "Login"
App: "Starting authentication"
```

---

### Dashboard Screen
**Available Commands:**
- "Navigate" / "Navigation" → Opens navigation mode
- "Scan" / "Camera" / "Object" → Opens scan mode
- "Emergency" / "Help" / "Call" → Opens emergency contacts
- "Repeat" / "Instructions" → Repeats available options

**Examples:**
```
You: "Hey BrailleWalk"
App: "Yes, I am listening"
You: "Navigate"
App: "Opening navigation mode"
```

```
You: "Hey BrailleWalk"
App: "Yes, I am listening"
You: "Scan"
App: "Opening scan mode"
```

---

### Navigation Screen
**Available Commands:**
- "Pause" / "Stop" → Pauses navigation
- "Resume" / "Continue" / "Start" → Resumes navigation
- "Repeat" / "Again" / "What" → Repeats last instruction
- "Exit" / "Quit" / "Back" / "Leave" → Returns to dashboard

**Examples:**
```
You: "Hey BrailleWalk"
App: "Yes, I am listening"
You: "Pause"
App: "Pausing navigation"
```

```
You: "Hey BrailleWalk"
App: "Yes, I am listening"
You: "Repeat"
App: [Repeats last navigation instruction]
```

---

### Scan Screen
**Available Commands:**
- "Scan" / "Capture" / "Take" → Takes a photo and analyzes it
- "Text" → Switches to text recognition mode
- "Object" → Switches to object recognition mode
- "Barcode" → Switches to barcode scanning mode
- "Auto" → Switches to automatic detection mode
- "Exit" / "Quit" / "Back" / "Leave" → Returns to dashboard

**Examples:**
```
You: "Hey BrailleWalk"
App: "Yes, I am listening"
You: "Scan"
App: "Scanning"
```

```
You: "Hey BrailleWalk"
App: "Yes, I am listening"
You: "Text"
App: "text mode"
```

---

### Emergency Screen
**Available Commands:**
- "Call [contact name]" → Calls specific contact by name
  - Example: "Call Lucy" / "Call Bill"
- "Call first" / "Call nearest" → Calls the nearest contact
- "End" / "Hang up" / "Stop" → Ends active call (during call only)
- "Back" / "Exit" / "Leave" → Returns to dashboard

**Examples:**
```
You: "Hey BrailleWalk"
App: "Yes, I am listening"
You: "Call Lucy"
App: "Calling UWIMANA Lucy"
```

```
You: "Hey BrailleWalk"
App: "Yes, I am listening"
You: "Call nearest"
App: "Calling [nearest contact name]"
```

```
[During active call]
You: "Hey BrailleWalk"
App: "Yes, I am listening"
You: "End"
App: "Ending call"
```

---

## Technical Details

### Component: VoiceCommandListener

**Location:** `/components/VoiceCommandListener.tsx`

**Props:**
- `onCommand: (command: string) => void` - Callback when command is recognized
- `enabled?: boolean` - Enable/disable voice listening (default: true)
- `wakeWord?: string` - Custom wake word (default: "hey braillewalk")
- `showVisualFeedback?: boolean` - Show visual indicators (default: true)

**Features:**
- Continuous background listening for wake word
- Manual tap-to-activate button
- 5-second timeout for command input
- Haptic feedback on activation
- Visual status indicators
- Automatic restart after errors

### Integration Pattern

```typescript
import VoiceCommandListener from '@/components/VoiceCommandListener';

const handleVoiceCommand = (command: string) => {
  const lowerCommand = command.toLowerCase();
  
  if (lowerCommand.includes('your keyword')) {
    Speech.speak('Confirmation message', { rate: 1, language: 'en-US' });
    // Execute action
  }
};

// In JSX
<VoiceCommandListener
  onCommand={handleVoiceCommand}
  enabled={true}
  wakeWord="hey braillewalk"
  showVisualFeedback={true}
/>
```

## Permissions Required

The voice command system requires the following permissions:

### iOS (Info.plist)
- `NSMicrophoneUsageDescription`: "BrailleWalk needs microphone access for voice commands and authentication."
- `NSSpeechRecognitionUsageDescription`: "BrailleWalk uses speech recognition for voice commands and accessibility features."

### Android (AndroidManifest.xml)
- `android.permission.RECORD_AUDIO`: For microphone access
- `android.permission.MODIFY_AUDIO_SETTINGS`: For audio configuration

These permissions are already configured in `app.json`.

## Troubleshooting

### Voice Commands Not Working
1. **Check Permissions**: Ensure microphone and speech recognition permissions are granted
2. **Check Platform**: Voice recognition works on iOS and Android, limited support on web
3. **Speak Clearly**: Speak clearly and wait for "Yes, I am listening" confirmation
4. **Check Volume**: Ensure device volume is adequate
5. **Retry**: If command fails, try again or use tap-to-speak method

### Wake Word Not Detected
1. **Speak Louder**: Say "Hey BrailleWalk" clearly and at normal volume
2. **Reduce Background Noise**: Move to quieter environment
3. **Use Tap-to-Speak**: Alternative method that's more reliable in noisy environments

### Commands Not Recognized
1. **Use Exact Phrases**: Refer to command list above for exact phrases
2. **Speak Naturally**: Natural language variations are supported
3. **Check Context**: Some commands only work in specific screens/states
4. **Listen for Feedback**: App will tell you available commands if it doesn't understand

## Best Practices

1. **Wait for Confirmation**: Always wait for "Yes, I am listening" before speaking command
2. **Speak Clearly**: Enunciate words clearly at normal speaking pace
3. **Use Wake Word**: For hands-free operation, use "Hey BrailleWalk"
4. **Use Tap-to-Speak**: In noisy environments, use the button method
5. **Listen to Feedback**: App provides voice feedback for all actions
6. **Be Patient**: Allow 1-2 seconds for command processing

## Accessibility Features

- **Hands-Free Operation**: Complete app control without touching screen
- **Voice Feedback**: All actions confirmed with speech
- **Haptic Feedback**: Vibration feedback for important actions
- **Visual Indicators**: Optional visual status for users with partial vision
- **Natural Language**: Understands variations of commands
- **Context-Aware**: Commands adapt to current screen and state

## Future Enhancements

Potential improvements for future versions:
- Multi-language support (French, Kinyarwanda, etc.)
- Custom wake word configuration
- Voice command history
- Offline voice recognition
- Voice training for better accuracy
- Custom command shortcuts
- Voice-based navigation preferences

## Support

For issues or questions about voice commands:
1. Check this documentation
2. Review troubleshooting section
3. Test with tap-to-speak method
4. Contact BrailleWalk support team

---

**Version:** 1.0.0  
**Last Updated:** October 2025  
**Package:** expo-speech-recognition v2.1.5
