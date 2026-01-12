import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { COLORS } from '../../types';

interface CurrencyInputProps extends TextInputProps {
  value: string;
  onChangeValue: (text: string) => void;
}

export default function CurrencyInput({ value, onChangeValue, style, ...props }: CurrencyInputProps) {
  
  // ຟັງຊັນຈັດ Format ຕົວເລກ (ໃສ່ຈຸດ)
  const formatNumber = (num: string) => {
    return num.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleChangeText = (text: string) => {
    // ລຶບຈຸດອອກກ່ອນສົ່ງຄ່າກັບໄປ
    const rawValue = text.replace(/,/g, '');
    onChangeValue(rawValue);
  };

  return (
    <TextInput
      {...props}
      style={[styles.input, style]}
      value={formatNumber(value)}
      onChangeText={handleChangeText}
      keyboardType="numeric"
      selectTextOnFocus={true} // 🟢 ກົດແລ້ວພິມທັບໄດ້ເລີຍ (iOS/Android)
    />
  );
}

const styles = StyleSheet.create({
  input: {
    fontFamily: 'Lao-Bold',
    fontSize: 16,
    color: COLORS.text,
  },
});