import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { Expense, FIXED_CATEGORIES } from '../../types';
import { DatePickerField } from './DatePickerField';

interface ExpenseEditModalProps {
  visible: boolean;
  expense: Expense | null;
  onDismiss: () => void;
  onSave: (updates: { amount: number; category: string; date: string; notes?: string }) => Promise<void>;
}

export const ExpenseEditModal = ({ visible, expense, onDismiss, onSave }: ExpenseEditModalProps) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Miscellaneous');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    if (!expense) {
      return;
    }

    setAmount(String(expense.amount));
    setCategory(expense.category);
    setDate(expense.date);
    setNotes(expense.notes || '');
    setErrorText('');
  }, [expense]);

  const canSave = useMemo(() => Boolean(amount.trim() && date.trim() && category.trim()), [amount, date, category]);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);

    if (!canSave || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || !validDate) {
      setErrorText('Enter a valid amount and date (YYYY-MM-DD).');
      return;
    }

    setErrorText('');
    setSaving(true);
    try {
      await onSave({
        amount: parsedAmount,
        category,
        date,
        notes: notes.trim() || undefined,
      });
      onDismiss();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        <Text style={styles.title}>Edit Expense</Text>

        <TextInput
          mode="outlined"
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          style={styles.input}
        />

        <DatePickerField label="Date" value={date} onChange={setDate} />

        <Text style={styles.categoryLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {FIXED_CATEGORIES.map(item => (
            <Chip
              key={item}
              selected={category === item}
              onPress={() => setCategory(item)}
              style={styles.chip}
            >
              {item}
            </Chip>
          ))}
        </ScrollView>

        <TextInput
          mode="outlined"
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          multiline
          style={styles.input}
        />

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

        <View style={styles.actions}>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button mode="contained" onPress={handleSave} disabled={!canSave} loading={saving}>
            Save
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 18,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
    color: '#111827',
  },
  input: {
    marginBottom: 12,
  },
  categoryLabel: {
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  chips: {
    paddingBottom: 6,
  },
  chip: {
    marginRight: 8,
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
});
