// Map.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from './supabase';
export default function MapScreen() {
  type Place = {
    id: string;
    name: string;
    type: string;
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
      distance: "0.2 km",
      address: "R Paula Batista, 577 - 2 andar",
      hours: "Aberto 24h",
      phone: "(81) 99999-1003",
      diabeticFriendly: true,
      latitude: -8.046510,
      longitude: -34.917710,
    },
  ];

  // --- STATES ---
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [reviewsList, setReviewsList] = useState<any[]>([]); // Lista vazia inicial
  const [loadingReviews, setLoadingReviews] = useState(false); // Para mostrar carregando
  
  // ... seus outros states (reviewsList, loading, etc) ...
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // <--- NOVO

  const [currentUserName, setCurrentUserName] = useState("");
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // 1. Parte da Localização (MANTENHA IGUAL)
    (async () => {
       let { status } = await Location.requestForegroundPermissionsAsync();
       if (status !== 'granted') {
         setErrorMsg('Permissão negada');
         return;
       }
       let location = await Location.getCurrentPositionAsync({});
       setLocation(location);
    })();

    // 2. Parte do Usuário (ATUALIZADA)
    (async () => {
      // Pega o usuário logado
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id); // Salva o ID na memória

        // AGORA VAI NO BANCO BUSCAR O NOME
        try {
          const { data } = await supabase
            .from('user_stats') // Nome da tabela do perfil
            .select('name')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data && data.name) {
            setCurrentUserName(data.name); // Achou o nome!
          } else {
            // Se não achou, usa o começo do e-mail como apelido
            setCurrentUserName(user.email?.split('@')[0] || "Anônimo");
          }
        } catch (error) {
          console.log("Erro ao buscar nome:", error);
        }
      }
    })();
  }, []);

  // Inputs do formulário
  const [tempRating, setTempRating] = useState(5);
  const [tempComment, setTempComment] = useState("");

  // --- FUNÇÃO 1: BUSCAR REVIEWS (READ) ---
  const fetchReviews = async (placeId: string) => {
    setLoadingReviews(true);
    setReviewsList([]); // Limpa a lista antiga visualmente
    
    try {
      const { data, error } = await supabase
        .from('place_reviews')
        .select('*')
        .eq('place_id', placeId)
        .order('created_at', { ascending: false }); // Mais recentes primeiro

      if (error) throw error;
      if (data) setReviewsList(data);
      
    } catch (e) {
      console.log("Erro ao buscar reviews:", e);
    } finally {
      setLoadingReviews(false);
    }
  };

  // --- FUNÇÃO 2: SELECIONAR LOCAL ---
  const handleSelectPlace = (place: Place) => {
    setSelectedPlace(place);
    setIsWritingReview(false);
    // Chama a busca real no banco
    fetchReviews(place.id);
  };

  // --- FUNÇÃO 3: SALVAR REVIEW (CREATE) ---
  // --- FUNÇÃO 3: SALVAR REVIEW (CREATE) ---
  const handleSubmitReal = async () => {
    if (!tempComment.trim()) {
      Alert.alert("Ops", "Escreva um comentário!");
      return;
    }

    try {
      // Verifica se está logado
      if (!currentUserId) return Alert.alert("Erro", "Você precisa estar logado.");

      // Envia para o Supabase USANDO O NOME QUE BUSCAMOS
      const { error } = await supabase.from('place_reviews').insert({
        place_id: selectedPlace?.id,
        user_id: currentUserId,   // Já temos no state
        user_name: currentUserName, // <--- AQUI: Usa o nome correto do perfil
        rating: tempRating,
        comment: tempComment
      });

      if (error) throw error;

      // Sucesso!
      await fetchReviews(selectedPlace!.id); 
      setIsWritingReview(false);
      setTempComment("");
      setTempRating(5);
      Alert.alert("Sucesso", "Avaliação enviada!");

    } catch (e) {
      Alert.alert("Erro", "Não foi possível enviar.");
      console.log(e);
    }
  };

  // --- FUNÇÃO 4: DELETAR REVIEW (DELETE) ---
  const handleDelete = async (reviewId: number) => {
    Alert.alert(
      "Excluir",
      "Tem certeza que quer apagar esse comentário?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Apagar", 
          style: "destructive", 
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('place_reviews')
                .delete()
                .eq('id', reviewId);

              if (error) throw error;

              // Atualiza a lista na tela removendo o item apagado
              setReviewsList(prev => prev.filter(item => item.id !== reviewId));
              Alert.alert("Pronto!", "Comentário excluído.");
              
            } catch (e) {
              Alert.alert("Erro", "Não foi possível excluir.");
            }
          }
        }
      ]
    );
  };

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

        {/* LISTA E DETALHES (Substitua a View original "LISTA" por esta) */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          
          {/* CASO 1: NENHUM LUGAR SELECIONADO -> MOSTRA LISTA */}
          {!selectedPlace && (
            <>
              <Text style={{ color: "#065f46", fontWeight: "600", marginBottom: 10, fontSize: 16 }}>
                Locais Recomendados
              </Text>

              {placesObj.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  onPress={() => handleSelectPlace(place)}
                  style={{ backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10 }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flexShrink: 1, paddingRight: 8 }}>
                      <Text style={{ fontWeight: '600', fontSize: 15 }}>{place.name}</Text>
                      <Text style={{ color: "#4b5563", fontSize: 13, marginTop: 2 }}>{place.type}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      </View>
                      <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{place.distance}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* CASO 2: LUGAR SELECIONADO -> MOSTRA DETALHES E REVIEWS */}
          {selectedPlace && (
            <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "#e5e7eb" }}>
              
              {/* Botão Fechar */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontWeight: '700', fontSize: 18, color: '#065f46', flex: 1 }}>{selectedPlace.name}</Text>
                <TouchableOpacity onPress={() => setSelectedPlace(null)}>
                  <Feather name="x-circle" size={24} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <Text style={{ color: '#374151', marginBottom: 4 }}>📍 {selectedPlace.address}</Text>
              <Text style={{ color: '#374151', marginBottom: 16 }}>📞 {selectedPlace.phone}</Text>

              <View style={{ height: 1, backgroundColor: '#e5e7eb', marginBottom: 16 }} />

              {/* MODO ESCREVENDO */}
              {isWritingReview ? (
                <View style={{ backgroundColor: '#f0fdf4', padding: 12, borderRadius: 8 }}>
                  <Text style={{ fontWeight: '600', color: '#166534', marginBottom: 8 }}>Sua Avaliação:</Text>
                  
                  {/* Estrelas Clicáveis */}
                  <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <TouchableOpacity key={s} onPress={() => setTempRating(s)} style={{ marginRight: 8 }}>
                        <Feather name="star" size={24} color={s <= tempRating ? "#fbbf24" : "#d1d5db"} />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    style={{ backgroundColor: '#fff', borderRadius: 6, padding: 8, height: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 10 }}
                    placeholder="Conte sua experiência..."
                    multiline
                    value={tempComment}
                    onChangeText={setTempComment}
                  />

                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                    <TouchableOpacity onPress={() => setIsWritingReview(false)}>
                      <Text style={{ color: '#6b7280', padding: 8 }}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSubmitReal} style={{ backgroundColor: '#16a34a', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 }}>
                      <Text style={{ color: '#fff', fontWeight: '600' }}>Publicar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* MODO LISTA DE REVIEWS */
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontWeight: '600', fontSize: 16 }}>Avaliações</Text>
                    <TouchableOpacity 
                      onPress={() => setIsWritingReview(true)}
                      style={{ backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}
                    >
                      <Text style={{ color: '#166534', fontSize: 12, fontWeight: '700' }}>+ Avaliar</Text>
                    </TouchableOpacity>
                  </View>
{reviewsList.map((rev) => (
                    <View key={rev.id} style={{ marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 8 }}>
                      
                      {/* LINHA DE CIMA: NOME + LIXEIRA */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontWeight: '600', fontSize: 13 }}>{rev.user_name || "Anônimo"}</Text>
                        
                        {/* SÓ MOSTRA SE FOR O DONO */}
                        {currentUserId === rev.user_id && (
                          <TouchableOpacity onPress={() => handleDelete(rev.id)}>
                            <Feather name="trash-2" size={16} color="#ef4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                      
                      {/* ESTRELAS */}
                      <View style={{ flexDirection: 'row', marginVertical: 4 }}>
                         {[...Array(5)].map((_, i) => (
                           <Feather key={i} name="star" size={12} color={i < rev.rating ? "#fbbf24" : "#e5e7eb"} />
                         ))}
                      </View>

                      {/* COMENTÁRIO */}
                      <Text style={{ color: '#4b5563', fontSize: 13 }}>{rev.comment}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}

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
