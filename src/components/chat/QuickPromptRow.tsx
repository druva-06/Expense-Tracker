import React, { useEffect, useRef } from 'react';
import { Animated, LayoutAnimation, ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

interface QuickPromptRowProps {
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
  onCustomize: () => void;
}

export const QuickPromptRow = ({ prompts, onSelectPrompt, onCustomize }: QuickPromptRowProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(fadeAnim, {
      toValue: 1,
      speed: 16,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  }, [prompts]);

  return (
    <Animated.View
      style={[styles.wrapper, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [8, 0],
      }) }] }]}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>Try quick prompts</Text>
        <Text style={styles.customizeLink} onPress={onCustomize}>
          Customize
        </Text>
      </View>
      {prompts.length === 0 ? (
        <Text style={styles.emptyText}>No prompts yet. Tap Customize to add up to 3 prompts.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
          {prompts.map(prompt => (
            <Chip key={prompt} mode="outlined" style={styles.chip} onPress={() => onSelectPrompt(prompt)}>
              {prompt}
            </Chip>
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 6,
    paddingBottom: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4C1D95',
  },
  titleRow: {
    paddingHorizontal: 16,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customizeLink: {
    color: '#6D28D9',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingRight: 20,
  },
  chip: {
    marginRight: 8,
    backgroundColor: '#F8FAFC',
    borderColor: '#C4B5FD',
    borderRadius: 14,
  },
  emptyText: {
    paddingHorizontal: 16,
    color: '#6B7280',
    fontSize: 12,
  },
});
