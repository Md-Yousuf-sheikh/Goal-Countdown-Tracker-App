import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';

interface DatePickerProps {
  selectedDate: string; // YYYY-MM-DD format
  onDateChange: (date: string) => void;
  placeholder?: string;
}

interface DateOption {
  value: number;
  label: string;
}

/**
 * Custom DatePicker component built from scratch
 * Uses dropdown-style pickers for day, month, and year selection
 * No third-party date libraries - all logic implemented manually
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateChange,
  placeholder = 'Select Date',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Parse the selected date when component mounts or date changes
  useEffect(() => {
    if (selectedDate) {
      const [year, month, day] = selectedDate.split('-').map(Number);
      setSelectedYear(year);
      setSelectedMonth(month);
      setSelectedDay(day);
    } else {
      // Set default to today
      const today = new Date();
      setSelectedYear(today.getFullYear());
      setSelectedMonth(today.getMonth() + 1);
      setSelectedDay(today.getDate());
    }
  }, [selectedDate]);

  // Generate array of days based on selected month and year
  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month, 0).getDate();
  };

  // Generate options for days (1 to max days in month)
  const generateDayOptions = (): DateOption[] => {
    const maxDays = getDaysInMonth(selectedMonth, selectedYear);
    return Array.from({ length: maxDays }, (_, i) => ({
      value: i + 1,
      label: (i + 1).toString().padStart(2, '0'),
    }));
  };

  // Generate options for months (1 to 12)
  const generateMonthOptions = (): DateOption[] => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months.map((month, index) => ({
      value: index + 1,
      label: month,
    }));
  };

  // Generate options for years (current year to 10 years ahead)
  const generateYearOptions = (): DateOption[] => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => ({
      value: currentYear + i,
      label: (currentYear + i).toString(),
    }));
  };

  // Handle date selection and validation
  const handleDateSelect = () => {
    const maxDays = getDaysInMonth(selectedMonth, selectedYear);
    const validDay = Math.min(selectedDay, maxDays);
    
    const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${validDay.toString().padStart(2, '0')}`;
    onDateChange(formattedDate);
    setIsVisible(false);
  };

  // Format display text
  const getDisplayText = (): string => {
    if (!selectedDate) return placeholder;
    
    const [year, month, day] = selectedDate.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    return `${day} ${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Render picker wheel for a specific option type
  const renderPickerWheel = (
    options: DateOption[],
    selectedValue: number,
    onValueChange: (value: number) => void,
    width: number
  ) => {
    const itemHeight = 50;
    const visibleItems = 3;
    const totalHeight = itemHeight * visibleItems;

    return (
      <ScrollView
        style={[styles.pickerWheel, { width, height: totalHeight }]}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingTop: itemHeight,
          paddingBottom: itemHeight,
        }}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pickerItem,
              {
                height: itemHeight,
                backgroundColor: selectedValue === option.value ? '#007AFF' : 'transparent',
              },
            ]}
            onPress={() => onValueChange(option.value)}
          >
            <Text
              style={[
                styles.pickerItemText,
                {
                  color: selectedValue === option.value ? 'white' : '#333',
                  fontWeight: selectedValue === option.value ? 'bold' : 'normal',
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.dateButtonText}>{getDisplayText()}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              {renderPickerWheel(
                generateDayOptions(),
                selectedDay,
                setSelectedDay,
                Dimensions.get('window').width / 3
              )}
              {renderPickerWheel(
                generateMonthOptions(),
                selectedMonth,
                setSelectedMonth,
                Dimensions.get('window').width / 3
              )}
              {renderPickerWheel(
                generateYearOptions(),
                selectedYear,
                setSelectedYear,
                Dimensions.get('window').width / 3
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleDateSelect}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  arrow: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  pickerWheel: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
  },
  pickerItem: {
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemText: {
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});
