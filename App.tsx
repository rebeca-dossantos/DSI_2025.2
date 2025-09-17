import React, { JSX, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {SafeAreaView,View,Text,TextInput,TouchableOpacity,StyleSheet,KeyboardAvoidingView,Platform,Alert,} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: { userEmail: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const USERS_KEY = 'users';

async function getUsers(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch (err) {
    console.warn('Erro lendo usuários', err);
    return {};
  }
}

async function saveUers(users: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.warn('Erro salvando usuários', err);
  }
}

function LoginScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');


  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Erro', 'Preencha email e senha para continuar.');
      return;
    }

    const users = await getUsers();
    const stored = users[email.trim().toLowerCase()];

    if (!stored) {
      Alert.alert(
        'Conta não encontrada',
        'Nenhuma conta encontrada para esse email. Deseja criar uma nova conta?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Criar Conta',
            onPress: () => navigation.navigate('Register'),
          },
        ]
      );
      return;
    }

    if (stored !== password) {
      Alert.alert('Erro', 'Senha incorreta. Tente novamente.');
      return;
    }

    navigation.replace('Home', { userEmail: email.trim() });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={styles.title}>Monitor de Queda de Cabelo</Text>
        <Text style={styles.subtitle}>Login para testar a navegação</Text>


        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#999"
            accessibilityLabel="Email"
          />


          <Text style={[styles.label, { marginTop: 12 }]}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#999"
            accessibilityLabel="Senha"
          />


          <TouchableOpacity style={styles.button} onPress={handleLogin} accessibilityRole="button">
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={[styles.link, { marginTop: 10 }]}
            onPress={() => { navigation.navigate('Register'); }}
          >
            <Text style={styles.linkText}>Criar conta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.link}
            onPress={() => {
              setEmail('teste@exemplo.com');
              setPassword('123456');
            }}
          >
            <Text style={styles.linkText}>Usar credenciais de teste</Text>
          </TouchableOpacity>
        </View>


        <Text style={styles.footer}>DSI 2025.2— UFRPE</Text>
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
      Alert.alert('Erro', 'Preencha email e senha para continuar.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(e)) {
      Alert.alert('Erro', 'Email inválido.');
      return;
    }

    const users = await getUsers();

    if (users[e]) {
      Alert.alert('Erro', 'Já existe uma conta com esse email. Faça login ou recupere a senha');
      return;
    }

    users[e] = password;
    await saveUers(users);
    
    Alert.alert('Conta criada', 'Sua conta foi criada com sucesso!');
    
    navigation.replace('Home', { userEmail: e });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Cadastre um email e senha (apenas para testes)</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
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

          <TouchableOpacity style={styles.button} onPress={handleRegister} accessibilityRole="button">
            <Text style={styles.buttonText}>Criar Conta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.link}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>Voltar ao login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function HomeScreen({ navigation, route }: { navigation: any; route: any }) {
  const userEmail = route?.params?.userEmail ?? 'Usuário';


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.homeInner}>
      <Text style={styles.homeTitle}>Bem-vindo(a)</Text>
      <Text style={styles.homeSubtitle}>Você entrou como</Text>
      <Text style={styles.userEmail}>{userEmail}</Text>


      <View style={styles.card}>
        <Text style={styles.cardTitle}>Monitor de Queda de Cabelo</Text>
        <Text style={styles.cardText}>
          Esta é a tela inicial do protótipo. Mais telas (perfil, coleta, mapa) serão
          adicionadas conforme o desenvolvimento.
        </Text>
      </View>


      <TouchableOpacity
        style={[styles.button, { marginTop: 20 }]}
        onPress={() => navigation.replace('Login')}
      >
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
  );
}

export default function App(): JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Criar Conta' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  inner: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  form: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e6e7ee',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    color: '#111',
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 18,
    backgroundColor: '#2f80ed',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    marginTop: 10,
    alignItems: 'center',
  },
  linkText: {
    color: '#2f80ed',
    fontSize: 13,
  },
  footer: {
    textAlign: 'center',
    marginTop: 18,
    color: '#999',
    fontSize: 12,
  },
  homeInner: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  homeTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111',
  },
  homeSubtitle: {
    textAlign: 'center',
    color: '#666',
    marginTop: 6,
  },
  userEmail: {
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
    color: '#2f80ed',
  },
  card: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  cardText: {
    color: '#444',
    lineHeight: 20,
  },
});