import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from './supabase';

export default function FormularioDiagnostico() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState<any>({
    HighBP: 0, HighChol: 0, CholCheck: 1, BMI: 0, Smoker: 0,
    Stroke: 0, HeartDiseaseorAttack: 0, PhysActivity: 1, Fruits: 1,
    Veggies: 1, HvyAlcoholConsump: 0, AnyHealthcare: 1, NoDocbcCost: 0,
    GenHlth: 3, MentHlth: 0, PhysHlth: 0, DiffWalk: 0, Sex: 1,
    Age: 1, Education: 4, Income: 5
  });

  const handleInputChange = (id: string, value: string) => {
    const val = value.replace(',', '.');
    setFormData((prev: any) => ({ ...prev, [id]: parseFloat(val) || 0 }));
  };

  const enviarParaAnalise = async () => {
    setLoading(true);
    try {
      // 1. Chamada para a API Python
      const response = await fetch('http://192.168.1.5:8000/predict', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("A API não respondeu corretamente.");
      const resData = await response.json();

      // 2. Salvar Histórico Completo no Supabase
      const { data: { user } } = await supabase.auth.getUser();

      const { error: dbError } = await supabase
        .from('historico_diagnosticos')
        .insert([{
          user_id: user?.id,
          // Mapeamento para as colunas do SQL
          high_bp: formData.HighBP,
          high_chol: formData.HighChol,
          chol_check: formData.CholCheck,
          bmi: formData.BMI,
          smoker: formData.Smoker,
          stroke: formData.Stroke,
          heart_disease_attack: formData.HeartDiseaseorAttack,
          phys_activity: formData.PhysActivity,
          fruits: formData.Fruits,
          veggies: formData.Veggies,
          hvy_alcohol_consump: formData.HvyAlcoholConsump,
          any_healthcare: formData.AnyHealthcare,
          no_doc_bc_cost: formData.NoDocbcCost,
          gen_hlth: formData.GenHlth,
          ment_hlth: formData.MentHlth,
          phys_hlth: formData.PhysHlth,
          diff_walk: formData.DiffWalk,
          sex: formData.Sex,
          age: formData.Age,
          education: formData.Education,
          income: formData.Income,
          // Resultados
          resultado: resData.diabetes,
          probabilidade: resData.probabilidade
        }]);

      if (dbError) throw new Error("Erro ao salvar no banco: " + dbError.message);

      // 3. Sucesso
      Alert.alert(
        resData.diabetes === 1 ? "⚠️ Atenção: Risco Detectado" : "✅ Resultado: Baixo Risco",
        `A probabilidade de diabetes é de ${(resData.probabilidade * 100).toFixed(1)}%`
      );
      setStep(1); 

    } catch (err: any) {
      Alert.alert("Erro no Processo", err.message || "Falha na conexão.");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (id: string, label: string, placeholder: string = "0") => (
    <View key={id} style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput 
        style={styles.input} 
        keyboardType="numeric" 
        placeholder={placeholder}
        value={formData[id]?.toString()}
        onChangeText={v => handleInputChange(id, v)} 
      />
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View>
            <Text style={styles.stepTitle}>Passo 1: Dados Físicos</Text>
            {renderInput('BMI', 'Seu IMC (Ex: 25.5)')}
            {renderInput('Age', 'Faixa Etária (1-13)')}
            {renderInput('Sex', 'Sexo (0: Mulher, 1: Homem)')}
            {renderInput('HighBP', 'Tem Pressão Alta? (0: Não, 1: Sim)')}
            {renderInput('HighChol', 'Tem Colesterol Alto? (0: Não, 1: Sim)')}
            {renderInput('CholCheck', 'Fez exame de colesterol em 5 anos? (0/1)')}
          </View>
        );
      case 2:
        return (
          <View>
            <Text style={styles.stepTitle}>Passo 2: Estilo de Vida</Text>
            {renderInput('Smoker', 'Fumou mais de 100 cigarros na vida? (0/1)')}
            {renderInput('HvyAlcoholConsump', 'Consumo excessivo de álcool? (0/1)')}
            {renderInput('PhysActivity', 'Fez atividade física no último mês? (0/1)')}
            {renderInput('Fruits', 'Come fruta 1x ou mais por dia? (0/1)')}
            {renderInput('Veggies', 'Come vegetais 1x ou mais por dia? (0/1)')}
            {renderInput('AnyHealthcare', 'Possui plano de saúde? (0/1)')}
          </View>
        );
      case 3:
        return (
          <View>
            <Text style={styles.stepTitle}>Passo 3: Histórico e Saúde</Text>
            {renderInput('GenHlth', 'Sua saúde em geral (1: Excelente - 5: Ruim)')}
            {renderInput('MentHlth', 'Dias de saúde mental ruim (0-30)')}
            {renderInput('PhysHlth', 'Dias de saúde física ruim (0-30)')}
            {renderInput('Stroke', 'Já teve um derrame? (0/1)')}
            {renderInput('HeartDiseaseorAttack', 'Já teve doença cardíaca? (0/1)')}
            {renderInput('DiffWalk', 'Dificuldade para caminhar/escadas? (0/1)')}
            {renderInput('Education', 'Nível de Escolaridade (1-6)')}
            {renderInput('Income', 'Faixa de Renda (1-8)')}
          </View>
        );
      default: return null;
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
        </View>
        
        <Text style={styles.header}>Análise de Saúde Inteligente</Text>

        {renderStep()}

        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
              <Text style={styles.backButtonText}>Voltar</Text>
            </TouchableOpacity>
          )}

          {step < 3 ? (
            <TouchableOpacity style={styles.nextButton} onPress={() => setStep(step + 1)}>
              <Text style={styles.nextButtonText}>Próximo</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.submitButton} onPress={enviarParaAnalise} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Gerar Diagnóstico</Text>}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 25, backgroundColor: '#fdfdfd' },
  progressContainer: { height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, marginBottom: 20 },
  progressBar: { height: 6, backgroundColor: '#2ecc71', borderRadius: 3 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#2c3e50' },
  stepTitle: { fontSize: 18, fontWeight: '600', color: '#2ecc71', marginBottom: 15 },
  inputWrapper: { marginBottom: 12, backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  label: { fontSize: 13, color: '#7f8c8d', marginBottom: 4 },
  input: { fontSize: 16, color: '#2c3e50', paddingVertical: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 40 },
  nextButton: { flex: 1, backgroundColor: '#2ecc71', padding: 16, borderRadius: 10, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontWeight: 'bold' },
  backButton: { flex: 0.4, backgroundColor: '#ecf0f1', padding: 16, borderRadius: 10, alignItems: 'center', marginRight: 10 },
  backButtonText: { color: '#7f8c8d', fontWeight: 'bold' },
  submitButton: { flex: 1, backgroundColor: '#2ecc71', padding: 16, borderRadius: 10, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontWeight: 'bold' }
});