import { StyleSheet, TextInput, TextInputProps } from 'react-native';

export const Input = ({ style, ...rest }: TextInputProps) => {
  return <TextInput {...rest} style={[styles.input, style]} />;
};

const styles = StyleSheet.create({
  input: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    width: '100%',
  },
});
