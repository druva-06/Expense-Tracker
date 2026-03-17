import React, { useEffect, useRef } from 'react';
import { Animated, LayoutAnimation, ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

interface QuickPromptRowProps {
  prompts: string[];
  maxPrompts: number;
  onSelectPrompt: (prompt: string) => void;
  onAddPrompt: () => Promise<void>;
  onRemovePrompt: (prompt: string) => Promise<void>;
  isSaving: boolean;
}

export const QuickPromptRow = ({
  prompts,
  maxPrompts,
  onSelectPrompt,
  onAddPrompt,
  onRemovePrompt,
  isSaving,
}: QuickPromptRowProps) => {
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

  const canAddPrompt = prompts.length < maxPrompts;

  return (
    <Animated.View
      style={[styles.wrapper, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [8, 0],
      }) }] }]}
    >
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>Try quick prompts</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
        {prompts.map(prompt => (
          <Chip
            key={prompt}
            mode="outlined"
            style={styles.chip}
            textStyle={styles.chipText}
            onPress={() => onSelectPrompt(prompt)}
            onClose={() => onRemovePrompt(prompt)}
            closeIcon="close-circle"
            disabled={isSaving}
          >
            {prompt}
          </Chip>
        ))}
        {canAddPrompt && (
          <Chip
            icon="plus"
            mode="outlined"
            style={styles.addChip}
            onPress={onAddPrompt}
            disabled={isSaving}
          >
            Add
          </Chip>
        )}
      </ScrollView>
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
  content: {
    paddingHorizontal: 16,
    paddingRight: 20,
  },
  chip: {
    marginRight: 8,
    backgroundColor: '#F8FAFC',
    borderColor: '#C4B5FD',
    borderRadius: 14,
    paddingRight: 2,
  },
  chipText: {
    color: '#312E81',
  },
  addChip: {
    marginRight: 8,
    backgroundColor: '#EDE9FE',
    borderColor: '#A78BFA',
    borderStyle: 'dashed',
    borderRadius: 14,
  },
});
