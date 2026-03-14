import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SummaryHeaderProps {
  periodLabel: string;
  totalAmount: string;
}

export const SummaryHeader = ({ periodLabel, totalAmount }: SummaryHeaderProps) => {
  return (
    <View style={styles.header}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      <Text style={styles.headerTitle}>{periodLabel}</Text>
      <View style={styles.row}>
        <View>
          <Text style={styles.headerSubtitle}>Total Spend</Text>
          <Text style={styles.totalAmount}>{totalAmount}</Text>
        </View>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="wallet-outline" size={24} color="#DDD6FE" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#6D28D9',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 18,
    overflow: 'hidden',
    shadowColor: '#4C1D95',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  glowTop: {
    position: 'absolute',
    right: -24,
    top: -28,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#8B5CF6',
    opacity: 0.4,
  },
  glowBottom: {
    position: 'absolute',
    left: -20,
    bottom: -36,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#A78BFA',
    opacity: 0.25,
  },
  headerTitle: {
    color: '#E0E7FF',
    fontSize: 14,
    fontWeight: '700',
  },
  row: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSubtitle: {
    color: '#DDD6FE',
    fontSize: 12,
  },
  totalAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    marginTop: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
