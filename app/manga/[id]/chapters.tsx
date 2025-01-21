import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MangaDexApi, Chapter } from '../../../services/mangadex-api';
import { Ionicons } from '@expo/vector-icons';

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kapitel</Text>
      </View>
      
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
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
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