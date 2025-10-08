Task Title:
Goal Countdown Tracker (Custom Date-Time Picker + Timer Logic)
Time Limit: 24 hours

Objective
Build a React Native app that lets users:
Create and view personal goals/targets.
Each goal has a title, description, and deadline (date + time).
A countdown timer begins immediately after creation and updates in real time until the deadline.
All logic must be implemented manually — no third-party date/time or countdown libraries (e.g. no moment.js, react-native-countdown-component, etc.).
Data should persist locally between sessions.



Core Requirements
1. Create a Goal
Fields:
title (string, required)
description (string, optional)
deadlineDate (YYYY-MM-DD)
deadlineTime (HH:MM in 24-hour format)


Use custom date & time input pickers built from scratch:
Date selector using dropdowns or scrollable lists (Day / Month / Year).
Time selector with separate hour/minute AM-PM toggles or numeric inputs.


When “Save Goal” is pressed, store it locally (AsyncStorage).



2. Countdown Logic (Core Complexity)
For each goal, display a live countdown:
Format: D days : H hrs : M min : S sec


Countdown must:
Update every second using setInterval.
Automatically stop at 00:00:00.
Handle edge cases (deadline in past → show “Expired”).


Use Date objects and manual time difference calculations (deadline.getTime() - now.getTime()).



3. List of Active Goals
Home screen displays all active goals with:
Title
Remaining time (auto-updating countdown)
“Expired” label for completed ones


Optional delete button to remove goals.



4. Local Data Persistence
Use AsyncStorage to save and load all goals.
Countdown state should rebuild correctly on app restart.



Bonus Challenges (Optional)
Progress Bar Animation
Show percentage completed toward deadline.
Implement manually with Animated API.


Sorting & Filtering
Sort by nearest deadline.
Filter active vs expired.


Notification Reminder
Optional: use Expo Notifications to alert when a goal ends.


Edit Goal Feature
Allow editing title, description, or deadline — auto-recalculate countdown.

