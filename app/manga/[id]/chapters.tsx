import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { MangaDexApi, Chapter } from '../../../services/mangadex-api';

const COLORS = {
  primary: '#FF6B00',
  secondary: '#000000',
  background: '#FFFFFF',
  text: '#1A1A1A',
  border: '#E5E5E5',
};

export default function ChaptersScreen() {
  const { id: mangaId } = useLocalSearchParams();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChapters();
  }, [mangaId]);

  const loadChapters = async () => {
    if (!mangaId) return;
    setIsLoading(true);
    try {
      const data = await MangaDexApi.getChapters(mangaId as string);
      setChapters(data);
    } catch (error) {
      console.error('Fehler beim Laden der Kapitel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChapterItem = ({ item }: { item: Chapter }) => {
    const chapterNumber = item.attributes.chapter || 'Oneshot';
    const chapterTitle = item.attributes.title || `Kapitel ${chapterNumber}`;

    return (
      <TouchableOpacity 
        style={styles.chapterItem}
        onPress={() => router.push({
          pathname: "/manga/[id]/reader/[chapterId]",
          params: { id: mangaId as string, chapterId: item.id }
        })}
      >
        <Text style={styles.chapterNumber}>Kapitel {chapterNumber}</Text>
        <Text style={styles.chapterTitle}>{chapterTitle}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Kapitel',
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.primary,
        }}
      />
      
      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={chapters}
          renderItem={renderChapterItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    padding: 16,
  },
  chapterItem: {
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chapterNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  chapterTitle: {
    fontSize: 14,
    color: COLORS.text + '80',
  },
  separator: {
    height: 12,
  },
}); 