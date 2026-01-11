import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { fetchFavoriteRows, removeFavorite, FavoritePlaceRow } from './favorites';

export default function FavoritePlaces({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<FavoritePlaceRow[]>([]);

  async function load() {
    setLoading(true);
    const { userId, rows, source } = await fetchFavoriteRows();
    setRows(rows);
    setLoading(false);

    if (!userId) {
      Toast.show({
        type: 'error',
        text1: 'Sem login',
        text2: 'Você precisa estar autenticado para ver favoritos (RLS ativo).',
        visibilityTime: 3000,
      });
    } else if (source !== 'server') {
      Toast.show({
        type: 'info',
        text1: 'Aviso',
        text2: 'Não foi possível carregar do servidor agora.',
        visibilityTime: 2500,
      });
    }
  }

  async function handleRemove(placeId: string) {
    Alert.alert('Remover favorito?', 'Deseja remover este local da sua lista de favoritos?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          const res = await removeFavorite(placeId);
          if (!res.ok) {
            Toast.show({ type: 'error', text1: 'Erro', text2: res.message ?? 'Falha ao remover', visibilityTime: 3000 });
            return;
          }
          setRows(prev => prev.filter(r => r.place_id !== placeId));
          Toast.show({ type: 'success', text1: 'Removido', visibilityTime: 1500 });
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <LinearGradient
        colors={['#059669', '#16a34a']}
        style={{ paddingTop: 18, paddingBottom: 14, paddingHorizontal: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}
      >
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
          Lugares Favoritos
        </Text>
        <Text style={{ color: '#dcfce7', fontSize: 12, textAlign: 'center', marginTop: 2 }}>
          Seus locais diet preferidos
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
        <TouchableOpacity
          onPress={load}
          style={{ alignSelf: 'flex-start', marginBottom: 12, backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 }}
        >
          <Text style={{ fontWeight: '700', color: '#065f46' }}>↻ Atualizar</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}>
            <ActivityIndicator />
            <Text style={{ color: '#666', marginTop: 10 }}>Carregando favoritos...</Text>
          </View>
        ) : rows.length === 0 ? (
          <View style={{ paddingTop: 24 }}>
            <Text style={{ color: '#666' }}>Você ainda não favoritou nenhum local.</Text>
          </View>
        ) : (
          rows.map((r) => (
            <View
              key={r.id}
              style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexShrink: 1, paddingRight: 8 }}>
                  <Text style={{ fontWeight: '700', fontSize: 15 }}>{r.place_name ?? 'Local'}</Text>
                  <Text style={{ color: '#4b5563', fontSize: 13, marginTop: 2 }}>{r.place_type ?? ''}</Text>
                  {!!r.place_address && <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>{r.place_address}</Text>}
                </View>

                <TouchableOpacity
                  onPress={() => handleRemove(r.place_id)}
                  style={{ padding: 8, borderRadius: 10, backgroundColor: '#fff1f2', alignSelf: 'flex-start' }}
                >
                  <Feather name="trash-2" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
