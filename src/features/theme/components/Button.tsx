import { useMemo } from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

interface Props extends PressableProps {
  text: string;
  style?: StyleProp<ViewStyle>;
}

export const Button = ({ text, style, ...rest }: Props) => {
  const composedStyles = useMemo(() => {
    return style ? [styles.pressable, style] : styles.pressable;
  }, [style]);
  return (
    <Pressable {...rest} android_ripple={{}} style={composedStyles}>
      <Text style={styles.text}>{text}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 4,
    width: '100%',
  },
  text: {
    textAlign: 'center',
  },
});
