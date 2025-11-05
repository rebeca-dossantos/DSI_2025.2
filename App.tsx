// App.tsx
import React, { JSX, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView, KeyboardAvoidingView, Platform, Image, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { BaseToast, ErrorToast } from 'react-native-toast-message';
import type { BaseToastProps } from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Home from './Home';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: { userEmail: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

async function getUsers(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem('users');
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch (err) {
    console.warn('Erro lendo usuários', err);
    return {};
  }
}

async function saveUsers(users: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem('users', JSON.stringify(users));
  } catch (err) {
    console.warn('Erro salvando usuários', err);
  }
}

function LoginScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Toast.show({ type: 'error', text1: 'Ops! Falta algo.', text2: 'Preencha seu email e sua senha para continuar.', visibilityTime: 4000 });
      return;
    }
    const users = await getUsers();
    const stored = users[email.trim().toLowerCase()];
    if (!stored) {
      Toast.show({ type: 'error', text1: 'Não existe uma conta com esse email.', text2: 'Cadastre-se para continuar.', visibilityTime: 4000 });
      return;
    }
    if (stored !== password) {
      Toast.show({ type: 'error', text1: 'Erro', text2: 'Senha incorreta, tente novamente', visibilityTime: 4000 });
      return;
    }
    await AsyncStorage.setItem('lastLoggedUser', email.trim());
    navigation.replace('Home', { userEmail: email.trim() });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.inner} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Image source={require('./assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>FitTrack</Text>
        <Text style={styles.subtitle}>Login</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Insira seu email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#999"
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#999"
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.link, { marginTop: 10 }]} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Ainda não tem conta? Cadastre-se</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.link} onPress={() => { setEmail('teste@exemplo.com'); setPassword('123456'); }}>
            <Text style={styles.linkText}>Usar credenciais de teste</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>DSI 2025.2 — UFRPE</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RegisterScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleRegister = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !password) {
      Toast.show({ type: 'error', text1: 'Ops! Falta algo.', text2: 'Por favor, preencha seu email e sua senha para continuar.', visibilityTime: 4000 });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(e)) {
      Toast.show({ type: 'error', text1: 'Email inválido.', visibilityTime: 4000 });
      return;
    }
    const users = await getUsers();
    if (users[e]) {
      Toast.show({ type: 'error', text1: 'Já existe uma conta com esse email.', text2: 'Faça login ou recupere a senha.', visibilityTime: 4000 });
      return;
    }
    users[e] = password;
    await saveUsers(users);
    await AsyncStorage.setItem('lastLoggedUser', e);
    Toast.show({ type: 'success', text1: 'Conta criada', text2: 'Sua conta foi criada com sucesso!', visibilityTime: 4000 });

    navigation.replace('Home', { userEmail: e });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.inner} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Image source={require('./assets/logo.png')} style={styles.logo} resizeMode="contain" />

        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Cadastre um email e senha</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Insira seu email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#999"
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#999"
          />

          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Criar Conta</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Voltar ao login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const toastConfig = {
  error: (props: BaseToastProps) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#B30000', backgroundColor: '#B30000' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: '900', color: 'white' }}
      text2Style={{ fontSize: 13, color: 'white' }}
    />
  ),
  success: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#2F80ED', backgroundColor: '#2F80ED' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: '900', color: 'white' }}
      text2Style={{ fontSize: 13, color: 'white' }}
    />
  ),
};

export default function App(): JSX.Element {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Criar Conta' }} />
          <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast config={toastConfig} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7f6' },
  inner: { flex: 1, padding: 20, justifyContent: 'center' },
  logo: { width: 120, height: 120, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 6, color: '#000' },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20, color: '#000' },
  form: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 12, elevation: 3 },
  label: { fontSize: 12, color: '#000', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#166534', padding: 12, borderRadius: 8, fontSize: 14, color: '#111', backgroundColor: '#f5f7f6' },
  button: { marginTop: 18, backgroundColor: '#86efac', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#166534', fontWeight: '600', fontSize: 16 },
  link: { marginTop: 10, alignItems: 'center' },
  linkText: { color: '#000', fontSize: 13 },
  footer: { textAlign: 'center', marginTop: 18, color: '#999', fontSize: 12 },

  searchInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginTop: 8, backgroundColor: '#f7f7f7' },
  foodRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, elevation: 1 },
  foodName: { fontWeight: '700' },
  foodDesc: { color: '#666', marginTop: 4, fontSize: 12 },
  foodMeta: { flexDirection: 'row', marginTop: 6 },
  foodMetaText: { color: '#999', fontSize: 12 },
  qtyBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 6, backgroundColor: '#f0f0f0', paddingHorizontal: 6, paddingVertical: 4, marginLeft: 8 },
  qtyBtn: { paddingHorizontal: 8, paddingVertical: 2 },
  qtyBtnText: { fontSize: 18, fontWeight: '700' },
  qtyValue: { minWidth: 24, textAlign: 'center', fontWeight: '700' },
  addBar: { position: 'absolute', left: 0, right: 0, bottom: 50, height: 64, backgroundColor: '#58ad53', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  addBarBtn: { backgroundColor: '#0b8f3f', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
});
