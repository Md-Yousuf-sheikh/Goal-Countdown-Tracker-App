# Goal Countdown Tracker App

A React Native mobile application built with Expo that helps you track and manage your goals with countdown timers. Set deadlines, receive notifications, and stay motivated to achieve your objectives.

## Features

- 🎯 **Goal Management**: Create, edit, and delete personal goals
- ⏰ **Real-time Countdown**: Live countdown timers showing time remaining
- 🔔 **Smart Notifications**: Get notified when goals are approaching or have expired
- 📱 **Cross-platform**: Works on iOS and Android
- 💾 **Local Storage**: All data stored locally using AsyncStorage
- 🎨 **Modern UI**: Clean and intuitive user interface
- 🔄 **Sorting & Filtering**: Organize goals by deadline, creation date, or title
- 📊 **Status Tracking**: Track active, expired, and completed goals

## Screenshots

*Add screenshots of your app here*

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd countdown-tracker-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Run on your preferred platform:
```bash
# iOS
npm run ios
# or
yarn ios

# Android
npm run android
# or
yarn android

# Web
npm run web
# or
yarn web
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Countdown.tsx   # Countdown timer component
│   ├── DatePicker.tsx  # Date picker component
│   ├── GoalItem.tsx    # Individual goal item component
│   └── TimePicker.tsx  # Time picker component
├── screens/            # App screens
│   ├── HomeScreen.tsx      # Main screen with goals list
│   ├── CreateGoalScreen.tsx # Goal creation screen
│   └── EditGoalScreen.tsx   # Goal editing screen
├── storage/            # Data persistence
│   ├── storage.ts      # TypeScript storage interface
│   └── storage.js      # Storage implementation
└── utils/              # Utility functions
    └── sendNotification.ts # Notification handling
```

## Key Technologies

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe JavaScript
- **React Navigation**: Navigation library
- **AsyncStorage**: Local data persistence
- **Expo Notifications**: Push notification system
- **React Native Gesture Handler**: Touch gesture handling

## Usage

### Creating a Goal

1. Tap the "+" button on the home screen
2. Enter your goal title and description
3. Set the target date and time
4. Choose notification preferences
5. Save your goal

### Managing Goals

- **View**: All goals are displayed on the home screen with countdown timers
- **Edit**: Tap on any goal to modify its details
- **Delete**: Swipe left on a goal or use the delete button
- **Sort**: Use the sort options to organize goals by deadline, creation date, or title
- **Filter**: Filter goals by status (all, active, expired)

### Notifications

The app will automatically send notifications when:
- A goal is approaching its deadline (configurable)
- A goal has expired
- You can customize notification timing in the goal settings

## Development

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser

### Building for Production

```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include device information and steps to reproduce

## Roadmap

- [ ] Goal categories and tags
- [ ] Progress tracking for long-term goals
- [ ] Data export/import functionality
- [ ] Dark mode support
- [ ] Widget support for home screen
- [ ] Cloud sync capabilities
- [ ] Goal sharing features
- [ ] Achievement badges and rewards

---

Made with ❤️ using React Native and Expo
