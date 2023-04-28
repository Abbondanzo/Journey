import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useActiveSession } from '../../features/auth/hooks/useActiveSession';
import { Button } from '../../features/theme/components/Button';
import { Input } from '../../features/theme/components/Input';

export default function Home() {
  const { session, logIn, logOut } = useActiveSession();

  const [first, setFirst] = useState(session.user.first);
  const [last, setLast] = useState(session.user.last);

  return (
    <View style={styles.container}>
      <Text>Ello {session.user.first}!</Text>
      <Input value={first} onChangeText={setFirst} style={styles.marginBottom} />
      <Input value={last} onChangeText={setLast} style={styles.marginBottom} />
      <Button
        text="Save"
        disabled={first === session.user.first && last === session.user.last}
        onPress={() => logIn({ ...session.user, first, last })}
        style={styles.marginBottom}
      />
      <Button text="Sign Out" onPress={logOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },

  marginBottom: {
    marginBottom: 8,
  },
});
