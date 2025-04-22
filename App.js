/*
 * App.js
 * Quiz de áudio em Expo React Native
 * - Tela inicial com animação pulse para incentivar aumento de volume
 * - Pede permissão de brilho (expo-brightness)
 * - Toca duas perguntas em áudio (Verdadeiro/Falso)
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import * as Brightness from 'expo-brightness';

// Configuração das perguntas: áudio e resposta correta
const questions = [
  { audio: require('./assets/q1.mp3'), correct: true },
  { audio: require('./assets/q2.mp3'), correct: false },
];

export default function App() {
  const [stage, setStage] = useState('init');             // 'init' | 'quiz' | 'end'
  const [questionIndex, setQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const speakerAnim = useRef(new Animated.Value(1)).current;
  const soundRef = useRef();

  // Animação pulse na tela inicial
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(speakerAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(speakerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Tocar áudio ao iniciar o quiz ou trocar de pergunta
  useEffect(() => {
    if (stage === 'quiz') playAudio();
    return () => { if (soundRef.current) soundRef.current.unloadAsync(); };
  }, [stage, questionIndex]);

  // Pede permissão de brilho antes de iniciar
  const handleStart = async () => {
    await Brightness.requestPermissionsAsync();
    setStage('quiz');
  };

  // Cria e toca o som da pergunta
  const playAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    const { sound } = await Audio.Sound.createAsync(
      questions[questionIndex].audio,
      { shouldPlay: true, staysActiveInBackground: true }
    );
    soundRef.current = sound;
  };

  // Verifica resposta e mostra feedback
  const handleAnswer = (answer) => {
    const correct = questions[questionIndex].correct;
    setFeedback(answer === correct ? '✅ Correto!' : '❌ Errado!');
    setTimeout(() => {
      setFeedback('');
      if (questionIndex < questions.length - 1) {
        setQuestionIndex(questionIndex + 1);
      } else {
        setStage('end');
      }
    }, 1500);
  };

  // Tela inicial
  if (stage === 'init') {
    return (
      <View style={styles.container}>
        <Animated.View style={{ transform: [{ scale: speakerAnim }] }}>
          <Text style={styles.speaker}>🔊</Text>
        </Animated.View>
        <Text style={styles.instructions}>Aumente o volume do seu dispositivo</Text>
        <Button title="Iniciar Quiz" onPress={handleStart} />
      </View>
    );
  }

  // Tela do quiz
  if (stage === 'quiz') {
    return (
      <View style={styles.container}>
        <Text style={styles.questionHeader}>Pergunta {questionIndex + 1} de {questions.length}</Text>
        <Button title="Ouvir Pergunta" onPress={playAudio} />
        <View style={styles.optionsRow}>
          <TouchableOpacity style={styles.optionBtn} onPress={() => handleAnswer(true)}>
            <Text style={styles.optionText}>Verdadeiro</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionBtn} onPress={() => handleAnswer(false)}>
            <Text style={styles.optionText}>Falso</Text>
          </TouchableOpacity>
        </View>
        {!!feedback && <Text style={styles.feedback}>{feedback}</Text>}
      </View>
    );
  }

  // Tela final
  return (
    <View style={styles.container}>
      <Text style={styles.endText}>Quiz Finalizado!</Text>
      <Button title="Reiniciar" onPress={() => { setQuestionIndex(0); setStage('init'); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  speaker: { fontSize: 64, marginBottom: 20 },
  instructions: { fontSize: 18, marginBottom: 20, textAlign: 'center' },
  questionHeader: { fontSize: 20, marginBottom: 20 },
  optionsRow: { flexDirection: 'row', marginTop: 20 },
  optionBtn: { padding: 15, marginHorizontal: 10, backgroundColor: '#ddd', borderRadius: 8 },
  optionText: { fontSize: 16 },
  feedback: { fontSize: 24, marginTop: 20 },
  endText: { fontSize: 24, marginBottom: 20 },
});
