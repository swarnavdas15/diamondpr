import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../theme';

export interface PhoneInputProps extends TextInputProps {}

export const PhoneInput: React.FC<PhoneInputProps> = (props) => {
  return (
    <TextInput
      {...props}
      style={[styles.input, props.style]}
      keyboardType="phone-pad"
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: Radius.sm || 4,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});
