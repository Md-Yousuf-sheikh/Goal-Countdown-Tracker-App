import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { DatePicker } from "../components/DatePicker";
import { TimePicker } from "../components/TimePicker";
import { GoalStorage, Goal } from "../storage/storage";

interface CreateGoalScreenProps {
  navigation: any;
  onGoalCreated?: (goal: Goal) => void;
}

/**
 * CreateGoalScreen component for creating new goals
 * Features form validation, custom date/time pickers, and goal creation
 * Handles all form inputs and validation before saving to storage
 */
export const CreateGoalScreen: React.FC<CreateGoalScreenProps> = ({
  navigation,
  onGoalCreated,
}) => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [deadlineDate, setDeadlineDate] = useState<string>("");
  const [deadlineTime, setDeadlineTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Validate form inputs
   */
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Title validation
    if (!title.trim()) {
      errors.push("Title is required");
    } else if (title.trim().length < 3) {
      errors.push("Title must be at least 3 characters long");
    }

    // Date validation
    if (!deadlineDate) {
      errors.push("Deadline date is required");
    } else {
      // Check if date is in the past
      const [year, month, day] = deadlineDate.split("-").map(Number);
      const selectedDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day

      if (selectedDate < today) {
        errors.push("Deadline date cannot be in the past");
      }
    }

    // Time validation
    if (!deadlineTime) {
      errors.push("Deadline time is required");
    } else {
      // If date is today, check if time is in the past
      if (deadlineDate) {
        const [year, month, day] = deadlineDate.split("-").map(Number);
        const [hour, minute] = deadlineTime.split(":").map(Number);
        const selectedDateTime = new Date(year, month - 1, day, hour, minute);
        const now = new Date();

        if (selectedDateTime <= now) {
          errors.push("Deadline time cannot be in the past");
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Handle goal creation
   */
  const handleCreateGoal = async () => {
    const validation = validateForm();

    if (!validation.isValid) {
      Alert.alert("Validation Error", validation.errors.join("\n"), [
        { text: "OK" },
      ]);
      return;
    }

    setIsLoading(true);

    try {
      // Create new goal object
      const newGoal: Goal = {
        id: GoalStorage.generateId(),
        title: title.trim(),
        description: description.trim() || undefined,
        deadlineDate,
        deadlineTime,
        createdAt: new Date().toISOString(),
      };

      // Save to storage
      const success = await GoalStorage.saveGoal(newGoal);

      if (success) {
        Alert.alert("Success", "Goal created successfully!", [
          {
            text: "OK",
            onPress: () => {
              // Reset form
              setTitle("");
              setDescription("");
              setDeadlineDate("");
              setDeadlineTime("");

              // Navigate back or call callback
              if (onGoalCreated) {
                onGoalCreated(newGoal);
              }
              if (navigation) {
                navigation.goBack();
              }
            },
          },
        ]);
      } else {
        Alert.alert("Error", "Failed to save goal. Please try again.", [
          { text: "OK" },
        ]);
      }
    } catch (error) {
      console.error("Error creating goal:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    if (title.trim() || description.trim() || deadlineDate || deadlineTime) {
      Alert.alert(
        "Discard Changes",
        "Are you sure you want to discard your changes?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              setTitle("");
              setDescription("");
              setDeadlineDate("");
              setDeadlineTime("");
              if (navigation) {
                navigation.goBack();
              }
            },
          },
        ]
      );
    } else {
      if (navigation) {
        navigation.goBack();
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create New Goal</Text>
          <Text style={styles.subtitle}>
            Set a goal and track your progress with a countdown timer
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal Title *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter your goal title"
              placeholderTextColor="#999"
              maxLength={100}
            />
            <Text style={styles.characterCount}>
              {title.length}/100 characters
            </Text>
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your goal in detail"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {description.length}/500 characters
            </Text>
          </View>

          {/* Date Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Deadline Date *</Text>
            <DatePicker
              selectedDate={deadlineDate}
              onDateChange={setDeadlineDate}
              placeholder="Select deadline date"
            />
          </View>

          {/* Time Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Deadline Time *</Text>
            <TimePicker
              selectedTime={deadlineTime}
              onTimeChange={setDeadlineTime}
              placeholder="Select deadline time"
            />
          </View>

          {/* Preview */}
          {deadlineDate && deadlineTime && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Preview</Text>
              <Text style={styles.previewText}>
                Deadline:{" "}
                {new Date(`${deadlineDate}T${deadlineTime}`).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.createButton,
              isLoading && styles.createButtonDisabled,
            ]}
            onPress={handleCreateGoal}
            disabled={isLoading}
          >
            <Text style={styles.createButtonText}>
              {isLoading ? "Creating..." : "Create Goal"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "white",
    color: "#333",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  previewContainer: {
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: "#1976D2",
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "white",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  createButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#CCC",
  },
  createButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
});
