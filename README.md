# BrailleWalk 

**AI-powered assistive technology for visually impaired individuals**

BrailleWalk is an innovative mobile application that combines wearable technology (camera on glasses) and AI-powered computer vision to provide real-time assistance for visually impaired individuals. The app offers navigation guidance, text recognition, object detection, and emergency contact features.

##  Key Features

- **Real-time Navigation Assistance** - AI-powered guidance for safe walking
- **Text-to-Speech Reader** - Reads signs, documents, and labels aloud
- **Object & Obstacle Detection** - Identifies objects and alerts about obstacles
- **Emergency Contact System** - GPS location sharing with caregivers
- **Voice Commands** - Hands-free operation with voice recognition
- **Accessible Design** - Optimized interface for visually impaired users

##  Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/leandre000/BrailleWalk.git
cd BrailleWalk
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
```bash
npm run ios     # iOS Simulator
npm run android # Android Emulator
npm run web     # Web Browser
```

##  App Structure

- **Authentication Screen** - Voice/face recognition for secure access
- **Dashboard** - Main navigation hub with feature selection
- **Navigation Mode** - Real-time walking guidance with audio feedback
- **Scan Mode** - Object recognition and text reading capabilities
- **Emergency Mode** - Contact caregivers with GPS location sharing

##  Technology Stack

- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and tools
- **TypeScript** - Type-safe JavaScript
- **Expo Camera** - Camera integration for glasses attachment
- **Expo Speech** - Text-to-speech functionality
- **Expo Location** - GPS and location services
- **React Navigation** - Screen navigation
- **Lucide React Native** - Icon library

##  Target Users

- Visually impaired individuals seeking independence
- Caregivers and families
- Hospitals and institutions
- Accessibility-focused organizations

## 🔧 Development

### Project Structure
```
BrailleWalk/
├── app/                 # Screen components
├── components/          # Reusable components
├── assets/             # Images and icons
├── colors/             # Color scheme definitions
└── package.json        # Dependencies and scripts
```

### Key Dependencies
- `expo-camera` - Camera functionality
- `expo-speech` - Text-to-speech
- `expo-location` - GPS services
- `react-native-gesture-handler` - Touch interactions
- `@tanstack/react-query` - State management

##  License

MIT License - see LICENSE file for details

##  Contributing

We welcome contributions! Please see our contributing guidelines for more information.

##  Support

For support and questions, please contact the BrailleWalk team.

---

**Making the world more accessible, one step at a time.**
