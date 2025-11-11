// Home.tsx
import React, { JSX, useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, Alert, ScrollView, FlatList, Pressable, TextInput, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import MapScreen from './Map';
import ProfileScreen from './Profile';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

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

// Tipos para dados históricos
interface DailyNutrition {
  date: string; // YYYY-MM-DD
  protein: number;
  carbs: number;
  calories: number;
}
interface MonthlyNutrition {
  month: string;
  protein: number;
  carbs: number;
  calories: number;
}

const generateMonthlyData = async (): Promise<MonthlyNutrition[]> => {
  try {
    console.log('📊 Buscando dados reais para gráficos...');
    
    const keys = await AsyncStorage.getAllKeys();
    const mealKeys = keys.filter(key => key.startsWith('meals_'));
    
    console.log('🗂️ Chaves encontradas:', mealKeys);
    
    const monthlyData: Record<string, { protein: number; carbs: number; calories: number; days: number }> = {};

    for (const key of mealKeys) {
      try {
        const rawData = await AsyncStorage.getItem(key);
        if (rawData) {
          const meals = JSON.parse(rawData) as Record<string, SavedMealItem[]>;
          
          const dateStr = key.replace('meals_', '');
          const [year, month] = dateStr.split('-');
          const monthKey = `${year}-${month}`;
          
          // Corrigido: Inicializar valores do dia
          let dayProtein = 0;
          let dayCarbs = 0;
          let dayCalories = 0;
          
          // Corrigido: Cálculo dos totais
          Object.values(meals).forEach(items => {
            items.forEach(it => {
              const food = SAMPLE_FOODS.find(f => f.id === it.id);
              if (food) {
                const qty = it.qty ?? 1;
                dayProtein += (food.protein ?? 0) * qty;
                dayCarbs += (food.carbs ?? 0) * qty;
                dayCalories += (food.cal ?? 0) * qty; // Corrigido: era dayCarbs += food.cal
              }
            });
          });
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { protein: 0, carbs: 0, calories: 0, days: 0 };
          }
          
          monthlyData[monthKey].protein += dayProtein;
          monthlyData[monthKey].carbs += dayCarbs;
          monthlyData[monthKey].calories += dayCalories;
          monthlyData[monthKey].days += 1;
        }
      } catch (err) {
        console.warn(`Erro processando chave ${key}:`, err);
      }
    }
    
    // Calcular médias mensais
    const result: MonthlyNutrition[] = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        protein: Math.round(data.protein / data.days),
        carbs: Math.round(data.carbs / data.days),
        calories: Math.round(data.calories / data.days)
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
    
    console.log('📈 Dados mensais calculados:', result);
    return result;
    
  } catch (err) {
    console.error('❌ Erro grave ao carregar dados mensais:', err);
    return [];
  }
};

// Metas padrão (serão substituídas pelas do usuário)
const defaultGoals = {
  protein: 120,
  carbs: 220,
  calories: 1800
};

// >>> CORREÇÃO: Mover funções para ANTES do componente HomeScreen
const DAILY_NUTRI_PREFIX = 'nutri_';

function formatDate(d: Date): string {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

async function saveDailyNutrition(dateStr: string, totals: { protein: number; carbs: number; calories: number }) {
  try {
    const key = `${DAILY_NUTRI_PREFIX}${dateStr}`;
    await AsyncStorage.setItem(key, JSON.stringify(totals));
    console.log(`✅ Salvou nutrição diária para ${dateStr}:`, totals);
  } catch (err) {
    console.warn('❌ Erro salvando nutrição diária', err);
  }
}

async function loadWeeklyNutrition(): Promise<DailyNutrition[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const nutriKeys = keys.filter(k => k.startsWith(DAILY_NUTRI_PREFIX));
    const entries: DailyNutrition[] = [];
    
    for (const k of nutriKeys) {
      const raw = await AsyncStorage.getItem(k);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as { protein: number; carbs: number; calories: number };
        const date = k.replace(DAILY_NUTRI_PREFIX, '');
        entries.push({
          date,
          protein: parsed.protein || 0,
          carbs: parsed.carbs || 0,
          calories: parsed.calories || 0,
        });
      } catch (e) {
        console.warn('Erro parse nutri diária', k, e);
      }
    }
    
    // Ordenar por data e pegar últimos 7 dias
    entries.sort((a, b) => a.date.localeCompare(b.date));
    const last7 = entries.slice(-7);
    console.log('📊 Dados semanais carregados:', last7);
    return last7;
  } catch (err) {
    console.warn('❌ Erro carregando histórico semanal', err);
    return [];
  }
}

// >>> CORREÇÃO: Mover componente WeeklyChartsSection para ANTES do HomeScreen
const WeeklyChartsSection = ({ version, goals }: { version: number; goals: { protein: number; carbs: number; calories: number } }) => {
  const [weekData, setWeekData] = useState<DailyNutrition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWeek = async () => {
      setLoading(true);
      const data = await loadWeeklyNutrition();
      setWeekData(data);
      setLoading(false);
    };
    loadWeek();
  }, [version]);

  // Datas da semana atual (domingo -> sábado)
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(today.getDate() - today.getDay()); // 0 = domingo

  const weekDates: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const fmtKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const labels = weekDates.map(
    d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
  );

  const dataByDate = new Map(weekData.map(d => [d.date, d]));

  function buildChart(nutrient: 'protein' | 'carbs' | 'calories', color: string, label: string, unit: string) {
    if (loading) {
      return (
        <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 18 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>{label} - Semana</Text>
          <Text style={{ color: '#666' }}>Carregando...</Text>
        </View>
      );
    }

    const consumed = weekDates.map(d => {
      const entry = dataByDate.get(fmtKey(d));
      return entry ? entry[nutrient] : 0;
    });

    const goalVal = goals[nutrient];
    const goalLine = Array(7).fill(goalVal);
    const maxVal = Math.max(goalVal, ...consumed) * 1.15;

    return (
      <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 18 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 6 }}>{label} - Semana</Text>
        <LineChart
          data={{
            labels,
            datasets: [
              {
                data: consumed,
                color: () => color,
                strokeWidth: 3,
              },
              {
                data: goalLine,
                color: () => '#999',
                strokeWidth: 2,
                withDots: false,
              },
            ],
            legend: ['Consumido', 'Meta'],
          }}
          width={Dimensions.get('window').width - 64}
          height={200}
          fromZero
          yAxisSuffix={unit}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: '5', strokeWidth: '2', stroke: color },
          }}
          bezier
          style={{ borderRadius: 16, marginVertical: 8 }}
        />
        <Text style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
          Meta diária: {goalVal}{unit} • Média semana: {consumed.length > 0 ? Math.round((consumed.reduce((s, n) => s + n, 0) / consumed.length) * 10) / 10 : 0}{unit}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 8 }}>
      {buildChart('protein', '#3498db', 'Proteínas', 'g')}
      {buildChart('carbs', '#e74c3c', 'Carboidratos', 'g')}
      {buildChart('calories', '#f39c12', 'Calorias', 'kcal')}
    </View>
  );
};

// Extraído: MonthlyChartsSection movido para nível superior para evitar redefinição de HomeScreen duplicada
const MonthlyChartsSection = ({ version }: { version: number }) => {
  const [monthlyData, setMonthlyData] = useState<MonthlyNutrition[]>([]);
  const [goals, setGoals] = useState(defaultGoals);
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 MonthlyChartsSection: Recarregando dados...');
    const loadData = async () => {
      setLoading(true);
      try {
        const storedGoals = await AsyncStorage.getItem('userGoals');
        if (storedGoals) {
          const userGoals = JSON.parse(storedGoals);
            setGoals({
              protein: userGoals.proteina || defaultGoals.protein,
              carbs: userGoals.carboidratos || defaultGoals.carbs,
              calories: userGoals.calorias || defaultGoals.calories
            });
        }
        const realData = await generateMonthlyData();
        setMonthlyData(realData);
      } catch (err) {
        console.warn('Erro carregando dados mensais:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [version]);

  const filteredData = monthlyData.slice(-parseInt(selectedPeriod));

  const MonthlyChart = ({ nutrient, color, label, unit }: { 
    nutrient: 'protein' | 'carbs' | 'calories', 
    color: string, 
    label: string, 
    unit: string 
  }) => {
    if (loading) {
      return (
        <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>{label} - Mensal</Text>
          <Text>Carregando dados...</Text>
        </View>
      );
    }

    if (filteredData.length === 0) {
      return (
        <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>{label} - Mensal</Text>
          <Text style={{ color: '#666' }}>Nenhum dado histórico encontrado</Text>
          <Text style={{ color: '#666', fontSize: 12, marginTop: 8 }}>Adicione refeições para ver o histórico</Text>
        </View>
      );
    }

    const labels = filteredData.map(item => {
      const [year, month] = item.month.split('-');
      return `${month}/${year.slice(2)}`;
    });

    const data = filteredData.map(item => item[nutrient]);
    const goal = goals[nutrient];
    const maxValue = Math.max(...data, goal) * 1.1;
    const chartHeight = 200;
    const goalPosition = chartHeight - (goal / maxValue) * chartHeight;

    return (
      <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>{label} - Mensal</Text>
          <View style={{ flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8 }}>
            {['6m', '3m', '1m'].map(period => (
              <TouchableOpacity
                key={period}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: selectedPeriod === period ? '#3498db' : 'transparent',
                  borderRadius: 6
                }}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={{ color: selectedPeriod === period ? '#fff' : '#666', fontSize: 12 }}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: chartHeight }}>
          <LineChart
            data={{
              labels,
              datasets: [{ 
                data: data.length > 0 ? data : [0],
                color: () => color,
                strokeWidth: 3 
              }],
            }}
            width={Dimensions.get('window').width - 72}
            height={chartHeight}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => color,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: '5', strokeWidth: '2', stroke: color },
            }}
            bezier
            style={{ borderRadius: 16 }}
            withVerticalLines={false}
            withHorizontalLines={true}
            fromZero
          />
          <View style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: goalPosition,
            borderTopWidth: 2,
            borderTopColor: '#666',
            borderStyle: 'dashed'
          }} />
          <View style={{
            position: 'absolute',
            right: 8,
            top: goalPosition - 10,
            backgroundColor: '#fff',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: '#ddd'
          }}>
            <Text style={{ fontSize: 10, color: '#666', fontWeight: '600' }}>
              Meta: {goal}{unit}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View>
      <MonthlyChart nutrient="protein" color="#3498db" label="Proteínas" unit="g" />
      <MonthlyChart nutrient="carbs" color="#e74c3c" label="Carboidratos" unit="g" />
      <MonthlyChart nutrient="calories" color="#f39c12" label="Calorias" unit="kcal" />
    </View>
  );
};

function HomeScreen({ navigation, route }: { navigation: any; route: any }) {
  const userEmail = route?.params?.userEmail ?? 'Usuário';

  const [meals, setMeals] = useState<Record<string, SavedMealItem[]>>({});
  const [totalProtein, setTotalProtein] = useState<number>(0);
  const [totalCarbs, setTotalCarbs] = useState<number>(0);
  const [totalCalories, setTotalCalories] = useState<number>(0);
  const [historicalData, setHistoricalData] = useState<DailyNutrition[]>([]);
  const [goals, setGoals] = useState(defaultGoals);

  const [chartsVersion, setChartsVersion] = useState(0);
  const [weeklyData, setWeeklyData] = useState<DailyNutrition[]>([]);

  const refreshCharts = () => {
    setChartsVersion(prev => prev + 1);
    console.log('🔄 Forçando atualização dos gráficos...');
  };

  useEffect(() => {
  const computeTotals = async (mealsSaved: Record<string, SavedMealItem[]>) => {
    let p = 0; 
    let c = 0; 
    let cal = 0;

    Object.values(mealsSaved).forEach(items => items.forEach(it => {
      const food = SAMPLE_FOODS.find(f => f.id === it.id);
      if (!food) return;
      const qty = it.qty ?? 1;
      p += (food.protein ?? 0) * qty;
      c += (food.carbs ?? 0) * qty;
      cal += (food.cal ?? 0) * qty;
    }));

    const totalP = Math.round(p * 10) / 10;
    const totalC = Math.round(c * 10) / 10;
    const totalCal = Math.round(cal);

    setTotalProtein(totalP);
    setTotalCarbs(totalC);
    setTotalCalories(totalCal);

    const stats = {
      proteina: totalP,
      carboidrato: totalC,
      calorias: totalCal,
      dias: 12,
      peso: 70,
      altura: 170,
    };

    try {
      await AsyncStorage.setItem('userStats', JSON.stringify(stats));
      
      const today = formatDate(new Date());
      await saveDailyNutrition(today, {
        protein: totalP,
        carbs: totalC,
        calories: totalCal,
      });
      
      console.log('✅ Totais salvos:', { totalP, totalC, totalCal });
    } catch (err) {
      console.warn('❌ Erro salvando userStats/nutri diária:', err);
    }
  };

  const loadAndCompute = async () => {
    const data = await loadMealsForToday();
    setMeals(data);
    await computeTotals(data);

    const week = await loadWeeklyNutrition();
    setWeeklyData(week);

    console.log('🔄 Recarregando dados...');
    console.log('📅 Refeições hoje:', data);
    console.log('📊 Totais:', { totalProtein, totalCarbs, totalCalories });

    refreshCharts();
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
              const stats = {
                proteina: totalProtein,
                carboidrato: totalCarbs,
                calorias: totalCalories,
                dias: 12,
                peso: 70,
                altura: 170,
              };
            await AsyncStorage.setItem('userStats', JSON.stringify(stats));
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

    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* Cards de totais */}
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

      {/* Botão adicionar lanche */}
      <TouchableOpacity style={{ marginTop: 20, backgroundColor: '#86efac', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
        onPress={() => (navigation as any).navigate('AddFood', { meal: 'Lanche' })}>
        <Text style={{ color: '#166534', fontSize: 16, fontWeight: '600' }}>Adicionar lanche</Text>
      </TouchableOpacity>

      {/* Refeições */}
      <View style={{ marginTop: 24 }}>
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
      </View>

      {/* >>> Gráficos semanais */}
      <WeeklyChartsSection version={chartsVersion} goals={goals} />

      {/* Botão de reset */}
      <TouchableOpacity style={{ marginTop: 20, backgroundColor: '#e74c3c', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }} onPress={handleResetMeals}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Resetar alimentos (teste)</Text>
      </TouchableOpacity>
    </ScrollView>
  </SafeAreaView>
);
}

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

const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="AddFood"
        component={AddFoodScreen}
        options={{
          title: 'Adicionar alimentos',
          headerTintColor: '#000',
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
