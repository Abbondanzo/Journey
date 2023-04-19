import { Button, StyleSheet, Text, View } from 'react-native';
import { useActiveSession } from '../../auth/useActiveSession';

export default function Home() {
  const session = useActiveSession();
  return (
    <View style={styles.container}>
      <Text>Ello {session.user.first}!</Text>
      <Button title="Sign Out" onPress={session.logOut} />
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
