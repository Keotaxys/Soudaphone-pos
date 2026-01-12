import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { COLORS } from '../../types';

interface CurrencyInputProps extends TextInputProps {
  value: string;
  onChangeValue: (text: string) => void;
}

export default function CurrencyInput({ value, onChangeValue, style, ...props }: CurrencyInputProps) {
  
  // ຟັງຊັນຈັດ Format ຕົວເລກ (ໃສ່ຈຸດ)
  const formatNumber = (num: string) => {
    if (!num) return '';
    // ລຶບທຸກຢ່າງທີ່ບໍ່ແມ່ນຕົວເລກອອກ
    const cleanNum = num.replace(/\D/g, '');
    // ໃສ່ຈຸດທຸກ 3 ຫຼັກ
    return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleChangeText = (text: string) => {
    // 1. ລຶບຈຸດອອກເພື່ອເອົາຄ່າທີ່ແທ້ຈິງ
    const rawValue = text.replace(/,/g, '');
    
    // 2. ກວດສອບວ່າເປັນຕົວເລກລ້ວນບໍ່ (ປ້ອງກັນການພິມຕົວອັກສອນ)
    if (/^\d*$/.test(rawValue)) {
        onChangeValue(rawValue);
    }
  };

  return (
    <TextInput
      {...props}
      style={[styles.input, style]}
      value={formatNumber(value)} // ສະແດງຜົນແບບມີຈຸດ
      onChangeText={handleChangeText}
      keyboardType="numeric"
      selectTextOnFocus={true} // ກົດແລ້ວພິມທັບໄດ້ເລີຍ
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