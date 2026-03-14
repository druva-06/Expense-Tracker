import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { Expense } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface ExpenseConfirmationCardProps {
  expense: Partial<Expense>;
  onEdit: () => void;
  onDelete: () => void;
}

export const ExpenseConfirmationCard = ({ expense, onEdit, onDelete }: ExpenseConfirmationCardProps) => {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Expense Added Successfully</Text>
          <Text style={styles.amount}>{formatCurrency(expense.amount || 0, expense.currency)}</Text>
          <Text style={styles.category}>{expense.category}</Text>
          <Text style={styles.date}>{formatDate(expense.date || '')}</Text>
          {expense.notes ? <Text style={styles.notes}>{expense.notes}</Text> : null}
        </Card.Content>
        <Card.Actions style={styles.actions}>
          <Button mode="outlined" onPress={onEdit}>
            Edit
          </Button>
          <Button mode="outlined" textColor="#DC2626" onPress={onDelete}>
            Delete
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  card: {
    maxWidth: '82%',
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#334155',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: {
    fontSize: 11,
    color: '#0EA5E9',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amount: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  category: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '600',
    color: '#7C3AED',
  },
  date: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 13,
  },
  notes: {
    marginTop: 6,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  actions: {
    justifyContent: 'flex-end',
    gap: 8,
  },
});
