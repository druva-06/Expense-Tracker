import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/database';
import { formatCurrency, formatDate, getMonthStart, getMonthEnd } from '../utils/helpers';

export const HomeScreen = () => {
  const { userId, expenses, refreshExpenses } = useApp();
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ category: string; total: number }[]>([]);

  useEffect(() => {
    loadMonthlyData();
  }, [userId, expenses]);

  const loadMonthlyData = async () => {
    try {
      const fromDate = getMonthStart();
      const toDate = getMonthEnd();

      const monthExpenses = await db.getExpenses(userId, { from_date: fromDate, to_date: toDate });
      const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      setMonthlyTotal(total);

      const breakdown = await db.getTotalByCategory(userId, fromDate, toDate);
      setCategoryBreakdown(breakdown);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    }
  };

  const renderExpenseItem = ({ item }: any) => (
    <Card style={styles.expenseCard}>
      <Card.Content>
        <View style={styles.expenseRow}>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseCategory}>{item.category}</Text>
            <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
            {item.notes && <Text style={styles.expenseNotes}>{item.notes}</Text>}
          </View>
          <Text style={styles.expenseAmount}>{formatCurrency(item.amount, item.currency)}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>This Month</Text>
        <Text style={styles.monthlyTotal}>{formatCurrency(monthlyTotal)}</Text>
      </View>

      {categoryBreakdown.length > 0 && (
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          {categoryBreakdown.slice(0, 3).map((item, index) => (
            <View key={index} style={styles.categoryRow}>
              <Text style={styles.categoryName}>{item.category}</Text>
              <Text style={styles.categoryAmount}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        <FlatList
          data={expenses}
          renderItem={renderExpenseItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.expenseList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No expenses yet. Start by adding one in the Chat tab!</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 24,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  monthlyTotal: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  categorySection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  recentSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  expenseList: {
    paddingBottom: 16,
  },
  expenseCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  expenseDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  expenseNotes: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 24,
    fontSize: 16,
  },
});
