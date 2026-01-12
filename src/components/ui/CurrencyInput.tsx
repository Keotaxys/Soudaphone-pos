import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { COLORS } from '../../types';

interface CurrencyInputProps extends TextInputProps {
  value: string;
  onChangeValue: (text: string) => void;
}

export default function CurrencyInput({ value, onChangeValue, style, ...props }: CurrencyInputProps) {
  
  // ຟັງຊັນຈັດ Format ຕົວເລກ (ໃສ່ຈຸດ) ສຳລັບສະແດງຜົນເທົ່ານັ້ນ
  const formatDisplayValue = (num: string | undefined | null) => {
    if (!num) return '';
    // 1. ແປງເປັນ String ແລະ ລຶບທຸກຢ່າງທີ່ບໍ່ແມ່ນຕົວເລກອອກ
    const cleanNum = num.toString().replace(/[^0-9]/g, '');
    if (cleanNum === '') return '';
    
    // 2. ໃສ່ຈຸດທຸກ 3 ຫຼັກ
    return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleChangeText = (text: string) => {
    // 1. ເວລາພິມ ໃຫ້ເອົາຈຸດອອກໃຫ້ໝົດກ່ອນ
    const rawValue = text.replace(/[^0-9]/g, '');
    
    // 2. ສົ່ງສະເພາະຕົວເລກດິບໆ ກັບໄປໃຫ້ State ຂອງໜ້າຕ່າງໆ
    onChangeValue(rawValue);
  };

  return (
    <TextInput
      {...props}
      style={[styles.input, style]}
      value={formatDisplayValue(value)} // 🟢 ສະແດງຜົນແບບມີຈຸດ
      onChangeText={handleChangeText}   // 🟢 ຮັບຄ່າ ແລະ ແປງເປັນຕົວເລກ
      keyboardType="number-pad"         // 🟢 ໃຊ້ number-pad ເພື່ອຄວາມສະຖຽນໃນທຸກລຸ້ນ
      autoCorrect={false}               // ປິດການແກ້ຄຳຜິດ
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