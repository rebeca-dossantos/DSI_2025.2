// Profile.tsx
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity, Modal, TextInput, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const [userEmail, setUserEmail] = useState('');
  const [userStats, setUserStats] = useState({
    dias: 12,
    carboidrato: 170,
    peso: 70,
    altura: 170,
    calorias: 1800,
    proteina: 120,
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

  const saveGoal = () => {
    if (selectedGoal && !isNaN(Number(newValue))) {
      if (userStats.hasOwnProperty(selectedGoal)) {
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
      } catch (err) {
        console.warn('Erro ao carregar email:', err);
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
          <Image
            source={{
              uri: 'https://ui-avatars.com/api/?name=User&background=007AFF&color=fff&size=128',
            }}
            style={{ width: 72, height: 72, borderRadius: 36 }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 25, fontWeight: '600', color: '#222' }}>
            Usuário de Teste
          </Text>
          <Text style={{ fontSize: 15, color: '#666', marginTop: 4 }}>
            {userEmail || 'user@gmail.com'}
          </Text>
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
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                marginBottom: 12,
                textAlign: 'center',
              }}
            >
              Editar{' '}
              {selectedGoal &&
                selectedGoal.charAt(0).toUpperCase() + selectedGoal.slice(1)}
            </Text>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#166534',
                padding: 12,
                borderRadius: 8,
              }}
              keyboardType="numeric"
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
