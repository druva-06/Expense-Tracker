import React from 'react';
import { StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SettingsSectionCardProps {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  children: React.ReactNode;
}

export const SettingsSectionCard = ({ title, icon, children }: SettingsSectionCardProps) => {
  return (
    <Card style={styles.card}>
      <Card.Title
        title={title}
        titleStyle={styles.title}
        left={props => <MaterialCommunityIcons {...props} name={icon} size={20} color="#7C3AED" />}
      />
      <Card.Content>{children}</Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#334155',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: {
    fontWeight: '700',
    color: '#0F172A',
  },
});
