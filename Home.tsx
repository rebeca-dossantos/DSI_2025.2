// Home.tsx
import React, { JSX, useEffect, useState, useCallback } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, Alert, ScrollView, FlatList, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import MapScreen from './Map';
import ProfileScreen from './Profile';
import FormularioDiagnostico from './Diagnostico';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { supabase } from './supabase';
import FavoritePlaces from './FavoritePlaces';

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

interface DailyNutrition {
  date: string;
  protein: number;
  carbs: number;
  calories: number;
}

const defaultGoals = {
  protein: 120,
  carbs: 220,
  calories: 1800,
  agua: 2500
};

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
  } catch (err) {
    console.warn('Erro salvando nutrição diária', err);
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
        entries.push({ date, protein: parsed.protein || 0, carbs: parsed.carbs || 0, calories: parsed.calories || 0 });
      } catch (e) {
        console.warn('Erro parse nutri diária', k, e);
      }
    }
    entries.sort((a, b) => a.date.localeCompare(b.date));
    return entries.slice(-7);
  } catch (err) {
    console.warn('Erro carregando histórico semanal', err);
    return [];
  }
}

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

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const weekDates: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const fmtKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const labels = weekDates.map(d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`);
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

    return (
      <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 18 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 6 }}>{label} - Semana</Text>
        <LineChart
          data={{ labels, datasets: [{ data: consumed, color: () => color, strokeWidth: 3 }, { data: goalLine, color: () => '#999', strokeWidth: 2, withDots: false }], legend: ['Consumido', 'Meta'] }}
          width={Dimensions.get('window').width - 64}
          height={200}
          fromZero
          yAxisSuffix={unit}
          chartConfig={{ backgroundColor: '#ffffff', backgroundGradientFrom: '#ffffff', backgroundGradientTo: '#ffffff', decimalPlaces: 0, color: (opacity = 1) => `rgba(0,0,0,${opacity})`, labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`, style: { borderRadius: 16 }, propsForDots: { r: '5', strokeWidth: '2', stroke: color } }}
          bezier
          style={{ borderRadius: 16, marginVertical: 8 }}
        />
        <Text style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
          Meta diária: {goalVal}{unit} • Média semana: {consumed.length > 0 ? Math.round((consumed.reduce((s, n) => s + n, 0) / consumed.length) * 10) / 10 : 0}{unit}
        </Text>
      </View>
    );
  }

  return <View style={{ marginTop: 8 }}>{buildChart('protein', '#3498db', 'Proteínas', 'g')}{buildChart('carbs', '#e74c3c', 'Carboidratos', 'g')}{buildChart('calories', '#f39c12', 'Calorias', 'kcal')}</View>;
};

function HydrationSection({ goal, onWaterChange }: { goal: number; onWaterChange?: () => void }) {
  
  const [currentWater, setCurrentWater] = useState(0);
  const cupSize = 250;
  
  // Pega a data de hoje no formato YYYY-MM-DD
  const getTodayDateStr = () => new Date().toISOString().split('T')[0];

  // 1. CARREGAR DO SUPABASE AO ABRIR
  useEffect(() => {
    const loadWater = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = getTodayDateStr();

        // Busca se já tem registro hoje
        const { data, error } = await supabase
          .from('hydration_logs')
          .select('amount_ml')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle(); // maybeSingle evita erro se não existir nada ainda

        if (data) {
          setCurrentWater(data.amount_ml);
        }
      } catch (error) {
        console.log('Erro ao carregar água:', error);
      }
    };

    loadWater();
  }, []);

  // 2. SALVAR NO SUPABASE (UPSERT)
  const updateWater = async (newValue: number) => {
    // Atualiza a tela IMEDIATAMENTE (UI Otimista) para não travar
    const finalValue = Math.max(0, newValue);
    setCurrentWater(finalValue);
    if (onWaterChange) onWaterChange();
    // Salva no banco em segundo plano
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = getTodayDateStr();

      const { error } = await supabase
        .from('hydration_logs')
        .upsert(
          { 
            user_id: user.id, 
            date: today, 
            amount_ml: finalValue 
          },
          { onConflict: 'user_id, date' }
        );

      if (error) console.log("Erro Supabase:", error);
      
    } catch (e) {
      console.warn("Erro de conexão:", e);
    }
  };

  const handleAdd = () => updateWater(currentWater + cupSize);
  const handleRemove = () => updateWater(currentWater - cupSize);

  // Calcula porcentagem (protege contra divisão por zero)
  const safeGoal = goal > 0 ? goal : 2500;
  const percentage = Math.min(100, Math.round((currentWater / safeGoal) * 100));

  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>Hidratação Diária</Text>
        <Text style={{ fontSize: 13, color: '#666' }}>Meta: {safeGoal}ml</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
        <TouchableOpacity 
          onPress={handleRemove}
          disabled={currentWater === 0}
          style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', opacity: currentWater === 0 ? 0.5 : 1 }}
        >
          <Ionicons name="remove" size={24} color="#64748b" />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <View style={{ marginBottom: 8 }}>
            <Ionicons 
              name={percentage >= 100 ? "water" : "water-outline"} 
              size={56} 
              color="#3b82f6" 
            />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#3b82f6' }}>
            {currentWater}<Text style={{ fontSize: 16, color: '#64748b' }}>ml</Text>
          </Text>
        </View>

        <TouchableOpacity 
          onPress={handleAdd}
          style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#bfdbfe' }}
        >
          <Ionicons name="add" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <View style={{ height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, marginTop: 20, overflow: 'hidden' }}>
        <View style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#3b82f6' }} />
      </View>
    </View>
  );
}

// --- COMPONENTE DE GRÁFICO DE ÁGUA (VISUAL UNIFICADO) ---
function WaterChartSection({goal, updateTrigger }: { goal: number; updateTrigger: number }) {
  const [data, setData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [days, setDays] = useState<string[]>(['', '', '', '', '', '', '']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWaterHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const datesToCheck = [];
        const displayDays = [];
        const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        // Pega os últimos 7 dias
        for (let i = 0; i < 7; i++) {
           // Ajuste para pegar na ordem correta (igual ao gráfico de macros que começa na semana)
           // Mas mantendo sua logica de historico:
           const d = new Date();
           d.setDate(d.getDate() - (6 - i)); // -6, -5, ... -0 (Hoje)
           
           const yyyy = d.getFullYear();
           const mm = String(d.getMonth() + 1).padStart(2, '0');
           const dd = String(d.getDate()).padStart(2, '0');
           datesToCheck.push(`${yyyy}-${mm}-${dd}`);
           
           // Formato DD/MM igual ao do macro
           displayDays.push(`${dd}/${mm}`);
        }
        setDays(displayDays);

        const { data: logs } = await supabase
          .from('hydration_logs')
          .select('date, amount_ml')
          .eq('user_id', user.id)
          .gte('date', datesToCheck[0])
          .lte('date', datesToCheck[6]);

        const finalAmounts = datesToCheck.map(dateStr => {
          const log = logs?.find(l => l.date === dateStr);
          return log ? log.amount_ml : 0;
        });

        setData(finalAmounts);
      } catch (e) {
        console.log("Erro gráfico água", e);
      } finally {
        setLoading(false);
      }
    };

    fetchWaterHistory();
  }, [updateTrigger]);

  const screenWidth = Dimensions.get('window').width;
  const chartColor = '#3b82f6'; // Azul padrão

  // Loading com o mesmo visual do outro
  if (loading) {
    return (
      <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 18 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Hidratação - Semana</Text>
        <Text style={{ color: '#666' }}>Carregando...</Text>
      </View>
    );
  }

  // Calcula a média para exibir no rodapé igual aos macros
  const average = data.length > 0 
    ? Math.round((data.reduce((a, b) => a + b, 0) / data.length) * 10) / 10 
    : 0;

  return (
    <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 18, marginBottom: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 6 }}>Hidratação - Semana</Text>
      
      <LineChart
        data={{
          labels: days,
          datasets: [
            {
              data: data,
              color: (opacity = 1) => chartColor,
              strokeWidth: 3, 
            },
            {
              // Linha de meta
              data: data.map(() => goal > 0 ? goal : 2000), 
              color: () => '#999', 
              strokeWidth: 2, 
              withDots: false,
              strokeDash: [5, 5] 
            } as any
          ],
          legend: ['Consumido', 'Meta'] // Adicionei legenda igual ao outro
        }}
        width={screenWidth - 64}
        height={200} // Altura padronizada para 200
        fromZero
        yAxisSuffix="ml"
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          // Cores pretas nos eixos igual ao do macro
          color: (opacity = 1) => `rgba(0,0,0,${opacity})`, 
          labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
          style: { borderRadius: 16 },
          // Bolinhas tamanho 5 igual ao do macro
          propsForDots: { r: '5', strokeWidth: '2', stroke: chartColor } 
        }}
        bezier
        style={{ borderRadius: 16, marginVertical: 8 }}
      />
      
      <Text style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
        Meta diária: {goal}ml • Média semana: {average}ml
      </Text>
    </View>
  );
}

const MonthlyChartsSection = ({ version, foods }: { version: number; foods: FoodItem[] }) => {
  const [monthlyData, setMonthlyData] = useState<{ month: string; protein: number; carbs: number; calories: number }[]>([]);
  const [goals, setGoals] = useState(defaultGoals);
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const storedGoals = await AsyncStorage.getItem('userGoals');
        if (storedGoals) {
          const userGoals = JSON.parse(storedGoals);
          setGoals(prev => ({
  ...prev,
  protein: userGoals.proteina || defaultGoals.protein,
  carbs: userGoals.carboidratos || defaultGoals.carbs,
  calories: userGoals.calorias || defaultGoals.calories
}));
        }

        // generate monthly data using current foods
        const keys = await AsyncStorage.getAllKeys();
        const mealKeys = keys.filter(key => key.startsWith('meals_'));
        const monthlyDataMap: Record<string, { protein: number; carbs: number; calories: number; days: number }> = {};

        for (const key of mealKeys) {
          const raw = await AsyncStorage.getItem(key);
          if (!raw) continue;
          const meals = JSON.parse(raw) as Record<string, SavedMealItem[]>;
          const dateStr = key.replace('meals_', '');
          const [year, month] = dateStr.split('-');
          const monthKey = `${year}-${month}`;
          let dayProtein = 0, dayCarbs = 0, dayCalories = 0;

          Object.values(meals).forEach(items => {
            items.forEach(it => {
              const food = foods.find(f => f.id === it.id);
              if (food) {
                const qty = it.qty ?? 1;
                dayProtein += (food.protein ?? 0) * qty;
                dayCarbs += (food.carbs ?? 0) * qty;
                dayCalories += (food.cal ?? 0) * qty;
              }
            });
          });

          if (!monthlyDataMap[monthKey]) monthlyDataMap[monthKey] = { protein: 0, carbs: 0, calories: 0, days: 0 };
          monthlyDataMap[monthKey].protein += dayProtein;
          monthlyDataMap[monthKey].carbs += dayCarbs;
          monthlyDataMap[monthKey].calories += dayCalories;
          monthlyDataMap[monthKey].days += 1;
        }

        const result = Object.entries(monthlyDataMap)
          .map(([month, data]) => ({ month, protein: data.days ? Math.round(data.protein / data.days) : 0, carbs: data.days ? Math.round(data.carbs / data.days) : 0, calories: data.days ? Math.round(data.calories / data.days) : 0 }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-6);

        setMonthlyData(result);
      } catch (err) {
        console.warn('Erro carregando dados mensais:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [version, foods]);

  const filteredData = monthlyData.slice(-parseInt(selectedPeriod));

  const MonthlyChart = ({ nutrient, color, label, unit }: { nutrient: 'protein' | 'carbs' | 'calories'; color: string; label: string; unit: string }) => {
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
              <TouchableOpacity key={period} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: selectedPeriod === period ? '#3498db' : 'transparent', borderRadius: 6 }} onPress={() => setSelectedPeriod(period)}>
                <Text style={{ color: selectedPeriod === period ? '#fff' : '#666', fontSize: 12 }}>{period}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: chartHeight }}>
          <LineChart data={{ labels, datasets: [{ data: data.length > 0 ? data : [0], color: () => color, strokeWidth: 3 }] }} width={Dimensions.get('window').width - 72} height={chartHeight} chartConfig={{ backgroundColor: '#ffffff', backgroundGradientFrom: '#ffffff', backgroundGradientTo: '#ffffff', decimalPlaces: 0, color: (opacity = 1) => color, labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, style: { borderRadius: 16 }, propsForDots: { r: '5', strokeWidth: '2', stroke: color } }} bezier style={{ borderRadius: 16 }} withVerticalLines={false} withHorizontalLines={true} fromZero />
          <View style={{ position: 'absolute', left: 0, right: 0, top: goalPosition, borderTopWidth: 2, borderTopColor: '#666', borderStyle: 'dashed' }} />
          <View style={{ position: 'absolute', right: 8, top: goalPosition - 10, backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#ddd' }}>
            <Text style={{ fontSize: 10, color: '#666', fontWeight: '600' }}>Meta: {goal}{unit}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (<View><MonthlyChart nutrient="protein" color="#3498db" label="Proteínas" unit="g" /><MonthlyChart nutrient="carbs" color="#e74c3c" label="Carboidratos" unit="g" /><MonthlyChart nutrient="calories" color="#f39c12" label="Calorias" unit="kcal" /></View>);
};


function HomeScreen({ navigation, route, foods }: { navigation: any; route: any; foods: FoodItem[] }) {
  const userEmail = route?.params?.userEmail ?? 'Usuário';
  const [meals, setMeals] = useState<Record<string, SavedMealItem[]>>({});
  const [totalProtein, setTotalProtein] = useState<number>(0);
  const [totalCarbs, setTotalCarbs] = useState<number>(0);
  const [totalCalories, setTotalCalories] = useState<number>(0);
  const [goals, setGoals] = useState(defaultGoals);
  const [chartsVersion, setChartsVersion] = useState(0);
  const [weeklyData, setWeeklyData] = useState<DailyNutrition[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [waterTrigger, setWaterTrigger] = useState(0);

  const refreshCharts = () => setChartsVersion(prev => prev + 1);

  // --- FAVORITES CRUD (Supabase) ---
  // inside HomeScreen (substituir loadFavorites)
  const loadFavorites = useCallback(async () => {
    try {
    // get user (supabase-js v2)
      let userId: string | null = null;
      try {
        const maybeUser = await supabase.auth.getUser();
        userId = maybeUser?.data?.user?.id ?? null;
      } catch (e) {
      // fallback para clientes antigos
      // @ts-ignore
        userId = supabase.auth?.user?.id ?? null;
      }

      let query = supabase.from('favorites').select('food_id');
      if (userId) query = query.eq('user_id', userId); // filtra por usuário quando aplicável
      const { data, error } = await query;

      if (error) {
        console.warn('Erro carregando favoritos:', error);
        return;
      }
      const ids = (data || []).map((r: any) => Number(r.food_id)).filter((n: number) => !Number.isNaN(n));
      setFavoriteIds(new Set(ids));
    } catch (err) {
      console.warn('Falha ao carregar favoritos:', err);
    }
  }, []);


  const toggleFavorite = useCallback(async (foodId: number) => {
    const isFav = favoriteIds.has(foodId);
    try {
      if (isFav) {
        const { error } = await supabase.from('favorites').delete().match({ food_id: foodId });
        if (error) throw error;
        setFavoriteIds(prev => {
          const s = new Set(prev);
          s.delete(foodId);
          return s;
        });
        Toast.show({ type: 'success', text1: 'Removido dos favoritos' });
      } else {
        const { data, error } = await supabase.from('favorites').insert([{ food_id: foodId }]).select().limit(1);
        if (error) throw error;
        setFavoriteIds(prev => {
          const s = new Set(prev);
          s.add(foodId);
          return s;
        });
        Toast.show({ type: 'success', text1: 'Adicionado aos favoritos' });
      }
    } catch (err: any) {
      console.warn('Erro toggleFavorite:', err);
      Toast.show({ type: 'error', text1: 'Erro', text2: String(err.message ?? err) });
    }
  }, [favoriteIds]);

  useEffect(() => {
    const computeTotals = async (mealsSaved: Record<string, SavedMealItem[]>) => {
      let p = 0, c = 0, cal = 0;
      Object.values(mealsSaved).forEach(items => items.forEach(it => {
        const food = foods.find(f => f.id === it.id);
        if (!food) {
          console.warn(`computeTotals: alimento id ${it.id} não encontrado em foods`);
          return;
        }
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

      const stats = { proteina: totalP, carboidrato: totalC, calorias: totalCal, dias: 12, peso: 70, altura: 170 };
      try {
        await AsyncStorage.setItem('userStats', JSON.stringify(stats));
        const today = formatDate(new Date());
        await saveDailyNutrition(today, { protein: totalP, carbs: totalC, calories: totalCal });
      } catch (err) {
        console.warn('Erro salvando userStats/nutri diária:', err);
      }
    };

    const loadAndCompute = async () => {
      const data = await loadMealsForToday();
      setMeals(data);
      await computeTotals(data);
      try {
        const storedGoals = await AsyncStorage.getItem('userGoals');
        if (storedGoals) {
          const parsed = JSON.parse(storedGoals);
          setGoals(prev => ({
            ...prev,
            calories: parsed.calorias ?? prev.calories,
            protein: parsed.proteina ?? prev.protein,
            carbs: parsed.carboidratos ?? prev.carbs,
            agua: parsed.agua ?? prev.agua // Água é igual nos dois
          }));
        }
      } catch (e) { console.warn(e); }
      const week = await loadWeeklyNutrition();
      setWeeklyData(week);
      refreshCharts();
    };

    const unsub = navigation.addListener('focus', loadAndCompute);
    loadAndCompute();
    return unsub;
  }, [navigation, foods]);
  useEffect(() => {
    const mountedRef = { current: true };
    (async () => {
      if (mountedRef.current) {
        await loadFavorites();
      }
    })();
    return () => { mountedRef.current = false; };
  }, [loadFavorites, foods]);

  function joinAndTruncate(names: string[], maxChars = 36) {
    const joined = names.join(' • ');
    if (joined.length <= maxChars) return joined;
    return joined.slice(0, maxChars - 3) + '...';
  }

  const renderMealItems = (mealName: string) => {
    const items = meals[mealName] ?? [];
    if (items.length === 0) return <Text style={{ color: '#666' }}>Nenhum alimento ainda</Text>;
    const names = items.map(it => {
      const food = foods.find(f => f.id === it.id);
      const displayName = food ? food.name : it.name ?? 'Item';
      return it.qty && it.qty > 1 ? `${displayName} x${it.qty}` : displayName;
    });
    return <Text style={{ color: '#666', marginTop: 4 }}>{joinAndTruncate(names, 36)}</Text>;
  };

  const handleResetMeals = () => {
    Alert.alert('Confirmar reset', 'Deseja limpar todas as refeições salvas de hoje? (teste)', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: async () => {
          try {
            await AsyncStorage.removeItem(todayKey());
            setMeals({});
            setTotalProtein(0);
            setTotalCarbs(0);
            setTotalCalories(0);
            const stats = { proteina: totalProtein, carboidrato: totalCarbs, calorias: totalCalories, dias: 12, peso: 70, altura: 170 };
            await AsyncStorage.setItem('userStats', JSON.stringify(stats));
            Toast.show({ type: 'success', text1: 'Reset realizado', text2: 'As refeições de hoje foram removidas.', visibilityTime: 2500 });
          } catch (err) {
            console.warn('Erro ao resetar refeições', err);
            Toast.show({ type: 'error', text1: 'Erro', text2: 'Não foi possível resetar os dados.', visibilityTime: 2500 });
          }
      }}
    ], { cancelable: true });
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 20 }}>Hoje</Text>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Totals */}
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

        <TouchableOpacity style={{ marginTop: 20, backgroundColor: '#86efac', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }} onPress={() => (navigation as any).navigate('AddFood', { meal: 'Lanche' })}>
          <Text style={{ color: '#166534', fontSize: 16, fontWeight: '600' }}>Adicionar lanche</Text>
        </TouchableOpacity>

        {/* Meals */}
        <View style={{ marginTop: 24 }}>
          {/* Cafe */}
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

          {/* Almoco */}
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

        {/* Hidratação*/}
        <HydrationSection goal={(goals as any).agua || 2500} 
        onWaterChange={() => setWaterTrigger(t => t + 1)}/>

        {/* Charts */}
        <WeeklyChartsSection version={chartsVersion} goals={goals} />

        <WaterChartSection goal={goals.agua || 2500} 
        updateTrigger={waterTrigger}/>

        <TouchableOpacity style={{ marginTop: 20, backgroundColor: '#e74c3c', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }} onPress={handleResetMeals}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Resetar alimentos (teste)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// AddFoodScreen
export function AddFoodScreen({ navigation, route, foods }: { navigation: any; route: any; foods: FoodItem[] }) {
  const meal = route?.params?.meal ?? 'Refeição';
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [query, setQuery] = useState<string>('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [favoriteIdsLocal, setFavoriteIdsLocal] = useState<Set<number>>(new Set());

  // no topo do AddFoodScreen component
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        // obter user id se houver
        let userId: string | null = null;
        try {
          const maybeUser = await supabase.auth.getUser();
          userId = maybeUser?.data?.user?.id ?? null;
        } catch (e) {
          // fallback
          // @ts-ignore
          userId = supabase.auth?.user?.id ?? null;
        }

        let q = supabase.from('favorites').select('food_id');
        if (userId) q = q.eq('user_id', userId);
        const { data, error } = await q;
        if (error) {
          console.warn('Erro carregando favoritos (AddFood):', error);
          return;
        }
        if (!mounted) return;
        const ids = (data || []).map((r: any) => Number(r.food_id)).filter((n: number) => !Number.isNaN(n));
        setFavoriteIdsLocal(new Set(ids));
      } catch (err) {
        console.warn('Erro carregando favoritos (AddFood):', err);
      }
    };

  // load initially
    load();

  // reload quando a tela ganha foco (importante)
    const unsub = navigation.addListener?.('focus', load);

    return () => {
      mounted = false;
      if (unsub) unsub();
    };
  }, [navigation]);


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
      const f = foods.find(x => x.id === id);
      return { id, name: f ? f.name : 'Item', qty };
    });

    const existing = await loadMealsForToday();
    const currentList = existing[meal] ?? [];
    existing[meal] = [...currentList, ...items];
    await saveMealsForToday(existing);

    Toast.show({ type: 'success', text1: 'Itens adicionados', text2: `Foram selecionados ${totalSelected} item(ns) para ${meal}.`, visibilityTime: 2500 });
    navigation.goBack();
  };

  const filteredFoods = (favoriteOnly ? foods.filter(f => favoriteIdsLocal.has(f.id)) : foods).filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase()));

  const toggleFavoriteLocal = async (foodId: number) => {
    // pega userId se necessário
    let userId: string | null = null;
    try {
      const maybeUser = await supabase.auth.getUser();
      userId = maybeUser?.data?.user?.id ?? null;
    } catch (e) {
      // @ts-ignore
      userId = supabase.auth?.user?.id ?? null;
    }

    const isFav = favoriteIdsLocal.has(foodId);
    try {
      if (isFav) {
        // delete - inclua user_id se aplicável
        let q = supabase.from('favorites').delete();
        if (userId) q = q.match({ food_id: foodId, user_id: userId });
        else q = q.match({ food_id: foodId });
        const { error } = await q;
        if (error) throw error;

        // recarrega do servidor para garantir consistência
        const reloadQuery = userId ? supabase.from('favorites').select('food_id').eq('user_id', userId) : supabase.from('favorites').select('food_id');
        const { data } = await reloadQuery;
        const ids = (data || []).map((r: any) => Number(r.food_id)).filter((n: number) => !Number.isNaN(n));
        setFavoriteIdsLocal(new Set(ids));
        Toast.show({ type: 'success', text1: 'Removido dos favoritos' });
      } else {
        // insert - inclua user_id se aplicável
        const payload: any = { food_id: foodId };
        if (userId) payload.user_id = userId;
        const { data, error } = await supabase.from('favorites').insert([payload]).select().limit(1);
        if (error) throw error;

        // recarrega do servidor para garantir consistência
        const reloadQuery = userId ? supabase.from('favorites').select('food_id').eq('user_id', userId) : supabase.from('favorites').select('food_id');
        const { data: after } = await reloadQuery;
        const ids = (after || []).map((r: any) => Number(r.food_id)).filter((n: number) => !Number.isNaN(n));
        setFavoriteIdsLocal(new Set(ids));
        Toast.show({ type: 'success', text1: 'Adicionado aos favoritos' });
      }
    } catch (err: any) {
      console.warn('Erro toggleFavoriteLocal', err);
      Toast.show({ type: 'error', text1: 'Erro ao atualizar favorito', text2: String(err.message ?? err) });
    }
  };


  const renderItem = ({ item }: { item: FoodItem }) => {
    const qty = selected[item.id] ?? 0;
    const isFav = favoriteIdsLocal.has(item.id);
    return (
      <View style={localStyles.foodRow}>
        <View style={{ flex: 1 }}>
          <View style={localStyles.nameRow}>
            <Text style={localStyles.foodName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => toggleFavoriteLocal(item.id)} style={{ marginRight: 8 }}>
                <Ionicons name={isFav ? 'star' : 'star-outline'} size={18} color={isFav ? '#f1c40f' : '#999'} />
              </TouchableOpacity>
              <GlycemicBadge level={item.glycemic} />
            </View>
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

        <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity style={{ borderRadius: 8, borderWidth: 1, borderColor: '#16a34a', paddingVertical: 10, paddingHorizontal: 12 }} onPress={() => navigation.navigate('CreateFood')}>
            <Text style={{ color: '#16a34a', fontWeight: '700' }}>+ Criar Novo Alimento</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ padding: 8 }} onPress={() => setFavoriteOnly(prev => !prev)}>
            <Text style={{ color: favoriteOnly ? '#f1c40f' : '#666', fontWeight: '700' }}>{favoriteOnly ? 'Mostrando Favoritos' : 'Mostrar Favoritos'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ marginTop: 12, marginBottom: 8, color: '#666' }}>Alimentos recomendados</Text>

        {filteredFoods.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}><Text style={{ color: '#999' }}>Nenhum alimento encontrado</Text></View>
        ) : (
          <FlatList data={filteredFoods} keyExtractor={(i) => String(i.id)} renderItem={renderItem} ItemSeparatorComponent={() => <View style={{ height: 12 }} />} contentContainerStyle={{ paddingBottom: 120 }} />
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

export function CreateFoodScreen({ navigation, route, onCreated }: { navigation: any; route: any; onCreated?: (f: FoodItem) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [carbs, setCarbs] = useState('');
  const [cal, setCal] = useState('');
  const [protein, setProtein] = useState('');
  const [glycemic, setGlycemic] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Nome obrigatório', text2: 'Informe o nome do alimento', visibilityTime: 2500 });
      return;
    }

    setLoading(true);
    try {
      const { data: maxRow, error: maxErr } = await supabase
        .from('foods')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

      if (maxErr) {
        console.warn('Erro ao buscar max id:', maxErr);
      }

      const maxId = Array.isArray(maxRow) && maxRow.length > 0 && typeof maxRow[0].id === 'number' ? maxRow[0].id : 0;
      const nextId = maxId + 1;

      const payload: any = {
        id: nextId,
        name: name.trim(),
        description: description.trim() || null,
        carbs: carbs ? Number(carbs) : null,
        cal: cal ? Number(cal) : null,
        protein: protein ? Number(protein) : null,
        glycemic: glycemic ? glycemic.trim() : null
      };

      const { data, error } = await supabase.from('foods').insert([payload]).select().limit(1);

      if (error) {
        console.warn('Erro insert food:', error);
        Toast.show({ type: 'error', text1: 'Erro ao criar alimento', text2: String(error.message ?? error), visibilityTime: 3000 });
      } else if (data && Array.isArray(data) && data[0]) {
        const newFood = data[0] as FoodItem;
        Toast.show({ type: 'success', text1: 'Alimento criado', text2: `${newFood.name} adicionado com sucesso.`, visibilityTime: 2500 });

        if (typeof onCreated === 'function') {
          onCreated(newFood);
        }
        navigation.goBack();
      } else {
        Toast.show({ type: 'error', text1: 'Erro desconhecido', visibilityTime: 2500 });
      }
    } catch (err: any) {
      console.warn('Erro criando alimento:', err);
      Toast.show({ type: 'error', text1: 'Erro', text2: String(err.message ?? err), visibilityTime: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Criar Novo Alimento</Text>

        <TextInput placeholder="Nome do alimento" style={localStyles.input} value={name} onChangeText={setName} />
        <TextInput placeholder="Descrição / Porção (ex: Cereais • 30g)" style={localStyles.input} value={description} onChangeText={setDescription} />
        <TextInput placeholder="Carboidratos (g)" style={localStyles.input} value={carbs} onChangeText={setCarbs} keyboardType="numeric" />
        <TextInput placeholder="Calorias (kcal)" style={localStyles.input} value={cal} onChangeText={setCal} keyboardType="numeric" />
        <TextInput placeholder="Proteína (g)" style={localStyles.input} value={protein} onChangeText={setProtein} keyboardType="numeric" />
        <TextInput placeholder="Índice Glicêmico (ex: IG Baixo)" style={localStyles.input} value={glycemic} onChangeText={setGlycemic} />

        <TouchableOpacity style={{ backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 10, marginTop: 12, alignItems: 'center' }} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Salvar alimento</Text>}
        </TouchableOpacity>
      </ScrollView>
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

  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginTop: 8, backgroundColor: '#fff' },
});

const Stack = createNativeStackNavigator();

function HomeStack({ foods, setFoods }: { foods: FoodItem[]; setFoods: React.Dispatch<React.SetStateAction<FoodItem[]>> }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" options={{ headerShown: false }}>
        {props => <HomeScreen {...props} foods={foods} />}
      </Stack.Screen>

      <Stack.Screen name="AddFood" options={{ title: 'Adicionar alimentos', headerTintColor: '#000', headerStyle: { backgroundColor: '#fff' } }}>
        {props => <AddFoodScreen {...props} foods={foods} />}
      </Stack.Screen>

      <Stack.Screen name="CreateFood" options={{ title: 'Criar Novo Alimento', headerTintColor: '#000', headerStyle: { backgroundColor: '#fff' } }}>
        {props =>
          <CreateFoodScreen
            {...props}
            onCreated={(newFood: FoodItem) => {
              setFoods((prev: FoodItem[]) => {
                const merged = [...prev, newFood];
                merged.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
                return merged;
              });
              (async () => {
                try {
                  const { data } = await supabase.from('favorites').select('food_id');
                  if (data) {
                  }
                } catch (e) { /* ignore */ }
              })();
            }}
          />
        }
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function MapStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MapMain"
        component={MapScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="FavoritePlaces"
        component={FavoritePlaces}
        options={{
          title: 'Favoritos',
          headerTintColor: '#000',
          headerStyle: { backgroundColor: '#fff' },
        }}
      />
    </Stack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export default function Home(): JSX.Element {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(true);

  const fetchFoods = async (mountedRef = { current: true }) => {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('id, name, description, carbs, protein, cal, glycemic')
        .order('name', { ascending: true });

      if (error) {
        console.warn('Erro buscando foods no Supabase:', error);
        Toast.show({ type: 'error', text1: 'Erro ao buscar alimentos', text2: String(error.message ?? error), visibilityTime: 3000 });
        if (mountedRef.current) setFoods([]);
      } else if (data && Array.isArray(data)) {
        if (mountedRef.current) setFoods(data as FoodItem[]);
      } else {
        if (mountedRef.current) setFoods([]);
      }
    } catch (err: any) {
      console.warn('Erro ao buscar foods:', err);
      Toast.show({ type: 'error', text1: 'Erro ao buscar alimentos', text2: String(err.message ?? err), visibilityTime: 3000 });
      setFoods([]);
    } finally {
      if (mountedRef.current) setLoadingFoods(false);
    }
  };

  useEffect(() => {
    const mountedRef = { current: true };
    fetchFoods(mountedRef);
    return () => { mountedRef.current = false; };
  }, []);

  const handleFoodCreated = (newFood: FoodItem) => {
    setFoods(prev => {
      const merged = [...prev, newFood];
      merged.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
      return merged;
    });
  };

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
          if (route.name === 'Diagnóstico') icon = 'medical';
          return <Ionicons name={icon as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home">
        {() => <HomeStack foods={foods} setFoods={setFoods} />}
      </Tab.Screen>
      <Tab.Screen name="Diagnóstico" component={FormularioDiagnostico} />
      <Tab.Screen name="Mapa" component={MapStack} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
