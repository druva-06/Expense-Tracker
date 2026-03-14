import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
  isTyping?: boolean;
}

export const ChatBubble = ({ role, content, timestamp, isTyping = false }: ChatBubbleProps) => {
  const isUser = role === 'user';
  const show = useRef(new Animated.Value(0)).current;
  const typingDots = useRef([
    new Animated.Value(0.35),
    new Animated.Value(0.35),
    new Animated.Value(0.35),
  ]).current;
  const typingAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const timeLabel = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  useEffect(() => {
    Animated.timing(show, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [show]);

  useEffect(() => {
    if (!isTyping) {
      typingAnimationRef.current?.stop();
      typingDots.forEach(dot => dot.setValue(0.35));
      return;
    }

    const pulseDot = (dot: Animated.Value) =>
      Animated.sequence([
        Animated.timing(dot, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(dot, {
          toValue: 0.35,
          duration: 320,
          useNativeDriver: true,
        }),
      ]);

    typingAnimationRef.current = Animated.loop(
      Animated.stagger(130, typingDots.map(dot => pulseDot(dot)))
    );
    typingAnimationRef.current.start();

    return () => {
      typingAnimationRef.current?.stop();
    };
  }, [isTyping, typingDots]);

  return (
    <Animated.View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
        {
          opacity: show,
          transform: [
            {
              translateY: show.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        },
      ]}
    >
      {!isUser ? <Text style={styles.senderLabel}>Expense Assistant</Text> : null}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {isTyping ? (
          <View>
            <Text style={styles.typingCaption}>Assistant is typing</Text>
            <View style={styles.typingDotsRow}>
              {typingDots.map((dot, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.typingDot,
                    {
                      opacity: dot,
                      transform: [
                        {
                          scale: dot.interpolate({
                            inputRange: [0.35, 1],
                            outputRange: [0.9, 1.15],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        ) : (
          <Text style={isUser ? styles.userText : styles.assistantText}>{content}</Text>
        )}
      </View>
      {timeLabel ? <Text style={styles.timeLabel}>{timeLabel}</Text> : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: '78%',
  },
  senderLabel: {
    fontSize: 11,
    color: '#5B21B6',
    fontWeight: '700',
    marginBottom: 4,
    marginLeft: 4,
  },
  userBubble: {
    backgroundColor: '#6D28D9',
    shadowColor: '#5B21B6',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    shadowColor: '#475569',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  assistantText: {
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  typingCaption: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  typingDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7C3AED',
    marginRight: 6,
  },
  timeLabel: {
    fontSize: 10,
    color: '#7C7F96',
    marginTop: 3,
    marginHorizontal: 4,
  },
});
