import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

const QUICK_PROMPTS = [
  'Spent 250 on coffee',
  'Show expenses for this month',
  'Show expenses for March 2026',
];

interface QuickPromptRowProps {
  onSelectPrompt: (prompt: string) => void;
}

export const QuickPromptRow = ({ onSelectPrompt }: QuickPromptRowProps) => {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Try quick prompts</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
        {QUICK_PROMPTS.map(prompt => (
          <Chip key={prompt} mode="outlined" style={styles.chip} onPress={() => onSelectPrompt(prompt)}>
            {prompt}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 6,
    paddingBottom: 10,
  },
  title: {
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '700',
    color: '#4C1D95',
    marginBottom: 6,
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
});
