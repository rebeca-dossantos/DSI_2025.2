import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity, TextInput, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';
import Toast from 'react-native-toast-message';

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('Usuário de Teste');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedUserName, setEditedUserName] = useState('');
  const [editedStats, setEditedStats] = useState<any>({});
  const [editedGoals, setEditedGoals] = useState<any>({});

  const [userStats, setUserStats] = useState({
    dias: 0,
    carboidrato: 0,
    peso: 0,
    altura: 0,
    calorias: 0,
    proteina: 0,
  });

  const [goals, setGoals] = useState({
    calorias: 1800,
    proteina: 120,
    carboidratos: 220,
    gordura: 60,
  });

  function getFileExtFromName(name: string) {
    const m = name.match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
    if (!m) return 'jpg';
    const e = m[1].toLowerCase();
    return e === 'jpeg' ? 'jpg' : e;
  }

  function getFileNameFromUri(uri: string) {
    try {
      const parts = uri.split('/');
      let last = parts[parts.length - 1] || parts[parts.length - 2] || 'image.jpg';
      last = last.split('?')[0];
      if (!last) return `image_${Date.now()}.jpg`;
      return last;
    } catch {
      return `image_${Date.now()}.jpg`;
    }
  }

  async function uploadImageToSupabase(uri: string, fileName?: string) {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const user = userData?.user;
    if (!user) throw new Error('Usuário não autenticado');

    const userId = user.id;
    const name = fileName ?? getFileNameFromUri(uri);
    const safeName = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const ext = getFileExtFromName(safeName);

    const filePath = `profiles/${userId}/${safeName}`;
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('imagem')
      .upload(filePath, uint8Array as any, {
        upsert: true,
        contentType,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('imagem').getPublicUrl(filePath);
    return urlData?.publicUrl ?? null;
  }

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permissão negada', text2: 'Sem acesso à galeria.' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const uri = asset.uri;
      const maybeFileName: string | undefined = (asset as any).fileName ?? (asset as any).name;

      setProfileImage(uri);
      Toast.show({ type: 'info', text1: 'Enviando imagem...' });

      try {
        const publicUrl = await uploadImageToSupabase(uri, maybeFileName);
        const finalUrl = publicUrl ? `${publicUrl}?t=${Date.now()}` : uri;

        await AsyncStorage.setItem('userProfileImage', finalUrl);
        setProfileImage(finalUrl);

        Toast.show({ type: 'success', text1: 'Foto atualizada!' });
      } catch {
        Toast.show({ type: 'info', text1: 'Salvo localmente' });
      }
    } catch (err) {
      console.warn(err);
      Toast.show({ type: 'error', text1: 'Erro ao selecionar imagem.' });
    }
  };

  const startEditing = () => {
    setEditedUserName(userName);
    setEditedStats({ ...userStats });
    setEditedGoals({ ...goals });
    setIsEditing(true);
  };

  const saveChanges = async () => {
    setUserName(editedUserName);
    setUserStats(editedStats);
    setGoals(editedGoals);

    await AsyncStorage.setItem('lastLoggedUserName', editedUserName);
    await AsyncStorage.setItem('userStats', JSON.stringify(editedStats));

    setIsEditing(false);
    Toast.show({ type: 'success', text1: 'Perfil atualizado!' });
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('lastLoggedUser');
        if (storedEmail) setUserEmail(storedEmail);
        const storedName = await AsyncStorage.getItem('lastLoggedUserName');
        if (storedName) setUserName(storedName);
        const storedImage = await AsyncStorage.getItem('userProfileImage');
        if (storedImage) setProfileImage(storedImage);
        const storedStats = await AsyncStorage.getItem('userStats');
        if (storedStats) setUserStats(prev => ({ ...prev, ...JSON.parse(storedStats) }));

        const today = new Date().toISOString().slice(0, 10);
        const lastDate = await AsyncStorage.getItem('lastOpenDate');
        let days = Number((await AsyncStorage.getItem('daysUsed')) || '0');
        if (lastDate !== today) {
          days += 1;
          await AsyncStorage.setItem('lastOpenDate', today);
          await AsyncStorage.setItem('daysUsed', String(days));
        }
        setUserStats(prev => ({ ...prev, dias: days }));
      } catch {}
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return;

    const keys = ['lastLoggedUser', 'lastLoggedUserName', 'userProfileImage', 'userStats', 'lastOpenDate', 'daysUsed'];
    await AsyncStorage.multiRemove(keys);

    navigation.replace('Login');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f7f6' }} contentContainerStyle={{ paddingBottom: 30 }}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 24, backgroundColor: '#fff' }}>
        <TouchableOpacity onPress={handlePickImage}>
          <Image
            source={{
              uri: profileImage ? profileImage : `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=007AFF&color=fff&size=128`,
            }}
            style={{ width: 72, height: 72, borderRadius: 36 }}
          />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 16 }}>
          {isEditing ? (
            <TextInput
              style={{ fontSize: 24, fontWeight: '600', borderBottomWidth: 1, borderColor: '#ccc' }}
              value={editedUserName}
              onChangeText={setEditedUserName}
            />
          ) : (
            <Text style={{ fontSize: 25, fontWeight: '600', color: '#222' }}>{userName}</Text>
          )}
          <Text style={{ fontSize: 15, color: '#666', marginTop: 4 }}>{userEmail}</Text>
        </View>

        {!isEditing && (
          <TouchableOpacity onPress={startEditing}>
            <Ionicons name="create-outline" size={26} color="#2f80ed" />
          </TouchableOpacity>
        )}
      </View>

      {/* Estatísticas */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 15 }}>
        {[{ label: 'Dias consecutivos', key: 'dias' },
          { label: 'Média carb/dia', key: 'carboidrato' },
          { label: 'Média proteínas/dia', key: 'proteina' },
          { label: 'Média kcal/dia', key: 'calorias' }
        ].map((item, i) => (
          <View key={i} style={{ width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 18, marginBottom: 12 }}>
            <Text style={{ fontSize: 15, color: '#666' }}>{item.label}</Text>

            {isEditing ? (
              <TextInput
                style={{ fontSize: 20, fontWeight: '600', borderBottomWidth: 1 }}
                keyboardType="numeric"
                value={String(editedStats[item.key])}
                onChangeText={v => setEditedStats({ ...editedStats, [item.key]: Number(v) })}
              />
            ) : (
              <Text style={{ fontSize: 20, fontWeight: '600' }}>{userStats[item.key as keyof typeof userStats]}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Dados pessoais */}
      <View style={{ backgroundColor: '#fff', marginHorizontal: 20, marginTop: 20, borderRadius: 16, padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Dados Pessoais</Text>

        {['altura', 'peso'].map(key => (
          <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 }}>
            <Text style={{ fontSize: 18 }}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>

            {isEditing ? (
              <TextInput
                style={{ borderBottomWidth: 1, width: 80, textAlign: 'right' }}
                keyboardType="numeric"
                value={String(editedStats[key])}
                onChangeText={v => setEditedStats({ ...editedStats, [key]: Number(v) })}
              />
            ) : (
              <Text style={{ fontSize: 18, fontWeight: '600' }}>
                {userStats[key as keyof typeof userStats]} {key === 'altura' ? 'cm' : 'Kg'}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Metas */}
      <View style={{ backgroundColor: '#fff', marginHorizontal: 20, marginTop: 20, borderRadius: 16, padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Metas Diárias</Text>

        {Object.entries(goals).map(([key, value]) => (
          <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 }}>
            <Text style={{ fontSize: 18 }}>{key}</Text>

            {isEditing ? (
              <TextInput
                style={{ borderBottomWidth: 1, width: 80, textAlign: 'right' }}
                keyboardType="numeric"
                value={String(editedGoals[key])}
                onChangeText={v => setEditedGoals({ ...editedGoals, [key]: Number(v) })}
              />
            ) : (
              <Text style={{ fontSize: 18, fontWeight: '600' }}>
                {value}{key === 'calorias' ? ' kcal' : ' g'}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Salvar / Cancelar */}
      {isEditing && (
        <View style={{ marginHorizontal: 20, marginTop: 24 }}>
          <TouchableOpacity onPress={saveChanges} style={{ backgroundColor: '#2ecc71', padding: 14, borderRadius: 12, marginBottom: 12 }}>
            <Text style={{ textAlign: 'center', fontWeight: '700', color: '#fff' }}>Salvar Alterações</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={cancelEditing} style={{ backgroundColor: '#ccc', padding: 14, borderRadius: 12 }}>
            <Text style={{ textAlign: 'center', fontWeight: '700' }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Logout */}
      {!isEditing && (
        <View style={{ marginHorizontal: 20, marginTop: 24 }}>
          <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: '#86efac', padding: 14, borderRadius: 12 }}>
            <Text style={{ textAlign: 'center', fontWeight: '700', color: '#166534' }}>Deslogar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Emergência */}
      <TouchableOpacity
        style={{ backgroundColor: '#e74c3c', paddingVertical: 16, marginHorizontal: 16, borderRadius: 12, marginTop: 30 }}
        onPress={() => Linking.openURL('tel:192')}
      >
        <Text style={{ textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Ligar para Emergência</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}
