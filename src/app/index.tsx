import { Link } from 'expo-router';
import { StyleSheet, Button, Text, View } from 'react-native';

export default function Root() {
  return (
    <View style={styles.container}>
      <Text>The root of the app</Text>
      <Link asChild href="/sign-up">
        <Button title="Sign Up" />
      </Link>
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
