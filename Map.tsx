// Map.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

export default function MapScreen() {
  type Place = {
    id: string; name: string; type: string; rating: number; distance: string; address: string; hours: string; phone: string; diabeticFriendly?: boolean;
  };

  const placesObj: Place[] = [
    { id: "1", name: "Green Bowl Restaurante", type: "Restaurante Saudável", rating: 4.8, distance: "0.3 km", address: "Rua das Flores, 123 - Boa Viagem", hours: "Aberto até 22h", phone: "(81) 99999-1001", diabeticFriendly: true },
    { id: "2", name: "Vida Natural", type: "Lanchonete Fit", rating: 4.6, distance: "0.5 km", address: "Av. Conselheiro Aguiar, 456", hours: "Aberto até 20h", phone: "(81) 99999-1002", diabeticFriendly: true },
    { id: "3", name: "Farmácia Saúde+", type: "Farmácia", rating: 4.9, distance: "0.2 km", address: "Rua do Hospital, 789", hours: "Aberto 24h", phone: "(81) 99999-1003", diabeticFriendly: true },
  ];

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const pinPositions = useMemo(() => {
    const mapWidth = Dimensions.get("window").width * 0.95;
    const mapHeight = 220;
    return placesObj.map((_, index) => ({
      left: 0.2 * mapWidth + index * 0.25 * mapWidth,
      top: 0.3 * mapHeight + index * 0.15 * mapHeight,
    }));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <LinearGradient colors={["#059669", "#16a34a"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 18, paddingBottom: 14, paddingHorizontal: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: '700', textAlign: 'center' }}>Locais Próximos</Text>
        <Text style={{ color: "#dcfce7", fontSize: 12, textAlign: 'center', marginTop: 2 }}>Restaurantes e serviços para diabéticos</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        <View style={{ height: 220, marginTop: 12 }}>
          <LinearGradient colors={["#bbf7d0", "#86efac"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, justifyContent: 'center' }}>
            <View style={{ alignSelf: "center", width: 0.42 * Dimensions.get("window").width, backgroundColor: "#fff", paddingVertical: 14, paddingHorizontal: 10, borderRadius: 12, elevation: 3, alignItems: "center" }}>
              <Feather name="map-pin" size={28} color="#16a34a" style={{ marginBottom: 6 }} />
              <Text style={{ fontSize: 13, color: "#4b5563" }}>Mapa interativo</Text>
              <Text style={{ fontSize: 11, color: "#6b7280" }}>Recife, PE</Text>
            </View>

            {placesObj.map((place, i) => (
              <TouchableOpacity key={place.id} activeOpacity={0.8} onPress={() => setSelectedPlace(place)} style={{ position: 'absolute', left: pinPositions[i].left, top: pinPositions[i].top, padding: 8, borderRadius: 999, backgroundColor: '#16a34a' }}>
                <Feather name="map-pin" size={16} color="#fff" />
              </TouchableOpacity>
            ))}
          </LinearGradient>
        </View>

        {/* Lista */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <Text style={{ color: "#fff", fontWeight: "600", marginBottom: 10, fontSize: 16 }}>Locais Recomendados</Text>
          {placesObj.map((place) => (
            <TouchableOpacity key={place.id} onPress={() => setSelectedPlace(place)} style={{ backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexShrink: 1, paddingRight: 8 }}>
                  <Text style={{ fontWeight: '600', fontSize: 15 }}>{place.name}</Text>
                  <Text style={{ color: "#4b5563", fontSize: 13, marginTop: 2 }}>{place.type}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Feather name="star" size={14} color="#fbbf24" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 13 }}>{place.rating}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{place.distance}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {selectedPlace && (
            <View style={{ backgroundColor: "#ecfdf5", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#bbf7d0", marginTop: 14 }}>
              <Text style={{ fontWeight: '700', color: '#065f46', marginBottom: 8 }}>{selectedPlace.name}</Text>
              <Text style={{ color: '#374151' }}>{selectedPlace.phone}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
