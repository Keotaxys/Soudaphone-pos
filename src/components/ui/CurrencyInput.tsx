import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { COLORS } from '../../types';

interface CurrencyInputProps extends TextInputProps {
  value: string;
  onChangeValue: (text: string) => void;
}

export default function CurrencyInput({ value, onChangeValue, style, ...props }: CurrencyInputProps) {
  
  // ຟັງຊັນຈັດ Format ຕົວເລກ (ໃສ່ຈຸດສະແດງຜົນ)
  const formatDisplayValue = (num: string) => {
    if (!num) return '';
    // ລຶບທຸກຢ່າງທີ່ບໍ່ແມ່ນຕົວເລກອອກ
    const cleanNum = num.replace(/[^0-9]/g, '');
    // ໃສ່ຈຸດທຸກ 3 ຫຼັກ
    return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleChangeText = (text: string) => {
    // ເວລາພິມ ໃຫ້ເອົາຈຸດອອກກ່ອນສົ່ງຄ່າກັບໄປ State
    const rawValue = text.replace(/,/g, '');
    
    // ກວດສອບວ່າເປັນຕົວເລກລ້ວນບໍ່ (ປ້ອງກັນການພິມຕົວອັກສອນ)
    if (/^\d*$/.test(rawValue)) {
        onChangeValue(rawValue);
    }
  };

  return (
    <TextInput
      {...props}
      style={[styles.input, style]}
      value={formatDisplayValue(value)} // 🟢 ບັງຄັບໃຫ້ສະແດງຜົນແບບມີຈຸດ
      onChangeText={handleChangeText}
      keyboardType="numeric"
      selectTextOnFocus={true} // ກົດແລ້ວເລືອກທັງໝົດ (ພິມທັບໄດ້ເລີຍ)
    />
  );
}

const styles = StyleSheet.create({
  input: {
    fontFamily: 'Lao-Bold',
    fontSize: 18,
    color: COLORS.text,
  },
});