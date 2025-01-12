import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { MangaDexApi } from '../services/mangadex-api';

const COLORS = {
  primary: '#FF6B00',
  secondary: '#000000',
  background: '#FFFFFF',
  text: '#1A1A1A',
  border: '#E5E5E5',
};

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Fehler', 'Bitte fülle alle Felder aus');
      return;
    }

    setIsLoading(true);
    try {
      const success = await MangaDexApi.auth.login(username, password);
      if (success) {
        router.replace('/(tabs)/search');
      } else {
        Alert.alert('Fehler', 'Login fehlgeschlagen');
      }
    } catch (error) {
      Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manga Reader</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Benutzername"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Passwort"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity 
          style={styles.button}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.buttonText}>Anmelden</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
}); 