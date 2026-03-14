import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

interface UndoDeleteCardProps {
  message: string;
  onUndo: () => void;
}

export const UndoDeleteCard = ({ message, onUndo }: UndoDeleteCardProps) => {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.message}>{message}</Text>
        </Card.Content>
        <Card.Actions>
          <Button onPress={onUndo}>Undo</Button>
        </Card.Actions>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  card: {
    maxWidth: '82%',
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  message: {
    color: '#92400E',
    fontWeight: '600',
  },
});
