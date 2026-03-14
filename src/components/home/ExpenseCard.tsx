import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Expense } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

export const ExpenseCard = ({ expense, onEdit, onDelete }: ExpenseCardProps) => {
  const appear = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(appear, {
      toValue: 1,
      useNativeDriver: true,
      stiffness: 130,
      damping: 14,
    }).start();
  }, [appear]);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.98,
      useNativeDriver: true,
      stiffness: 220,
      damping: 16,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      stiffness: 220,
      damping: 16,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: appear,
        transform: [
          {
            translateY: appear.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
          { scale: pressScale },
        ],
      }}
    >
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.category}>{expense.category}</Text>
                <Text style={styles.date}>{formatDate(expense.date)}</Text>
                {expense.notes ? <Text style={styles.notes}>{expense.notes}</Text> : null}
              </View>
              <Text style={styles.amount}>{formatCurrency(expense.amount, expense.currency)}</Text>
            </View>
          </Card.Content>
          {onEdit && onDelete ? (
            <Card.Actions style={styles.actions}>
              <Pressable style={styles.editPill} onPress={() => onEdit(expense)}>
                <MaterialCommunityIcons name="pencil-outline" size={14} color="#1E293B" />
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
              <Pressable style={styles.deletePill} onPress={() => onDelete(expense)}>
                <MaterialCommunityIcons name="trash-can-outline" size={14} color="#DC2626" />
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </Card.Actions>
          ) : null}
        </Card>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#334155',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: 10,
  },
  category: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  date: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  notes: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    fontStyle: 'italic',
  },
  amount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#7C3AED',
  },
  actions: {
    justifyContent: 'flex-end',
    paddingTop: 0,
    gap: 8,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    gap: 4,
  },
  deletePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    gap: 4,
  },
  editText: {
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 12,
  },
  deleteText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 12,
  },
});
