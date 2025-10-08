import * as Notifications from "expo-notifications";

const sendNotification = async (title: string, body: string) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: null, // immediate notification
  });
};

export default sendNotification;
