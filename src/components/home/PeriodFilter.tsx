import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

const MONTH_OPTIONS = [
  { value: null, label: 'All' },
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
];

interface PeriodFilterProps {
  selectedYear: number;
  selectedMonth: number | null;
  onSelectYear: (nextYear: number) => void;
  onSelectMonth: (month: number | null) => void;
}

export const PeriodFilter = ({
  selectedYear,
  selectedMonth,
  onSelectYear,
  onSelectMonth,
}: PeriodFilterProps) => {
  return (
    <View style={styles.filterSection}>
      <View style={styles.yearFilterRow}>
        <Button mode="outlined" onPress={() => onSelectYear(selectedYear - 1)}>
          Prev Year
        </Button>
        <Text style={styles.yearText}>{selectedYear}</Text>
        <Button mode="outlined" onPress={() => onSelectYear(selectedYear + 1)}>
          Next Year
        </Button>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthChips}>
        {MONTH_OPTIONS.map(option => (
          <Button
            key={option.label}
            mode={selectedMonth === option.value ? 'contained' : 'outlined'}
            onPress={() => onSelectMonth(option.value)}
            style={styles.monthChip}
            compact
          >
            {option.label}
          </Button>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  filterSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#334155',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  yearFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yearText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  monthChips: {
    paddingTop: 12,
    paddingRight: 8,
  },
  monthChip: {
    marginRight: 8,
  },
});
