// Home.tsx
import React, { JSX, useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, Alert, ScrollView, FlatList, Pressable, TextInput, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

// Navigation imports
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// importe suas telas de Map e Profile (assumindo que existem ./Map e ./Profile)
import MapScreen from './Map';
import ProfileScreen from './Profile';

/* ---- TIPOS ---- */
export type SavedMealItem = { id: number; name: string; qty: number; };

export type FoodItem = {
  id: number;
  name: string;
  description?: string;
  carbs?: number;
  protein?: number;
  cal?: number;
  glycemic?: string;
};

/* ---- DADOS SAMPLE (exportados para AddFood) ---- */
export const SAMPLE_FOODS: FoodItem[] = [
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
export function todayKey(): string {
  const d = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${MEALS_KEY_PREFIX}${yy}-${mm}-${dd}`;
}

export async function loadMealsForToday(): Promise<Record<string, SavedMealItem[]>> {
  try {
    const raw = await AsyncStorage.getItem(todayKey());
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, SavedMealItem[]>;
  } catch (err) {
    console.warn('Erro lendo refeições do dia', err);
    return {};
  }
}

export async function saveMealsForToday(data: Record<string, SavedMealItem[]>) {
  try {
    await AsyncStorage.setItem(todayKey(), JSON.stringify(data));
  } catch (err) {
    console.warn('Erro salvando refeições do dia', err);
  }
}

/* ---- CORES IG (exportadas) ---- */
export const GLYCEMIC_COLORS: Record<string, string> = {
  'IG Muito baixo': '#2ecc71',
  'IG Baixo': '#3498db',
  'IG Médio': '#f1c40f',
  'IG Alto': '#e74c3c',
};
export function getGlycemicColor(level?: string) {
  if (!level) return '#95a5a6';
  return GLYCEMIC_COLORS[level] ?? '#95a5a6';
}
export function getGlycemicTextColor(level?: string) {
  if (level === 'IG Médio') return '#111';
  return '#fff';
}

/* ---- Componente GlycemicBadge (exportado) ---- */
export function GlycemicBadge({ level }: { level?: string }) {
  if (!level) return null;
  const bg = getGlycemicColor(level);
  const color = getGlycemicTextColor(level);
  return (
    <View style={{ marginLeft: 8, backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'center' }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color }}>{level}</Text>
    </View>
  );
}

/* ------------------------------------------------------
   Tela principal (renomeada para HomeScreen)
   ------------------------------------------------------ */
function HomeScreen({ navigation, route }: { navigation: any; route: any }) {
  const userEmail = route?.params?.userEmail ?? 'Usuário';

  const [meals, setMeals] = useState<Record<string, SavedMealItem[]>>({});
  const [totalProtein, setTotalProtein] = useState<number>(0);
  const [totalCarbs, setTotalCarbs] = useState<number>(0);
  const [totalCalories, setTotalCalories] = useState<number>(0);

  useEffect(() => {
    const computeTotals = (mealsSaved: Record<string, SavedMealItem[]>) => {
      let p = 0; let c = 0; let cal = 0;
      Object.values(mealsSaved).forEach(items => items.forEach(it => {
        const food = SAMPLE_FOODS.find(f => f.id === it.id);
        if (!food) return;
        const qty = it.qty ?? 1;
        p += (food.protein ?? 0) * qty;
        c += (food.carbs ?? 0) * qty;
        cal += (food.cal ?? 0) * qty;
      }));
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

  function joinAndTruncate(names: string[], maxChars = 36) {
    const joined = names.join(' • ');
    if (joined.length <= maxChars) return joined;
    return joined.slice(0, maxChars - 3) + '...';
  }

  const renderMealItems = (mealName: string) => {
    const items = meals[mealName] ?? [];
    if (items.length === 0) return <Text style={{ color: '#666' }}>Nenhum alimento ainda</Text>;

    const names = items.map(it => {
      const food = SAMPLE_FOODS.find(f => f.id === it.id);
      const displayName = food ? food.name : it.name;
      return it.qty && it.qty > 1 ? `${displayName} x${it.qty}` : displayName;
    });

    return (
      <Text style={{ color: '#666', marginTop: 4 }}>
        {joinAndTruncate(names, 36)}
      </Text>
    );
  };

  const handleResetMeals = () => {
    Alert.alert(
      'Confirmar reset',
      'Deseja limpar todas as refeições salvas de hoje? (teste)',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', style: 'destructive', onPress: async () => {
            try {
              await AsyncStorage.removeItem(todayKey());
              setMeals({});
              setTotalProtein(0);
              setTotalCarbs(0);
              setTotalCalories(0);
              Toast.show({ type: 'success', text1: 'Reset realizado', text2: 'As refeições de hoje foram removidas.', visibilityTime: 2500 });
            } catch (err) {
              console.warn('Erro ao resetar refeições', err);
              Toast.show({ type: 'error', text1: 'Erro', text2: 'Não foi possível resetar os dados.', visibilityTime: 2500 });
            }
        }}
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 20 }}>Hoje</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 }}>
        <View style={{ flex: 1, backgroundColor: '#fff', marginHorizontal: 6, paddingVertical: 18, borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ color: '#666' }}>Proteínas</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 4 }}>{`${totalProtein} g`}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fff', marginHorizontal: 6, paddingVertical: 18, borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ color: '#666' }}>Carboidratos</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 4 }}>{`${totalCarbs} g`}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fff', marginHorizontal: 6, paddingVertical: 18, borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ color: '#666' }}>Calorias</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 4 }}>{`${totalCalories} kcal`}</Text>
        </View>
      </View>

      <TouchableOpacity style={{ marginTop: 20, backgroundColor: '#86efac', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
        onPress={() => (navigation as any).navigate('AddFood', { meal: 'Lanche' })}>
        <Text style={{ color: '#166534', fontSize: 16, fontWeight: '600' }}>Adicionar lanche</Text>
      </TouchableOpacity>

      <ScrollView style={{ marginTop: 24 }}>
        {/* Café */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <Text style={{ fontSize: 22, marginRight: 10 }}>☕</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600' }}>Café da manhã</Text>
            {renderMealItems('Café da manhã')}
          </View>
          <TouchableOpacity style={{ backgroundColor: '#16a34a', borderRadius: 20, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }} onPress={() => (navigation as any).navigate('AddFood', { meal: 'Café da manhã' })}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Almoço */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <Text style={{ fontSize: 22, marginRight: 10 }}>🍽️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600' }}>Almoço</Text>
            {renderMealItems('Almoço')}
          </View>
          <TouchableOpacity style={{ backgroundColor: '#16a34a', borderRadius: 20, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }} onPress={() => (navigation as any).navigate('AddFood', { meal: 'Almoço' })}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Janta */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <Text style={{ fontSize: 22, marginRight: 10 }}>🌙</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600' }}>Janta</Text>
            {renderMealItems('Janta')}
          </View>
          <TouchableOpacity style={{ backgroundColor: '#16a34a', borderRadius: 20, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }} onPress={() => (navigation as any).navigate('AddFood', { meal: 'Janta' })}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>+</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* botão temporário de reset (apenas para testes): remover posteriormente */}
      <TouchableOpacity style={{ marginTop: 12, backgroundColor: '#e74c3c', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }} onPress={handleResetMeals}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Resetar alimentos (teste)</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ---- AddFoodScreen (dentro do mesmo arquivo) ----
   O badge IG será mostrado aqui, ao lado do nome do alimento.
*/
export function AddFoodScreen({ navigation, route }: { navigation: any; route: any }) {
  const meal = route?.params?.meal ?? 'Refeição';
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [query, setQuery] = useState<string>('');

  const inc = (id: number) => setSelected(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  const dec = (id: number) => setSelected(prev => {
    const v = Math.max(0, (prev[id] ?? 0) - 1);
    if (v === 0) {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    }
    return { ...prev, [id]: v };
  });

  const totalSelected = Object.values(selected).reduce((s, n) => s + n, 0);

  const handleAdd = async () => {
    if (totalSelected === 0) return;
    const items: SavedMealItem[] = Object.entries(selected).map(([k, qty]) => {
      const id = Number(k);
      const f = SAMPLE_FOODS.find(x => x.id === id);
      return { id, name: f ? f.name : 'Item', qty };
    });

    const existing = await loadMealsForToday();
    const currentList = existing[meal] ?? [];
    existing[meal] = [...currentList, ...items];
    await saveMealsForToday(existing);

    Toast.show({ type: 'success', text1: 'Itens adicionados', text2: `Foram selecionados ${totalSelected} item(ns) para ${meal}.`, visibilityTime: 2500 });
    navigation.goBack();
  };

  const filteredFoods = SAMPLE_FOODS.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase()));

  const renderItem = ({ item }: { item: FoodItem }) => {
    const qty = selected[item.id] ?? 0;
    return (
      <View style={localStyles.foodRow}>
        <View style={{ flex: 1 }}>
          <View style={localStyles.nameRow}>
            <Text style={localStyles.foodName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
            {/* AQUI: badge IG aparece apenas nesta tela */}
            <GlycemicBadge level={item.glycemic} />
          </View>

          {item.description ? <Text style={localStyles.foodDesc}>{item.description}</Text> : null}

          <View style={localStyles.foodMeta}>
            <Text style={localStyles.foodMetaText}>Carbs: {item.carbs ?? 0}g</Text>
            <Text style={[localStyles.foodMetaText, { marginLeft: 10 }]}>Cal: {item.cal ?? 0}</Text>
          </View>
        </View>

        <View style={localStyles.qtyBox}>
          <Pressable onPress={() => dec(item.id)} style={localStyles.qtyBtn}><Text style={localStyles.qtyBtnText}>-</Text></Pressable>
          <Text style={localStyles.qtyValue}>{qty}</Text>
          <Pressable onPress={() => inc(item.id)} style={localStyles.qtyBtn}><Text style={localStyles.qtyBtnText}>+</Text></Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: '#fff' }]}>
      <View style={{ padding: 16, paddingTop: 20, flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>{`Adicionar alimentos - ${meal}`}</Text>
        <TextInput placeholder="Buscar alimentos..." style={localStyles.searchInput} value={query} onChangeText={setQuery} returnKeyType="search" />
        <Text style={{ marginTop: 12, marginBottom: 8, color: '#666' }}>Alimentos recomendados</Text>

        {filteredFoods.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}><Text style={{ color: '#999' }}>Nenhum alimento encontrado</Text></View>
        ) : (
          <FlatList
            data={filteredFoods}
            keyExtractor={(i) => String(i.id)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        )}

        <View style={localStyles.addBar}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{`Selecionados: ${totalSelected}`}</Text>
          <TouchableOpacity style={[localStyles.addBarBtn, { opacity: totalSelected > 0 ? 1 : 0.45 }]} onPress={handleAdd} disabled={totalSelected === 0}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Adicionar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ---- estilos locais usados pelo AddFood ---- */
const localStyles = StyleSheet.create({
  searchInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginTop: 8, backgroundColor: '#f7f7f7' },
  foodRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, elevation: 1 },
  foodName: { fontWeight: '700', flex: 1, fontSize: 15, marginRight: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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

/* ------------------------------------------------------
   Navegadores: HomeStack (Stack) + Tabs (Bottom)
   export default: Tabs (com HomeStack, Map e Profile)
   ------------------------------------------------------ */

const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />

      {/* A tela de adicionar alimentos agora mostra o header automaticamente */}
      <Stack.Screen
        name="AddFood"
        component={AddFoodScreen}
        options={{
          title: 'Adicionar alimentos',
          headerTintColor: '#000', // cor do ícone de voltar
          headerStyle: { backgroundColor: '#fff' },
        }}
      />
    </Stack.Navigator>
  );
}


const Tab = createBottomTabNavigator();
export default function Home(): JSX.Element {
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
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Mapa" component={MapScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
