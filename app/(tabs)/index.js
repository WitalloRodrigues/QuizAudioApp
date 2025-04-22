/*
 * App.js
 * Quiz de áudio usando expo-speech para TTS
 * - Tela inicial com animação pulse
 * - Pede permissão de brilho (expo-brightness)
 * - Duas perguntas lidas em voz de IA (Verdadeiro/Falso)
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';
import * as Brightness from 'expo-brightness';

// Definição das perguntas com texto e resposta correta
const questions = [
  { text: 'Pergunta 1: O céu é azul? Verdadeiro ou falso?', correct: true },
  { text: 'Pergunta 2: O fogo é frio? Verdadeiro ou falso?', correct: false },
];

export default function App() {
  const [stage, setStage] = useState('init');             // 'init' | 'quiz' | 'end'
  const [questionIndex, setQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const speakerAnim = useRef(new Animated.Value(1)).current;

  // Animação pulse no ícone
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(speakerAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(speakerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Fala a pergunta ao entrar no quiz ou mudar de pergunta
  useEffect(() => {
    if (stage === 'quiz') {
      speakQuestion(questions[questionIndex].text);
    }
  }, [stage, questionIndex]);

  // Inicia o quiz, pedindo permissão de brilho
  const handleStart = async () => {
    await Brightness.requestPermissionsAsync();
    setStage('quiz');
  };

  // Função que faz speak via TTS
  const speakQuestion = (text) => {
    Speech.speak(text, {
      language: 'pt-BR',
      pitch: 1.0,
      rate: 1.0,
    });
  };

  // Valida resposta e dá feedback
  const handleAnswer = (answer) => {
    const isCorrect = questions[questionIndex].correct;
    setFeedback(answer === isCorrect ? '✅ Correto!' : '❌ Errado!');
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

  // Tela de quiz
  if (stage === 'quiz') {
    return (
      <View style={styles.container}>
        <Text style={styles.questionHeader}>
          Pergunta {questionIndex + 1} de {questions.length}
        </Text>
        <Button
          title="Ouvir Pergunta"
          onPress={() => speakQuestion(questions[questionIndex].text)}
        />
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
      <Button
        title="Reiniciar"
        onPress={() => {
          setQuestionIndex(0);
          setStage('init');
        }}
      />
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
