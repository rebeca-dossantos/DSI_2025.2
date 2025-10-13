import React, { JSX, useState, useMemo, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {SafeAreaView,View,Text,TextInput,Linking,TouchableOpacity,StyleSheet,KeyboardAvoidingView,Platform,Image,FlatList,Pressable,Alert, ScrollView, Modal, Dimensions} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
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
        style={[styles.button, { marginTop: 12, backgroundColor: '#16a34a' }]}
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

  type Place = {
  id: string;
  name: string;
  type: string;
  rating: number;
  distance: string;
  address: string;
  hours: string;
  phone: string;
  diabeticFriendly?: boolean;
};

  const placesObj: Place[] = [
  {
    id: "1",
    name: "Green Bowl Restaurante",
    type: "Restaurante Saudável",
    rating: 4.8,
    distance: "0.3 km",
    address: "Rua das Flores, 123 - Boa Viagem",
    hours: "Aberto até 22h",
    phone: "(81) 99999-1001",
    diabeticFriendly: true,
  },
  {
    id: "2",
    name: "Vida Natural",
    type: "Lanchonete Fit",
    rating: 4.6,
    distance: "0.5 km",
    address: "Av. Conselheiro Aguiar, 456",
    hours: "Aberto até 20h",
    phone: "(81) 99999-1002",
    diabeticFriendly: true,
  },
  {
    id: "3",
    name: "Farmácia Saúde+",
    type: "Farmácia",
    rating: 4.9,
    distance: "0.2 km",
    address: "Rua do Hospital, 789",
    hours: "Aberto 24h",
    phone: "(81) 99999-1003",
    diabeticFriendly: true,
  },
];

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // pins mockados
  const pinPositions = useMemo(() => {
    // Use pixel values instead of percentage strings for left/top
    const mapWidth = Dimensions.get("window").width * 0.95; // approximate width of mapArea
    const mapHeight = 220; // height of mapWrap/mapArea
    return placesObj.map((_, index) => {
      return {
        left: 0.2 * mapWidth + index * 0.25 * mapWidth,
        top: 0.3 * mapHeight + index * 0.15 * mapHeight,
      };
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#059669", "#16a34a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.mapHeaderTitle}>Locais Próximos</Text>
        <Text style={styles.mapHeaderSubtitle}>
          Restaurantes e serviços para diabéticos
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        {/* "Mapa" (placeholder visual) */}
        <View style={styles.mapWrap}>
          <LinearGradient
            colors={["#bbf7d0", "#86efac"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mapArea}
          >
            <View style={styles.mapCard}>
              <Feather
                name="map-pin"
                size={28}
                color="#16a34a"
                style={{ marginBottom: 6 }}
              />
              <Text style={styles.mapCardTitle}>Mapa interativo</Text>
              <Text style={styles.mapCardSubtitle}>Recife, PE</Text>
            </View>

            {placesObj.map((place, i) => (
              <TouchableOpacity
                key={place.id}
                activeOpacity={0.8}
                onPress={() => setSelectedPlace(place)}
                style={[
                  styles.pinButton,
                  {
                    left: pinPositions[i].left,
                    top: pinPositions[i].top,
                    backgroundColor: "#16a34a",
                  },
                ]}
              >
                <Feather name="map-pin" size={16} color="#fff" />
              </TouchableOpacity>
            ))}
          </LinearGradient>
        </View>

        {/* Lista */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <Text style={styles.sectionTitle}>Locais Recomendados</Text>

          {placesObj.map((place) => {
            const selected = selectedPlace?.id === place.id;
            return (
              <TouchableOpacity
                key={place.id}
                activeOpacity={0.9}
                onPress={() => setSelectedPlace(place)}
                style={[
                  styles.placeCard,
                  selected && { borderColor: "#22c55e", borderWidth: 2 },
                ]}
              >
                <View style={styles.placeTopRow}>
                  <View style={{ flexShrink: 1, paddingRight: 8 }}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeType}>{place.type}</Text>
                    {place.diabeticFriendly && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Diabético-friendly</Text>
                      </View>
                    )}
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <View style={styles.ratingRow}>
                      <Feather
                        name="star"
                        size={14}
                        color="#fbbf24"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.ratingText}>{place.rating}</Text>
                    </View>
                    <Text style={styles.distanceText}>{place.distance}</Text>
                  </View>
                </View>

                <View style={{ marginTop: 6 }}>
                  <View style={styles.infoRow}>
                    <Feather
                      name="map-pin"
                      size={12}
                      color="#4b5563"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.infoText}>{place.address}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Feather
                      name="clock"
                      size={12}
                      color="#4b5563"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.infoText}>{place.hours}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Detalhe do selecionado */}
          {selectedPlace && (
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>{selectedPlace.name}</Text>

              <View style={{ gap: 10 }}>
                <View style={styles.infoRowBig}>
                  <Feather
                    name="phone"
                    size={16}
                    color="#374151"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.detailText}>{selectedPlace.phone}</Text>
                </View>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: "#16a34a" }]}
                    onPress={() => {
                      // TODO: Linking para Google/Apple Maps com lat/lng do place
                    }}
                  >
                    <Feather
                      name="navigation"
                      size={16}
                      color="#fff"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.btnText, { color: "#fff" }]}>
                      Navegar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btn, styles.btnOutline]}
                    onPress={() => {
                      // TODO: Linking.openURL(`tel:${selectedPlace.phone}`)
                    }}
                  >
                    <Feather
                      name="phone"
                      size={16}
                      color="#16a34a"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.btnText, { color: "#16a34a" }]}>
                      Ligar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      
    </View>
  );
}
function ProfileScreen() {
  const [userEmail, setUserEmail] = useState('');
  const [userStats, setUserStats] = useState({
    dias: 12,
    carboidrato: 170,
    peso: 70,
    altura: 170,
    calorias: 1800,
    proteina: 120,
  });

  // 🔥 AQUI ficam as metas:
  const [goals, setGoals] = useState({
    calorias: 1800,
    proteina: 120,
    carboidratos: 220,
    gordura: 60,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<null | string>(null);
  const [newValue, setNewValue] = useState('');

  const handleEditStats = (key: string) => {
  setSelectedGoal(key);
  setNewValue(String((userStats as any)[key]));
  setModalVisible(true);
};

const handleEditGoals = (key: string) => {
  setSelectedGoal(key);
  setNewValue(String((goals as any)[key]));
  setModalVisible(true);
};


  const saveGoal = () => {
    if (selectedGoal && !isNaN(Number(newValue))) {
      setGoals({ ...goals, [selectedGoal]: Number(newValue) });
    }
    setModalVisible(false);
    setSelectedGoal(null);
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('lastLoggedUser');
        if (storedEmail) setUserEmail(storedEmail);
      } catch (err) {
        console.warn('Erro ao carregar email:', err);
      }
    };
    loadUser();
  }, []);

return (
   <ScrollView style={[styles.container, { backgroundColor: '#f5f7f6' }]} contentContainerStyle={{ paddingBottom: 20 }}>

    {/* Header */}
    <View style={styles.header}>
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri: 'https://ui-avatars.com/api/?name=User&background=007AFF&color=fff&size=128',
          }}
          style={styles.avatar}
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.name}>Usuário de Teste</Text>
        <Text style={styles.email}>{userEmail || 'User@gmail.com'}</Text>
      </View>
    </View>

    {/* Estatísticas */}
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statsLabel}>Dias consecutivos</Text>
        <Text style={styles.statsValue}>{userStats.dias}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statsLabel}>Média carb/dia</Text>
        <Text style={styles.statsValue}>{userStats.carboidrato}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statsLabel}>Média proteínas/dia</Text>
        <Text style={styles.statsValue}>{userStats.proteina}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statsLabel}>Media kcal/dia</Text>
        <Text style={styles.statsValue}>{userStats.calorias}</Text>
      </View>
    </View>
 {/* Card Dados Pessoais */}
      <View style={styles.goalsCard}>
        <Text style={styles.goalsTitle}>Dados Pessoais</Text>

        <View style={styles.goalRow}>
          <Text style={styles.goalLabel}>Altura</Text>
          <View style={styles.goalValueBox}>
            <Text style={styles.goalValue}>{userStats.altura} cm</Text>
            <TouchableOpacity onPress={() => handleEditStats('altura')}>
              <Ionicons name="create-outline" size={24} color="#58ad53" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.goalRow}>
          <Text style={styles.goalLabel}>Peso</Text>
          <View style={styles.goalValueBox}>
            <Text style={styles.goalValue}>{userStats.peso} Kg</Text>
            <TouchableOpacity onPress={() => handleEditStats('peso')}>
              <Ionicons name="create-outline" size={24} color="#58ad53" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Card de Metas */}
<View style={styles.goalsCard}>
  <Text style={styles.goalsTitle}>Metas Diárias</Text>

  {Object.entries(goals).map(([key, value]) => (
    <View key={key} style={styles.goalRow}>
      <Text style={styles.goalLabel}>
        {key.charAt(0).toUpperCase() + key.slice(1)}
      </Text>
      <View style={styles.goalValueBox}>
        <Text style={styles.goalValue}>
          {value}
          {key === 'calorias' ? ' kcal' : ' g'}
        </Text>
        <TouchableOpacity onPress={() => handleEditGoals(key)}>
          <Ionicons name="create-outline" size={24} color="#2f80ed" />
        </TouchableOpacity>
      </View>
    </View>
  ))}

  {/* 🔥 Modal de Edição */}
  <Modal
    transparent
    animationType="fade"
    visible={modalVisible}
    onRequestClose={() => setModalVisible(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>
          Editar {selectedGoal && selectedGoal.charAt(0).toUpperCase() + selectedGoal.slice(1)}
        </Text>

        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={newValue}
          onChangeText={setNewValue}
        />

        <View style={styles.modalButtons}>
          <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.buttonText}>Cancelar</Text>
          </Pressable>
          <Pressable style={styles.saveButton} onPress={saveGoal}>
            <Text style={styles.buttonText}>Salvar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
  
</View>
<TouchableOpacity
  style={styles.emergencyButton}
  onPress={() => Linking.openURL('tel:190')} // ou o número de emergência local
>
  <Text style={styles.emergencyButtonText}>Ligar para Emergência</Text>
</TouchableOpacity>
  </ScrollView>
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

  mapContainer: { flex: 1, backgroundColor: "#f3f4f6" },
  mapHeader: {
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  mapHeaderTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  mapHeaderSubtitle: {
    color: "#dcfce7",
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
  },

  mapWrap: { height: 220, marginTop: 12, marginHorizontal: 0 },
  mapArea: { flex: 1, justifyContent: "center" },
  mapCard: {
    alignSelf: "center",
    width: 0.42 * Dimensions.get("window").width,
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    alignItems: "center",
  },
  mapCardTitle: { fontSize: 13, color: "#4b5563" },
  mapCardSubtitle: { fontSize: 11, color: "#6b7280" },

  pinButton: {
    position: "absolute",
    padding: 8,
    borderRadius: 999,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  sectionTitle: { color: "#fff", fontWeight: "600", marginBottom: 10, fontSize: 16 },
  placeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: "transparent",
  },
  placeTopRow: { flexDirection: "row", justifyContent: "space-between" },
  placeName: { fontWeight: "600", fontSize: 15 },
  placeType: { color: "#4b5563", fontSize: 13, marginTop: 2 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 6,
  },
  badgeText: { color: "#166534", fontSize: 11, fontWeight: "600" },

  ratingRow: { flexDirection: "row", alignItems: "center" },
  ratingText: { fontSize: 13 },
  distanceText: { fontSize: 11, color: "#6b7280", marginTop: 4 },

  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  infoRowBig: { flexDirection: "row", alignItems: "center" },
  infoText: { fontSize: 13, color: "#4b5563" },

  detailCard: {
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginTop: 14,
    marginBottom: 10,
  },
  detailTitle: { fontWeight: "700", color: "#065f46", marginBottom: 8 },
  detailText: { color: "#374151", fontSize: 14 },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnOutline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#16a34a",
  },
  btnText: { fontWeight: "600", fontSize: 14 },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    backgroundColor: "#fff",
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  bottomItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  bottomLabel: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  container: {
    flex: 1,
    backgroundColor: '#f5f7f6',
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
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  form: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    color: '#000',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#166534',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    color: '#111',
    backgroundColor: '#f5f7f6',
  },
  button: {
    marginTop: 18,
    backgroundColor: '#86efac',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonSair: {
    marginTop: 18,
    backgroundColor: '#86efac',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#166534',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    marginTop: 10,
    alignItems: 'center',
  },
  linkText: {
    color: '#000',
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
    backgroundColor: '#86efac',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addMealText: {
    color: '#166534',
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
    backgroundColor: '#16a34a',
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
    header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e0e0e0',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 25,
    fontWeight: '600',
    color: '#222',
  },
  email: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsLabel: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
  },
  goalsCard: {
  backgroundColor: '#fff',
  marginHorizontal: 20,
  marginTop: 20,
 height: 'auto',
  borderRadius: 16,
  paddingVertical: 20,
  paddingHorizontal: 16,
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 3,
},
goalsTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#222',
  marginBottom: 12,
},
goalRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 20,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},
goalLabel: {
  fontSize: 18,
  color: '#444',
},
goalValueBox: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
goalValue: {
  fontSize: 18,
  fontWeight: '600',
  color: '#111',
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContent: {
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 20,
  width: '80%',
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 6,
  elevation: 5,
},
modalTitle: {
  fontSize: 18,
  fontWeight: '600',
  marginBottom: 12,
  textAlign: 'center',
},
modalButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 16,
},
cancelButton: {
  backgroundColor: '#ccc',
  borderRadius: 8,
  paddingVertical: 10,
  paddingHorizontal: 16,
},
saveButton: {
  backgroundColor: '#58ad53',
  borderRadius: 8,
  paddingVertical: 10,
  paddingHorizontal: 16,
},
emergencyButton: {
  backgroundColor: '#e74c3c',
  paddingVertical: 16,
  marginHorizontal: 16,
  borderRadius: 12,
  marginTop: 20,
  alignItems: 'center',
},
emergencyButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},
});