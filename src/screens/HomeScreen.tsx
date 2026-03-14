import React, { useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, UIManager, View, Platform } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/database';
import { Expense } from '../types';
import { formatCurrency, getDateRangeForPeriod } from '../utils/helpers';
import { SummaryHeader } from '../components/home/SummaryHeader';
import { PeriodFilter } from '../components/home/PeriodFilter';
import { InteractiveDonutCard } from '../components/home/InteractiveDonutCard';

const MONTH_LABELS: Record<number, string> = {
  1: 'Jan',
  2: 'Feb',
  3: 'Mar',
  4: 'Apr',
  5: 'May',
  6: 'Jun',
  7: 'Jul',
  8: 'Aug',
  9: 'Sep',
  10: 'Oct',
  11: 'Nov',
  12: 'Dec',
};

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { userId, expenses } = useApp();
  const now = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(now.getMonth() + 1);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ category: string; total: number }[]>([]);
  const [periodExpenses, setPeriodExpenses] = useState<Expense[]>([]);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    loadFilteredData();
  }, [userId, expenses, selectedYear, selectedMonth]);

  const loadFilteredData = async () => {
    if (!userId) return;
    
    try {
      const { fromDate, toDate } = getDateRangeForPeriod(selectedYear, selectedMonth);

      const periodExpenses = await db.getExpenses(userId, { from_date: fromDate, to_date: toDate });
      setPeriodExpenses(periodExpenses);

      const total = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      setMonthlyTotal(total);

      const breakdown = await db.getTotalByCategory(userId, fromDate, toDate);
      setCategoryBreakdown(breakdown);
      if (selectedCategory && !breakdown.some(item => item.category === selectedCategory)) {
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error('Error loading filtered data:', error);
    }
  };

  const periodLabel = selectedMonth
    ? `${MONTH_LABELS[selectedMonth]} ${selectedYear}`
    : `All ${selectedYear}`;

  const filteredExpenses = useMemo(() => {
    if (!selectedCategory) {
      return periodExpenses;
    }
    return periodExpenses.filter(expense => expense.category === selectedCategory);
  }, [periodExpenses, selectedCategory]);

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFilterExpanded(prev => !prev);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Overview</Text>
        <IconButton icon="cog-outline" onPress={() => navigation.navigate('Settings')} />
      </View>
      <SummaryHeader periodLabel={periodLabel} totalAmount={formatCurrency(monthlyTotal)} />
      <Pressable style={styles.filterToggle} onPress={toggleFilters}>
        <View>
          <Text style={styles.filterToggleLabel}>Period Filter</Text>
          <Text style={styles.filterToggleValue}>{periodLabel}</Text>
        </View>
        <MaterialCommunityIcons
          name={isFilterExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#4C1D95"
        />
      </Pressable>
      {isFilterExpanded ? (
        <PeriodFilter
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onSelectYear={setSelectedYear}
          onSelectMonth={setSelectedMonth}
        />
      ) : null}
      <ScrollView contentContainerStyle={styles.content}>
        <InteractiveDonutCard
          items={categoryBreakdown}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          totalAmount={selectedCategory ? filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0) : monthlyTotal}
        />
        <View style={styles.historyHintCard}>
          <MaterialCommunityIcons name="history" size={18} color="#6D28D9" />
          <Text style={styles.historyHintText}>
            All transactions are available in the History tab.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  topTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    paddingLeft: 6,
  },
  filterToggle: {
    marginTop: 10,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#334155',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterToggleLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  filterToggleValue: {
    marginTop: 4,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '700',
  },
  content: {
    paddingBottom: 120,
  },
  historyHintCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  historyHintText: {
    marginLeft: 8,
    color: '#4C1D95',
    fontWeight: '700',
    fontSize: 13,
  },
});
