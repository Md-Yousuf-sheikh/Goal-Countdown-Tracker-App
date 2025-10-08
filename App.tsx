import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import * as Notifications from "expo-notifications";

// Configure how notifications are displayed when received in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Import screens
import { HomeScreen } from "./src/screens/HomeScreen";
import { CreateGoalScreen } from "./src/screens/CreateGoalScreen";
import { EditGoalScreen } from "./src/screens/EditGoalScreen";
import { Goal } from "./src/storage/storage";

// Define navigation types
export type RootStackParamList = {
  Home: undefined;
  CreateGoal: undefined;
  EditGoal: { goal: Goal };
};

const Stack = createStackNavigator<RootStackParamList>();

/**
 * Main App component with navigation setup
 * Uses Expo Navigation with stack navigator
 * Integrates all screens and handles navigation flow
 */
export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  async function registerForPushNotificationsAsync() {
    // Request permission for notifications
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      alert("Permission not granted for notifications!");
      return;
    }
  }
  return (
    <GestureHandlerRootView>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: "#007AFF",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: "Goal Countdown Tracker",
              headerStyle: {
                backgroundColor: "#007AFF",
              },
              headerTintColor: "#fff",
              headerTitleStyle: {
                fontWeight: "bold",
                fontSize: 18,
              },
            }}
          />
          <Stack.Screen
            name="CreateGoal"
            component={CreateGoalScreen}
            options={{
              title: "Create Goal",
              headerStyle: {
                backgroundColor: "#007AFF",
              },
              headerTintColor: "#fff",
              headerTitleStyle: {
                fontWeight: "bold",
                fontSize: 18,
              },
              headerBackTitle: "Back",
            }}
          />
          <Stack.Screen
            name="EditGoal"
            component={EditGoalScreen}
            options={{
              title: "Edit Goal",
              headerStyle: {
                backgroundColor: "#007AFF",
              },
              headerTintColor: "#fff",
              headerTitleStyle: {
                fontWeight: "bold",
                fontSize: 18,
              },
              headerBackTitle: "Back",
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
