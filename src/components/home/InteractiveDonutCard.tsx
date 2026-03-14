import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import Svg, { Circle, G } from 'react-native-svg';
import { formatCurrency } from '../../utils/helpers';

interface DonutItem {
  category: string;
  total: number;
}

interface InteractiveDonutCardProps {
  items: DonutItem[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  totalAmount: number;
}

const CHART_COLORS = ['#7C3AED', '#06B6D4', '#F59E0B', '#10B981', '#EC4899', '#6366F1', '#F97316'];

export const InteractiveDonutCard = ({
  items,
  selectedCategory,
  onSelectCategory,
  totalAmount,
}: InteractiveDonutCardProps) => {
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [appear, items.length, selectedCategory]);

  const chartData = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.total, 0);
    if (total <= 0) {
      return [];
    }

    return items.map((item, index) => ({
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
      ratio: item.total / total,
      percent: ((item.total / total) * 100).toFixed(1),
    }));
  }, [items]);

  if (chartData.length === 0) {
    return null;
  }

  const size = 210;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offsetCursor = 0;

  return (
    <Animated.View
      style={{
        opacity: appear,
        transform: [
          {
            translateY: appear.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 0],
            }),
          },
        ],
      }}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Spending Breakdown</Text>
          <Text style={styles.subtitle}>Tap a segment to filter expenses by category</Text>

          <View style={styles.chartWrapper}>
            <Svg width={size} height={size}>
              <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#E2E8F0"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {chartData.map(item => {
                  const segmentLength = circumference * item.ratio;
                  const circle = (
                    <Circle
                      key={item.category}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke={item.color}
                      strokeWidth={selectedCategory === item.category ? strokeWidth + 3 : strokeWidth}
                      strokeDasharray={`${segmentLength} ${circumference}`}
                      strokeDashoffset={-offsetCursor}
                      strokeLinecap="butt"
                      fill="none"
                      onPress={() => onSelectCategory(selectedCategory === item.category ? null : item.category)}
                    />
                  );
                  offsetCursor += segmentLength;
                  return circle;
                })}
              </G>
            </Svg>
            <View style={styles.centerLabel}>
              <Text style={styles.centerTitle}>{selectedCategory || 'All'}</Text>
              <Text style={styles.centerValue}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>

          <View style={styles.legend}>
            {chartData.slice(0, 5).map(item => (
              <Pressable
                key={item.category}
                onPress={() => onSelectCategory(selectedCategory === item.category ? null : item.category)}
                style={[styles.legendRow, selectedCategory === item.category && styles.legendRowActive]}
              >
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendCategory}>{item.category}</Text>
                <Text style={styles.legendValue}>{item.percent}%</Text>
              </Pressable>
            ))}
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
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
    shadowOpacity: 0.09,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  chartWrapper: {
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabel: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  centerValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  legend: {
    marginTop: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  legendRowActive: {
    backgroundColor: '#EDE9FE',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendCategory: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
});

