import { Button, StyleSheet, Text, View } from 'react-native';
import { useActiveSession } from '../../features/auth/hooks/useActiveSession';

export default function Home() {
  const { session, logOut } = useActiveSession();
  return (
    <View style={styles.container}>
      <Text>Ello {session.user.first}!</Text>
      <Button title="Sign Out" onPress={logOut} />
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
