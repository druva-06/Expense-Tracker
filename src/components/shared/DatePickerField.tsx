import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface DatePickerFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (nextDate: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

const formatDateLabel = (value: string) => {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const toDateOnlyString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateOrToday = (value: string): Date => {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const DatePickerField = ({
  label,
  value,
  placeholder = 'Select date',
  onChange,
  minimumDate,
  maximumDate,
}: DatePickerFieldProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const date = useMemo(() => parseDateOrToday(value), [value]);

  const handleChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      onChange(toDateOnlyString(selectedDate));
    }
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.field} onPress={() => setShowPicker(true)}>
        <View style={styles.left}>
          <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#6D28D9" />
          <Text style={value ? styles.valueText : styles.placeholderText}>
            {value ? formatDateLabel(value) : placeholder}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-down" size={18} color="#6B7280" />
      </Pressable>

      {showPicker ? (
        <View style={styles.pickerWrapper}>
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
          {Platform.OS === 'ios' ? (
            <View style={styles.iosActions}>
              <Button onPress={() => setShowPicker(false)}>Done</Button>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 6,
  },
  field: {
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    backgroundColor: '#FAFAFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    marginLeft: 8,
    color: '#0F172A',
    fontWeight: '600',
  },
  placeholderText: {
    marginLeft: 8,
    color: '#94A3B8',
  },
  pickerWrapper: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  iosActions: {
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
});

