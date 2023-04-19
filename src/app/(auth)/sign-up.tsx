import { Button, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../../auth/useSession';

export default function SignUp() {
  const session = useSession();
  return (
    <View style={styles.container}>
      <Text>Sign Up</Text>
      <Button
        title="Home"
        onPress={() => {
          if (session.status === 'inactive') {
            session.logIn({ id: 456, first: 'John', last: 'Doe' });
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
