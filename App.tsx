import React, { JSX, useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {SafeAreaView,View,Text,TextInput,TouchableOpacity,StyleSheet,KeyboardAvoidingView,Platform,Image,FlatList,Pressable,Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { BaseToast, ErrorToast } from 'react-native-toast-message';
import type { BaseToastProps } from 'react-native-toast-message';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: { userEmail: string } | undefined;
  Main: undefined;
  AddFood: { meal?: string } | undefined;
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

async function saveUsers(users: Record<string, string>): Promise<void> {
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
      Toast.show({
        type: 'error',
        text1: 'Ops! Falta algo.',
        text2: 'Preencha seu email e sua senha para continuar.',
        visibilityTime: 4000,
      });
      return;
    }

    const users = await getUsers();
    const stored = users[email.trim().toLowerCase()];

    if (!stored) {
      Toast.show({
        type: 'error',
        text1: 'Não existe uma conta com esse email.',
        text2: 'Cadastre-se para continuar.',
        visibilityTime: 4000,
      });
      return;
    }

    if (stored !== password) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Senha incorreta, tente novamente',
        visibilityTime: 4000,
      });
      return;
    }

    navigation.replace('Main', { userEmail: email.trim() });
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

          <TouchableOpacity style={[styles.link, { marginTop: 10 }]} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Ainda não tem conta? Cadastre-se</Text>
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
      Toast.show({
        type: 'error',
        text1: 'Ops! Falta algo.',
        text2: 'Por favor, preencha seu email e sua senha para continuar.',
        visibilityTime: 4000,
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(e)) {
      Toast.show({
        type: 'error',
        text1: 'Email inválido.',
        visibilityTime: 4000,
      });
      return;
    }

    const users = await getUsers();

    if (users[e]) {
      Toast.show({
        type: 'error',
        text1: 'Já existe uma conta com esse email.',
        text2: 'Faça login ou recupere a senha.',
        visibilityTime: 4000,
      });
      return;
    }

    users[e] = password;
    await saveUsers(users);

    Toast.show({
      type: 'success',
      text1: 'Conta criada',
      text2: 'Sua conta foi criada com sucesso!',
      visibilityTime: 4000,
    });

    navigation.replace('Main', { userEmail: e });
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

          <TouchableOpacity style={styles.button} onPress={handleRegister} accessibilityRole="button">
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

function HomeScreen({ navigation, route }: { navigation: any; route: any }) {
  const userEmail = route?.params?.userEmail ?? 'Usuário';

  const [meals, setMeals] = useState<Record<string, SavedMealItem[]>>({});

  const [totalProtein, setTotalProtein] = useState<number>(0);
  const [totalCarbs, setTotalCarbs] = useState<number>(0);
  const [totalCalories, setTotalCalories] = useState<number>(0);

    useEffect(() => {
    const computeTotals = (mealsSaved: Record<string, SavedMealItem[]>) => {
      let p = 0;
      let c = 0;
      let cal = 0;

      Object.values(mealsSaved).forEach((items) => {
        items.forEach((it) => {
          const food = SAMPLE_FOODS.find((f) => f.id === it.id);
          if (!food) return;
          const qty = it.qty ?? 1;

          p += (food.protein ?? 0) * qty;
          c += (food.carbs ?? 0) * qty;
          cal += (food.cal ?? 0) * qty;
        });
      });

      setTotalProtein(Math.round(p * 10) / 10);
      setTotalCarbs(Math.round(c * 10) / 10);
      setTotalCalories(Math.round(cal));
    };

    const loadAndCompute = async () => {
      const data = await loadMealsForToday();
      setMeals(data);
      computeTotals(data);
    };

    const unsub = navigation.addListener('focus', loadAndCompute);

    loadAndCompute();

    return unsub;
  }, [navigation]);

  const displayForMeal = (mealName: string) => {
    const items = meals[mealName] ?? [];
    if (items.length === 0) return 'Nenhum alimento ainda';
    const names = items.map((it) => it.name);
    return joinAndTruncate(names, 36);
  };

  // --- FUNÇÃO TEMPORÁRIA DE RESET (APENAS PARA TESTES) ---
  // Este botão limpa somente os alimentos salvos para o dia atual.
  // É temporário — quando não for mais necessário, basta remover o botão JSX
  // (o restante do código NÃO precisa ser alterado).
  const handleResetMeals = () => {
    Alert.alert(
      'Confirmar reset',
      'Deseja limpar todas as refeições salvas de hoje? Esta ação é apenas para testes e pode ser revertida apagando a chave no AsyncStorage.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(todayKey());
              setMeals({});
              setTotalProtein(0);
              setTotalCarbs(0);
              setTotalCalories(0);
              Toast.show({
                type: 'success',
                text1: 'Reset realizado',
                text2: 'As refeições de hoje foram removidas.',
                visibilityTime: 2500,
              });
            } catch (err) {
              console.warn('Erro ao resetar refeições', err);
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: 'Não foi possível resetar os dados.',
                visibilityTime: 2500,
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  // --- FIM DA FUNÇÃO TEMPORÁRIA DE RESET ---

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.homeInner}>
        <Text style={styles.homeTitle}>Hoje</Text>

        <View style={styles.statsWrapper}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Proteínas</Text>
            <Text style={styles.statValue}>{`${totalProtein} g`}</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Carboidratos</Text>
            <Text style={styles.statValue}>{`${totalCarbs} g`}</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Calorias</Text>
            <Text style={styles.statValue}>{`${totalCalories} kcal`}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addMealBtn}
          onPress={() => navigation.navigate('AddFood', { meal: 'Lanche' })}
        >
          <Text style={styles.addMealText}>Adicionar lanche</Text>
        </TouchableOpacity>

        <View style={styles.mealsWrapper}>
          <View style={styles.mealRow}>
            <Text style={styles.mealIcon}>☕</Text>
            <View style={styles.mealContent}>
              <Text style={styles.mealLabel}>Café da manhã</Text>
              <Text style={styles.mealItems}>{displayForMeal('Café da manhã')}</Text>
            </View>
            <TouchableOpacity
              style={styles.plusBtn}
              onPress={() => navigation.navigate('AddFood', { meal: 'Café da manhã' })}
            >
              <Text style={styles.plusText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mealRow}>
            <Text style={styles.mealIcon}>🍽️</Text>
            <View style={styles.mealContent}>
              <Text style={styles.mealLabel}>Almoço</Text>
              <Text style={styles.mealItems}>{displayForMeal('Almoço')}</Text>
            </View>
            <TouchableOpacity
              style={styles.plusBtn}
              onPress={() => navigation.navigate('AddFood', { meal: 'Almoço' })}
            >
              <Text style={styles.plusText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mealRow}>
            <Text style={styles.mealIcon}>🌙</Text>
            <View style={styles.mealContent}>
              <Text style={styles.mealLabel}>Janta</Text>
              <Text style={styles.mealItems}>{displayForMeal('Janta')}</Text>
            </View>
            <TouchableOpacity
              style={styles.plusBtn}
              onPress={() => navigation.navigate('AddFood', { meal: 'Janta' })}
            >
              <Text style={styles.plusText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

      {/* BOTÃO TEMPORÁRIO DE RESET - REMOVA ESTE BLOCO QUANDO NÃO PRECISAR MAIS */}
      {/* Ao remover, delete apenas este TouchableOpacity; não é necessário alterar nada no resto do código */}
      <TouchableOpacity
        style={[styles.button, { marginTop: 12, backgroundColor: '#e74c3c' }]}
        onPress={handleResetMeals}
      >
        <Text style={styles.buttonText}>Resetar alimentos (teste)</Text>
      </TouchableOpacity>
      {/* FIM DO BOTÃO TEMPORÁRIO DE RESET */}

      <TouchableOpacity
        style={[styles.buttonSair, { marginTop: 12, marginBottom: 40 }]}
        onPress={() => navigation.replace('Login')}
      >
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

type FoodItem = {
  id: number;
  name: string;
  description?: string;
  carbs?: number;
  protein?: number;
  cal?: number;
  glycemic?: string;
};

const GLYCEMIC_COLORS: Record<string, string> = {
  'IG Muito baixo': '#2ecc71', 
  'IG Baixo': '#3498db',       
  'IG Médio': '#f1c40f',       
  'IG Alto': '#e74c3c',        
};

function getGlycemicColor(level?: string) {
  if (!level) return '#95a5a6';
  return GLYCEMIC_COLORS[level] ?? '#95a5a6';
}

function getGlycemicTextColor(level?: string) {
  if (level === 'IG Médio') return '#111';
  return '#fff';
}

const SAMPLE_FOODS: FoodItem[] = [
  {id: 1, name: 'Aveia integral', description: 'Cereais • 30g', carbs: 20, cal: 117, protein: 4, glycemic: 'IG Baixo'},
  {id: 2, name: 'Peito de frango grelhado', description: 'Carnes • 100g', carbs: 0, cal: 165, protein: 31, glycemic: 'IG Muito baixo'},
  {id: 3, name: 'Brócolis cozido', description: 'Vegetais • 100g', carbs: 7, cal: 34, protein: 3, glycemic: 'IG Muito baixo'},
  {id: 4, name: 'Arroz integral cozido', description: 'Cereais • 100g', carbs: 23, cal: 111, protein: 2.6, glycemic: 'IG Médio'},
  {id: 5, name: 'Maçã', description: 'Frutas • 100g', carbs: 14, cal: 52, protein: 0.3, glycemic: 'IG Baixo'},
  {id: 6, name: 'Banana', description: 'Frutas • 118g', carbs: 27, cal: 105, protein: 1.3, glycemic: 'IG Médio'},
  {id: 7, name: 'Feijão carioca cozido', description: 'Leguminosas • 100g', carbs: 14, cal: 127, protein: 8.7, glycemic: 'IG Muito baixo'},
  {id: 8, name: 'Ovo cozido', description: 'Ovos • 1 unid.', carbs: 0.6, cal: 68, protein: 6, glycemic: 'IG Muito baixo'},
  {id: 9, name: 'Pão integral', description: 'Pães • 50g', carbs: 23, cal: 130, protein: 5, glycemic: 'IG Médio'},
  {id: 10, name: 'Salmão grelhado', description: 'Peixes • 100g', carbs: 0, cal: 208, protein: 20, glycemic: 'IG Muito baixo'},
  {id: 11, name: 'Iogurte natural desnatado', description: 'Laticínios • 170g', carbs: 17, cal: 100, protein: 10, glycemic: 'IG Baixo'},
  {id: 12, name: 'Queijo Minas frescal', description: 'Laticínios • 30g', carbs: 1, cal: 90, protein: 6, glycemic: 'IG Muito baixo'},
  {id: 13, name: 'Brócolis cru', description: 'Vegetais • 100g', carbs: 7, cal: 31, protein: 2.5, glycemic: 'IG Muito baixo'},
  {id: 14, name: 'Batata inglesa cozida', description: 'Tubérculos • 100g', carbs: 20, cal: 87, protein: 2, glycemic: 'IG Alto'},
  {id: 15, name: 'Arroz branco cozido', description: 'Cereais • 100g', carbs: 28, cal: 130, protein: 2.4, glycemic: 'IG Alto'},
  {id: 16, name: 'Feijão preto cozido', description: 'Leguminosas • 100g', carbs: 14, cal: 132, protein: 9, glycemic: 'IG Muito baixo'},
  {id: 17, name: 'Leite integral', description: 'Laticínios • 200ml', carbs: 10, cal: 122, protein: 6.6, glycemic: 'IG Baixo'},
  {id: 18, name: 'Leite desnatado', description: 'Laticínios • 200ml', carbs: 10, cal: 70, protein: 7.0, glycemic: 'IG Baixo'},
  {id: 19, name: 'Leite achocolatado', description: 'Bebidas • 200ml', carbs: 26, cal: 150, protein: 6, glycemic: 'IG Médio'},
  {id: 20, name: 'Suco de laranja', description: 'Bebidas • 200ml', carbs: 20, cal: 88, protein: 1.6, glycemic: 'IG Médio'},
  {id: 21, name: 'Suco de maçã', description: 'Bebidas • 200ml', carbs: 24, cal: 96, protein: 0.2, glycemic: 'IG Médio'},
  {id: 22, name: 'Iogurte de frutas', description: 'Laticínios • 170g', carbs: 18, cal: 140, protein: 5, glycemic: 'IG Baixo'},
];

const MEALS_KEY_PREFIX = 'meals_';

function todayKey(): string {
  const d = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${MEALS_KEY_PREFIX}${yy}-${mm}-${dd}`;
}

type SavedMealItem = { id: number; name: string; qty: number };

async function loadMealsForToday(): Promise<Record<string, SavedMealItem[]>> {
  try {
    const raw = await AsyncStorage.getItem(todayKey());
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, SavedMealItem[]>;
  } catch (err) {
    console.warn('Erro lendo refeições do dia', err);
    return {};
  }
}

async function saveMealsForToday(data: Record<string, SavedMealItem[]>) {
  try {
    await AsyncStorage.setItem(todayKey(), JSON.stringify(data));
  } catch (err) {
    console.warn('Erro salvando refeições do dia', err);
  }
}

function joinAndTruncate(names: string[], maxChars = 36): string {
  const joined = names.join(' • ');
  if (joined.length <= maxChars) return joined;
  return joined.slice(0, maxChars - 3) + '...';
}

function AddFoodScreen({ navigation, route }: { navigation: any; route: any }) {
  const meal = route?.params?.meal ?? 'Refeição';
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [query, setQuery] = useState<string>('');

  const inc = (id: number) => {
    setSelected((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };
  const dec = (id: number) => {
    setSelected((prev) => {
      const v = Math.max(0, (prev[id] ?? 0) - 1);
      if (v === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: v };
    });
  };

  const totalSelected = Object.values(selected).reduce((s, n) => s + n, 0);

  const handleAdd = async () => {
    if (totalSelected === 0) return;

    const items: SavedMealItem[] = Object.entries(selected).map(([k, qty]) => {
      const id = Number(k);
      const f = SAMPLE_FOODS.find((x) => x.id === id);
      return { id, name: f ? f.name : 'Item', qty };
    });

    const existing = await loadMealsForToday();
    const currentList = existing[meal] ?? [];

    existing[meal] = [...currentList, ...items];
    await saveMealsForToday(existing);

    Toast.show({
      type: 'success',
      text1: 'Itens adicionados',
      text2: `Foram selecionados ${totalSelected} item(ns) para ${meal}.`,
      visibilityTime: 2500,
    });

    navigation.goBack();
  };

  const filteredFoods = SAMPLE_FOODS.filter((f) =>
    f.name.toLowerCase().includes(query.trim().toLowerCase())
  );

    const renderItem = ({ item }: { item: FoodItem }) => {
    const qty = selected[item.id] ?? 0;
    return (
      <View style={styles.foodRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.foodName} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>

            {item.glycemic ? (
              <View style={[styles.glycemicBadge, { backgroundColor: getGlycemicColor(item.glycemic) }]}>
                <Text style={[styles.glycemicText, { color: getGlycemicTextColor(item.glycemic) }]}>
                  {item.glycemic}
                </Text>
              </View>
            ) : null}
          </View>

          {item.description ? <Text style={styles.foodDesc}>{item.description}</Text> : null}

          <View style={styles.foodMeta}>
            <Text style={styles.foodMetaText}>Carbs: {item.carbs ?? 0}g</Text>
            <Text style={[styles.foodMetaText, { marginLeft: 10 }]}>Cal: {item.cal ?? 0}</Text>
          </View>
        </View>

        <View style={styles.qtyBox}>
          <Pressable onPress={() => dec(item.id)} style={styles.qtyBtn}>
            <Text style={styles.qtyBtnText}>-</Text>
          </Pressable>
          <Text style={styles.qtyValue}>{qty}</Text>
          <Pressable onPress={() => inc(item.id)} style={styles.qtyBtn}>
            <Text style={styles.qtyBtnText}>+</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#fff' }]}>
      <View style={{ padding: 16, paddingTop: 20, flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>{`Adicionar alimentos - ${meal}`}</Text>

        <TextInput
          placeholder="Buscar alimentos..."
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />

        <Text style={{ marginTop: 12, marginBottom: 8, color: '#666' }}>Alimentos recomendados</Text>

        {filteredFoods.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#999' }}>Nenhum alimento encontrado</Text>
          </View>
        ) : (
          <FlatList
            data={filteredFoods}
            keyExtractor={(i) => String(i.id)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        )}

        <View style={styles.addBar}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{`Selecionados: ${totalSelected}`}</Text>
          <TouchableOpacity
            style={[styles.addBarBtn, { opacity: totalSelected > 0 ? 1 : 0.45 }]}
            onPress={handleAdd}
            disabled={totalSelected === 0}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Adicionar</Text>
          </TouchableOpacity>
        </View>
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

const toastConfig = {
  error: (props: BaseToastProps) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#B30000',
        backgroundColor: '#B30000',
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '900',
        color: 'white',
      }}
      text2Style={{
        fontSize: 13,
        color: 'white',
      }}
    />
  ),

  success: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#2F80ED',
        backgroundColor: '#2F80ED',
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '900',
        color: 'white',
      }}
      text2Style={{
        fontSize: 13,
        color: 'white',
      }}
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
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
          <Stack.Screen name="AddFood" component={AddFoodScreen} options={{ title: 'Adicionar Refeição' }} />
          <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast config={toastConfig} />
    </>
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

  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    backgroundColor: '#f7f7f7',
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  foodName: {
    fontWeight: '700',
    flex: 1,
    fontSize: 15,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foodDesc: {
    color: '#666',
    marginTop: 4,
    fontSize: 12,
  },
  foodMeta: {
    flexDirection: 'row',
    marginTop: 6,
  },
  foodMetaText: {
    color: '#999',
    fontSize: 12,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginLeft: 8,
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  qtyValue: {
    minWidth: 24,
    textAlign: 'center',
    fontWeight: '700',
  },

  addBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 50,
    height: 64,
    backgroundColor: '#58ad53',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  addBarBtn: {
    backgroundColor: '#0b8f3f',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  glycemicBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  glycemicText: {
    fontSize: 11,
    fontWeight: '700',
  },
});