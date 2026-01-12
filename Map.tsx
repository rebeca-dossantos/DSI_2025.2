// Map.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

export default function MapScreen() {
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
    latitude: number;
    longitude: number;
  };

  const placesObj: Place[] = [
    {
      id: "1",
      name: "Green Bowl Restaurante",
      type: "Restaurante Saudável",
      rating: 4.8,
      distance: "0.3 km",
      address: "Av Rui Barbosa, 1503",
      hours: "Aberto até 22h",
      phone: "(81) 99999-1001",
      diabeticFriendly: true,
      latitude: -8.063169,
      longitude: -34.897985,
    },
    {
      id: "2",
      name: "Vida Natural",
      type: "Lanchonete Fit",
      rating: 4.6,
      distance: "0.5 km",
      address: "Av Eng. Domingos Ferreira 2842 - Loja 4",
      hours: "Aberto até 20h",
      phone: "(81) 99999-1002",
      diabeticFriendly: true,
      latitude: -8.127430,
      longitude: -34.901210,
    },
    {
      id: "3",
      name: "Farmácia Saúde+",
      type: "Farmácia",
      rating: 4.9,
      distance: "0.2 km",
      address: "R Paula Batista, 577 - 2 andar",
      hours: "Aberto 24h",
      phone: "(81) 99999-1003",
      diabeticFriendly: true,
      latitude: -8.046510,
      longitude: -34.917710,
    },
  ];

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [userLocation, setUserLocation] = useState<any>(null);

  // 📍 pega localização do usuário
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation(loc.coords);
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <LinearGradient
        colors={["#059669", "#16a34a"]}
        style={{
          paddingTop: 18,
          paddingBottom: 14,
          paddingHorizontal: 16,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16
        }}
      >
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
          Locais Próximos
        </Text>
        <Text style={{ color: "#dcfce7", fontSize: 12, textAlign: 'center', marginTop: 2 }}>
          Restaurantes e serviços para diabéticos
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        
        {/* MAPA REAL */}
        <View style={{ height: 350, marginTop: 12, borderRadius: 12, overflow: 'hidden', marginHorizontal: 16 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: placesObj[0].latitude,
              longitude: placesObj[0].longitude,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }}
          >
            {/* Localização do usuário */}
            {userLocation && (
              <Marker
                coordinate={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude
                }}
                title="Você está aqui"
                pinColor="blue"
              />
            )}

            {/* Marcadores dos locais */}
            {placesObj.map((place) => (
              <Marker
                key={place.id}
                coordinate={{
                  latitude: place.latitude,
                  longitude: place.longitude,
                }}
                title={place.name}
                description={place.address}
                onPress={() => setSelectedPlace(place)}
              >
                <Feather name="map-pin" size={32} color="#16a34a" />
              </Marker>
            ))}
          </MapView>
        </View>

        {/* LISTA */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <Text style={{ color: "#065f46", fontWeight: "600", marginBottom: 10, fontSize: 16 }}>
            Locais Recomendados
          </Text>

          {placesObj.map((place) => (
            <TouchableOpacity
              key={place.id}
              onPress={() => setSelectedPlace(place)}
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 14,
                marginBottom: 10
              }}
            >
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
            <View style={{
              backgroundColor: "#ecfdf5",
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: "#bbf7d0",
              marginTop: 14
            }}>
              <Text style={{ fontWeight: '700', color: '#065f46', marginBottom: 8 }}>
                {selectedPlace.name}
              </Text>
              <Text style={{ color: '#374151' }}>{selectedPlace.phone}</Text>
              <Text style={{ color: '#374151' }}>{selectedPlace.address}</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}
