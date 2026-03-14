import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { formatCurrency } from '../../utils/helpers';

interface CategoryBreakdownCardProps {
  items: { category: string; total: number }[];
}

export const CategoryBreakdownCard = ({ items }: CategoryBreakdownCardProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>Top Categories</Text>
        {items.slice(0, 3).map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.categoryName}>{item.category}</Text>
            <Text style={styles.categoryAmount}>{formatCurrency(item.total)}</Text>
          </View>
        ))}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#334155',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#0F172A',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  categoryName: {
    fontSize: 15,
    color: '#334155',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7C3AED',
  },
});
