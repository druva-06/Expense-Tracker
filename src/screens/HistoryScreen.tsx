import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, LayoutAnimation, Platform, Pressable, StyleSheet, UIManager, View } from 'react-native';
import { Button, Chip, IconButton, Searchbar, Snackbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { db } from '../services/database';
import { useApp } from '../contexts/AppContext';
import { Expense } from '../types';
import { ExpenseCard } from '../components/home/ExpenseCard';
import { ExpenseEditModal } from '../components/shared/ExpenseEditModal';
import { formatCurrency, getMonthStart } from '../utils/helpers';
import { DatePickerField } from '../components/shared/DatePickerField';

export const HistoryScreen = () => {
  const navigation = useNavigation<any>();
  const { userId, expenses, refreshExpenses, lastDeletedExpense, setLastDeletedExpense } = useApp();
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [searchText, setSearchText] = useState('');
  const [scope, setScope] = useState<'all' | 'month' | 'year'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showUndo, setShowUndo] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    loadExpenses();
  }, [userId, expenses]);

  const loadExpenses = async () => {
    if (!userId) return;
    const list = await db.getExpenses(userId);
    setAllExpenses(list);
  };

  const dateScopedExpenses = allExpenses.filter(item => {
    if (scope === 'all') return true;
    if (scope === 'month') {
      return item.date >= getMonthStart();
    }
    const currentYear = new Date().getFullYear();
    return item.date.startsWith(`${currentYear}-`);
  });

  const rangeFilteredExpenses = dateScopedExpenses.filter(item => {
    if (appliedStartDate && item.date < appliedStartDate) {
      return false;
    }
    if (appliedEndDate && item.date > appliedEndDate) {
      return false;
    }
    return true;
  });

  const filteredExpenses = rangeFilteredExpenses.filter(item => {
    const query = searchText.trim().toLowerCase();
    if (!query) return true;
    return (
      item.category.toLowerCase().includes(query) ||
      (item.notes || '').toLowerCase().includes(query) ||
      item.date.toLowerCase().includes(query) ||
      String(item.amount).includes(query)
    );
  });

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const topCategory = filteredExpenses.reduce<Record<string, number>>((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});
  const topCategoryLabel = Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const groupedByDate = useMemo(() => {
    const grouped = filteredExpenses.reduce<Record<string, Expense[]>>((acc, item) => {
      if (!acc[item.date]) acc[item.date] = [];
      acc[item.date].push(item);
      return acc;
    }, {});
    return Object.entries(grouped).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [filteredExpenses]);

  const handleApplyDateRange = () => {
    const validDate = (value: string) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
    if (!validDate(startDate) || !validDate(endDate)) {
      setSnackbarMessage('Use date format YYYY-MM-DD.');
      setShowUndo(false);
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      setSnackbarMessage('Start date should be before end date.');
      setShowUndo(false);
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAppliedStartDate(startDate.trim());
    setAppliedEndDate(endDate.trim());
  };

  const handleResetDateRange = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStartDate('');
    setEndDate('');
    setAppliedStartDate('');
    setAppliedEndDate('');
  };

  const handleSaveExpenseEdit = async (updates: {
    amount: number;
    category: string;
    date: string;
    notes?: string;
  }) => {
    if (!editingExpense) return;

    const updated = await db.updateExpense(editingExpense.id, userId, updates);
    if (updated) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      await refreshExpenses();
      await loadExpenses();
      setSnackbarMessage('Expense updated.');
      setShowUndo(false);
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    const deleted = await db.deleteExpense(expense.id, userId);
    if (!deleted) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLastDeletedExpense(expense);
    await refreshExpenses();
    await loadExpenses();
    setSnackbarMessage('Expense deleted.');
    setShowUndo(true);
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedExpense) return;

    await db.addExpense({
      user_id: lastDeletedExpense.user_id,
      amount: lastDeletedExpense.amount,
      currency: lastDeletedExpense.currency,
      category: lastDeletedExpense.category,
      payment_method: lastDeletedExpense.payment_method,
      date: lastDeletedExpense.date,
      notes: lastDeletedExpense.notes,
    });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await refreshExpenses();
    await loadExpenses();
    setSnackbarMessage('Delete undone.');
    setShowUndo(false);
    setLastDeletedExpense(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.bgOrbOne} />
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>Search, review, and manage expenses beautifully.</Text>
        </View>
        <IconButton icon="cog-outline" onPress={() => navigation.navigate('Settings')} />
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={styles.summaryValue}>{filteredExpenses.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Top</Text>
          <Text style={styles.summaryValue}>{topCategoryLabel}</Text>
        </View>
      </View>

      <View style={styles.scopeRow}>
        <Chip selected={scope === 'all'} onPress={() => setScope('all')} style={styles.scopeChip}>
          All
        </Chip>
        <Chip selected={scope === 'month'} onPress={() => setScope('month')} style={styles.scopeChip}>
          This Month
        </Chip>
        <Chip selected={scope === 'year'} onPress={() => setScope('year')} style={styles.scopeChip}>
          This Year
        </Chip>
      </View>

      <View style={styles.dateFilterCard}>
        <Text style={styles.dateFilterTitle}>Date Range</Text>
        <View style={styles.dateInputRow}>
          <View style={styles.dateInput}>
            <DatePickerField
              label="Start date"
              value={startDate}
              onChange={setStartDate}
              maximumDate={endDate ? new Date(endDate) : undefined}
            />
          </View>
          <View style={styles.dateInput}>
            <DatePickerField
              label="End date"
              value={endDate}
              onChange={setEndDate}
              minimumDate={startDate ? new Date(startDate) : undefined}
            />
          </View>
        </View>
        <View style={styles.dateActionRow}>
          <Button mode="outlined" onPress={handleResetDateRange}>
            Reset
          </Button>
          <Button mode="contained" onPress={handleApplyDateRange}>
            Apply
          </Button>
        </View>
      </View>

      <Searchbar
        placeholder="Search transactions..."
        value={searchText}
        onChangeText={setSearchText}
        style={styles.search}
      />

      <FlatList
        data={groupedByDate}
        renderItem={({ item }) => {
          const [date, expensesForDate] = item;
          const isExpanded = expandedDates[date] ?? false;
          const dailyTotal = expensesForDate.reduce((sum, expense) => sum + expense.amount, 0);

          return (
            <View style={styles.groupCard}>
              <Pressable
                style={styles.groupHeader}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setExpandedDates(prev => ({ ...prev, [date]: !isExpanded }));
                }}
              >
                <View>
                  <Text style={styles.groupDate}>{date}</Text>
                  <Text style={styles.groupMeta}>
                    {expensesForDate.length} expense{expensesForDate.length > 1 ? 's' : ''} • {formatCurrency(dailyTotal)}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={isExpanded ? 'chevron-up-circle-outline' : 'chevron-down-circle-outline'}
                  size={24}
                  color="#6D28D9"
                />
              </Pressable>

              {isExpanded ? (
                <View style={styles.groupContent}>
                  {expensesForDate.map(expense => (
                    <ExpenseCard
                      key={expense.id}
                      expense={expense}
                      onEdit={setEditingExpense}
                      onDelete={handleDeleteExpense}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          );
        }}
        keyExtractor={item => item[0]}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No expenses found.</Text>}
      />

      <ExpenseEditModal
        visible={Boolean(editingExpense)}
        expense={editingExpense}
        onDismiss={() => setEditingExpense(null)}
        onSave={handleSaveExpenseEdit}
      />

      <Snackbar
        visible={Boolean(snackbarMessage)}
        onDismiss={() => setSnackbarMessage('')}
        duration={2500}
        action={showUndo ? { label: 'Undo', onPress: handleUndoDelete } : undefined}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  bgOrbOne: {
    position: 'absolute',
    top: -70,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#DDD6FE',
    opacity: 0.65,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    marginTop: 4,
    color: '#5B5F77',
    fontSize: 13,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1E1B4B',
    fontWeight: '800',
  },
  scopeRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  scopeChip: {
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  dateFilterCard: {
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
  dateFilterTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInput: {
    flex: 1,
  },
  dateActionRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  search: {
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 8,
    borderRadius: 14,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  groupDate: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  groupMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  groupContent: {
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  emptyText: {
    marginTop: 24,
    textAlign: 'center',
    color: '#64748B',
  },
});
