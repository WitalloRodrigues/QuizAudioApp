/*
 * App.js
 * Quiz de áudio com expo-speech e áudio estático para segunda pergunta
 * - Tela inicial com animação pulse e instrução para aumentar o som
 * - Pede permissão de brilho (expo-brightness)
 * - Pergunta 1: TTS, volume baixo (0.5)
 * - Pergunta 2: MP3 do assets, volume máximo (1.0)
 * - As opções só aparecem quando a reprodução termina
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as Brightness from 'expo-brightness';

// Configuração das perguntas
const questions = [
  {
    type: 'tts',
    text: 'Pergunta 1: O céu é azul? Verdadeiro ou falso?',
    correct: true,
    volume: 0.5
  },
  {
    type: 'audio',
    asset: require('../../assets/q3.mp3'),
    correct: false,
    volume: 1.0
  }
];

export default function App() {
  const [stage, setStage] = useState('init'); // 'init' | 'quiz' | 'end'
  const [questionIndex, setQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const speakerAnim = useRef(new Animated.Value(1)).current;
  const soundRef = useRef(null);

  // Animação pulse no ícone
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(speakerAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(speakerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Toca pergunta ao iniciar quiz ou mudar de pergunta
  useEffect(() => {
    if (stage === 'quiz') {
      playQuestion();
    }
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [stage, questionIndex]);

  // Inicia quiz pedindo permissão de brilho
  const handleStart = async () => {
    await Brightness.requestPermissionsAsync();
    setStage('quiz');
  };

  // Executa TTS ou áudio estático
  const playQuestion = async () => {
    setIsPlaying(true);
    const q = questions[questionIndex];
    if (q.type === 'tts') {
      Speech.speak(q.text, {
        language: 'pt-BR', pitch: 1.0, rate: 1.0, volume: q.volume,
        onDone: () => setIsPlaying(false),
        onError: () => setIsPlaying(false)
      });
    } else {
      const { sound } = await Audio.Sound.createAsync(
        q.asset,
        { shouldPlay: true, volume: q.volume }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    }
  };

  // Permite replay manual
  const handlePlay = () => playQuestion();

  // Verifica resposta e feedback
  const handleAnswer = (answer) => {
    const isCorrect = questions[questionIndex].correct;
    setFeedback(answer === isCorrect ? '✅ Correto!' : '❌ Errado!');
    setTimeout(() => {
      setFeedback('');
      if (questionIndex < questions.length - 1) {
        setQuestionIndex(prev => prev + 1);
      } else {
        setStage('end');
      }
    }, 1500);
  };

  // Tela inicial
  if (stage === 'init') {
    return (
      <View style={styles.container}>
        {/* <Animated.View style={{ transform: [{ scale: speakerAnim }] }}> */}
          <Text style={styles.speaker}>Aumente o som 🔊</Text>
        {/* </Animated.View> */}
        <Text style={styles.instructions}>Aumente o som do seu dispositivo</Text>
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
        <Button title={isPlaying ? "Reproduzindo..." : "Ouvir Pergunta"} onPress={handlePlay} disabled={isPlaying} />
        {!isPlaying && (
          <View style={styles.optionsRow}>
            <TouchableOpacity style={styles.optionBtn} onPress={() => handleAnswer(true)}>
              <Text style={styles.optionText}>Verdadeiro</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionBtn} onPress={() => handleAnswer(false)}>
              <Text style={styles.optionText}>Falso</Text>
            </TouchableOpacity>
          </View>
        )}
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
  speaker: { fontSize: 24, marginBottom: 20, color: '#fff' },
  instructions: { fontSize: 18, marginBottom: 20, textAlign: 'center' },
  questionHeader: { fontSize: 20, marginBottom: 20 },
  optionsRow: { flexDirection: 'row', marginTop: 20 },
  optionBtn: { padding: 15, marginHorizontal: 10, backgroundColor: '#ddd', borderRadius: 8 },
  optionText: { fontSize: 16 },
  feedback: { fontSize: 24, marginTop: 20 },
  endText: { fontSize: 24, marginBottom: 20 },
});
