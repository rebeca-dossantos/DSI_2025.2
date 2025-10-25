// Profile.tsx
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity, Modal, TextInput, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const [userEmail, setUserEmail] = useState('');
  // Nome do usuário agora editável
  const [userName, setUserName] = useState('Usuário de Teste');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [userStats, setUserStats] = useState({
  dias: 0,
  carboidrato: 0,
  peso: 0,
  altura: 0,
  calorias: 0,
  proteina: 0,
});


  // 🔥 Metas diárias do usuário
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

  // abrir edição do nome
  const handleEditName = () => {
    setSelectedGoal('name');
    setNewValue(userName);
    setModalVisible(true);
  };

  const handlePickImage = async () => {
  // pede permissão de acesso à galeria
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Precisamos da sua permissão para acessar suas fotos.');
    return;
  }

  // abre a galeria
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  // se o usuário escolheu uma imagem, salva o URI dela
  if (!result.canceled && result.assets && result.assets.length > 0) {
    const uri = result.assets[0].uri;
    setProfileImage(uri);
    await AsyncStorage.setItem('userProfileImage', uri); // salva localmente
  }
};

  const saveGoal = () => {
    if (!selectedGoal) {
      setModalVisible(false);
      return;
    }

    if (selectedGoal === 'name') {
      setUserName(newValue.trim() || 'Usuário de Teste');
    } else if (!isNaN(Number(newValue))) {
      if ((userStats as any).hasOwnProperty(selectedGoal)) {
        setUserStats({ ...userStats, [selectedGoal]: Number(newValue) });
      } else {
        setGoals({ ...goals, [selectedGoal]: Number(newValue) });
      }
    }
    setModalVisible(false);
    setSelectedGoal(null);
  };

  // Carrega o email do usuário logado
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('lastLoggedUser');
        if (storedEmail) setUserEmail(storedEmail);
        // opcional: carregar nome salvo (se você quiser persistir)
        const storedName = await AsyncStorage.getItem('lastLoggedUserName');
        if (storedName) setUserName(storedName);
        const storedImage = await AsyncStorage.getItem('userProfileImage');
        if (storedImage) setProfileImage(storedImage);
        const storedStats = await AsyncStorage.getItem('userStats');
        if (storedStats) {
          const parsedStats = JSON.parse(storedStats);
          setUserStats(prev => ({
            ...prev,
            ...parsedStats,
          }));
        }

        const updateDaysUsed = async () => {
          try {
            const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
            const lastDate = await AsyncStorage.getItem('lastOpenDate');
            let days = Number(await AsyncStorage.getItem('daysUsed')) || 0;

            if (lastDate !== today) {
              // Novo dia
              days += 1;
              await AsyncStorage.setItem('lastOpenDate', today);
              await AsyncStorage.setItem('daysUsed', String(days));
            }

            // Atualiza o estado do usuário para refletir os dias
            setUserStats(prev => ({ ...prev, dias: days }));
          } catch (err) {
            console.warn('Erro ao atualizar dias:', err);
          }
        };

        await updateDaysUsed();
      } catch (err) {
        console.warn('Erro ao carregar usuário:', err);
      }
    };
    loadUser();
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f5f7f6' }}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 24,
          backgroundColor: '#fff',
        }}
      >
        <View style={{ marginRight: 16 }}>
          <TouchableOpacity onPress={handlePickImage}>
  <TouchableOpacity onPress={handlePickImage}></TouchableOpacity>
  <Image
    source={{
      uri: profileImage
        ? profileImage
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=007AFF&color=fff&size=128`,
    }}
    style={{ width: 72, height: 72, borderRadius: 36 }}
  />
  <Ionicons
    name="camera-outline"
    size={20}
    color="#2f80ed"
    style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: '#fff', borderRadius: 10, padding: 2 }}
  />
</TouchableOpacity>

        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 25, fontWeight: '600', color: '#222' }}>{userName}</Text>
            <TouchableOpacity onPress={handleEditName} style={{ marginLeft: 8 }}>
              <Ionicons name="create-outline" size={22} color="#2f80ed" />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 15, color: '#666', marginTop: 4 }}>{userEmail}</Text>
        </View>
      </View>

      {/* Estatísticas */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          marginTop: 15,
        }}
      >
        {[
          { label: 'Dias consecutivos', value: userStats.dias },
          { label: 'Média carb/dia', value: userStats.carboidrato },
          { label: 'Média proteínas/dia', value: userStats.proteina },
          { label: 'Média kcal/dia', value: userStats.calorias },
        ].map((stat, index) => (
          <View
            key={index}
            style={{
              width: '47%',
              backgroundColor: '#fff',
              borderRadius: 12,
              paddingVertical: 18,
              paddingHorizontal: 14,
              marginBottom: 12,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 15, color: '#666', marginBottom: 4 }}>
              {stat.label}
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#222' }}>
              {stat.value}
            </Text>
          </View>
        ))}
      </View>

      {/* Dados Pessoais */}
      <View
        style={{
          backgroundColor: '#fff',
          marginHorizontal: 20,
          marginTop: 20,
          borderRadius: 16,
          paddingVertical: 20,
          paddingHorizontal: 16,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: '#222',
            marginBottom: 12,
          }}
        >
          Dados Pessoais
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#eee',
          }}
        >
          <Text style={{ fontSize: 18, color: '#444' }}>Altura</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111' }}>
              {userStats.altura} cm
            </Text>
            <TouchableOpacity onPress={() => handleEditStats('altura')}>
              <Ionicons name="create-outline" size={24} color="#58ad53" />
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 12,
          }}
        >
          <Text style={{ fontSize: 18, color: '#444' }}>Peso</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111' }}>
              {userStats.peso} Kg
            </Text>
            <TouchableOpacity onPress={() => handleEditStats('peso')}>
              <Ionicons name="create-outline" size={24} color="#58ad53" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Metas Diárias */}
      <View
        style={{
          backgroundColor: '#fff',
          marginHorizontal: 20,
          marginTop: 20,
          borderRadius: 16,
          paddingVertical: 20,
          paddingHorizontal: 16,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: '#222',
            marginBottom: 12,
          }}
        >
          Metas Diárias
        </Text>

        {Object.entries(goals).map(([key, value]) => (
          <View
            key={key}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#eee',
            }}
          >
            <Text style={{ fontSize: 18, color: '#444' }}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#111' }}>
                {value}
                {key === 'calorias' ? ' kcal' : ' g'}
              </Text>
              <TouchableOpacity onPress={() => handleEditGoals(key)}>
                <Ionicons name="create-outline" size={24} color="#2f80ed" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Modal de Edição */}
      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 20,
              width: '80%',
            }}
          >
            {/* título do modal: tratar nome separado para português */}
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                marginBottom: 12,
                textAlign: 'center',
              }}
            >
              Editar{' '}
              {selectedGoal
                ? selectedGoal === 'name'
                  ? 'Nome'
                  : selectedGoal.charAt(0).toUpperCase() + selectedGoal.slice(1)
                : ''}
            </Text>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#166534',
                padding: 12,
                borderRadius: 8,
              }}
              keyboardType={selectedGoal === 'name' ? 'default' : 'numeric'}
              autoCapitalize={selectedGoal === 'name' ? 'words' : 'none'}
              value={newValue}
              onChangeText={setNewValue}
            />

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 16,
              }}
            >
              <Pressable
                style={{
                  backgroundColor: '#ccc',
                  borderRadius: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                }}
                onPress={() => setModalVisible(false)}
              >
                <Text>Cancelar</Text>
              </Pressable>
              <Pressable
                style={{
                  backgroundColor: '#58ad53',
                  borderRadius: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                }}
                onPress={saveGoal}
              >
                <Text style={{ color: '#fff' }}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Botão de Emergência */}
      <TouchableOpacity
        style={{
          backgroundColor: '#e74c3c',
          paddingVertical: 16,
          marginHorizontal: 16,
          borderRadius: 12,
          marginTop: 30,
          alignItems: 'center',
        }}
        onPress={() => Linking.openURL('tel:192')}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
          Ligar para Emergência
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
