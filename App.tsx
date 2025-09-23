import React, { JSX, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {SafeAreaView,View,Text,TextInput,TouchableOpacity,StyleSheet,KeyboardAvoidingView,Platform,Alert, Image} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: { userEmail: string } | undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const USERS_KEY = 'users';

const Tab = createBottomTabNavigator();


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

    navigation.replace('Main', { userEmail: email.trim() });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Image
      source={require('./assets/logo.png')} 
      style={styles.logo}
      resizeMode="contain"
    />
        <Text style={styles.title}>Registro nutricional</Text>
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
      <Text style={styles.homeTitle}>Hoje</Text>


      <View style={styles.statsWrapper}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Proteínas</Text>
          <Text style={styles.statValue}>0g</Text>
      </View>

      <View style={styles.statBox}>
      <Text style={styles.statLabel}>Carboidratos</Text>
    <Text style={styles.statValue}>0g</Text>
  </View>

  <View style={styles.statBox}>
    <Text style={styles.statLabel}>Calorias</Text>
    <Text style={styles.statValue}>0 kcal</Text>
  </View>
</View>

<TouchableOpacity style={styles.addMealBtn}>
  <Text style={styles.addMealText}>Adicionar lanche</Text>
</TouchableOpacity>
<View style={styles.mealsWrapper}>
  <View style={styles.mealRow}>
    <Text style={styles.mealIcon}>☕</Text>
    <View style={styles.mealContent}>
      <Text style={styles.mealLabel}>Café da manhã</Text>
      <Text style={styles.mealItems}>Nenhum alimento ainda</Text>
    </View>
    <TouchableOpacity style={styles.plusBtn}>
      <Text style={styles.plusText}>+</Text>
    </TouchableOpacity>
  </View>

  <View style={styles.mealRow}>
    <Text style={styles.mealIcon}>🍽️</Text>
    <View style={styles.mealContent}>
      <Text style={styles.mealLabel}>Almoço</Text>
      <Text style={styles.mealItems}>Nenhum alimento ainda</Text>
    </View>
    <TouchableOpacity style={styles.plusBtn}>
      <Text style={styles.plusText}>+</Text>
    </TouchableOpacity>
  </View>

  <View style={styles.mealRow}>
    <Text style={styles.mealIcon}>🌙</Text>
    <View style={styles.mealContent}>
      <Text style={styles.mealLabel}>Janta</Text>
      <Text style={styles.mealItems}>Nenhum alimento ainda</Text>
    </View>
    <TouchableOpacity style={styles.plusBtn}>
      <Text style={styles.plusText}>+</Text>
    </TouchableOpacity>
  </View>
</View>

      <TouchableOpacity
        style={[styles.buttonSair, { marginTop:'auto', marginBottom: 40 }]}
        onPress={() => navigation.replace('Login')}
      >
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
  );
}
function MapScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Tela Mapa</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Tela Perfil</Text>
    </View>
  );
}
function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#58ad53',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { backgroundColor: '#fff', height: 60, paddingBottom: 6 },
        tabBarIcon: ({ color, size }) => {
          let icon = 'home';
          if (route.name === 'Mapa') icon = 'map';
          if (route.name === 'Perfil') icon = 'person';
          return <Ionicons name={icon as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Mapa" component={MapScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App(): JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Criar Conta' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
        <Stack.Screen
          name="Main"
          component={Tabs}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#294c25',
  },
  inner: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logo: {
  width: 120,
  height: 120,
  alignSelf: 'center',
  marginBottom: 16,
},
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    color: '#f5f7f6',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#f5f7f6',
  },
  form: {
    backgroundColor: '#58ad53',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    color: '#f5f7f6',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#f5f7f6',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    color: '#111',
    backgroundColor: '#f5f7f6',
  },
  button: {
    marginTop: 18,
    backgroundColor: '#294c25',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonSair: {
    marginTop: 18,
    backgroundColor: '#58ad53',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#f5f7f6',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    marginTop: 10,
    alignItems: 'center',
  },
  linkText: {
    color: '#f5f7f6',
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
  },
  homeTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#f5f7f6',
    marginTop: 30,
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
  statsWrapper: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 30,
},
statBox: {
  flex: 1,
  backgroundColor: '#fff',
  marginHorizontal: 6,
  paddingVertical: 18,
  borderRadius: 12,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 2,
},
statLabel: {
  fontSize: 14,
  color: '#666',
},
statValue: {
  fontSize: 18,
  fontWeight: '700',
  color: '#111',
  marginTop: 4,
},
addMealBtn: {
  marginTop: 20,
  backgroundColor: '#58ad53',
  paddingVertical: 14,
  borderRadius: 12,
  alignItems: 'center',
},
addMealText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},
mealsWrapper: {
  marginTop: 40,
},
mealRow: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 14,
  marginBottom: 12,
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 1,
},
mealIcon: {
  fontSize: 22,
  marginRight: 10,
},
mealContent: {
  flex: 1,
},
mealLabel: {
  fontWeight: '600',
  fontSize: 15,
  color: '#111',
},
mealItems: {
  fontSize: 13,
  color: '#666',
  marginTop: 2,
},
plusBtn: {
  backgroundColor: '#58ad53',
  borderRadius: 20,
  width: 28,
  height: 28,
  alignItems: 'center',
  justifyContent: 'center',
},
plusText: {
  color: '#fff',
  fontSize: 18,
  fontWeight: '700',
},

});