import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { MangaDexApi, Manga } from '../../services/mangadex-api';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#FF6B00',
  secondary: '#000000',
  background: '#FFFFFF',
  text: '#1A1A1A',
  border: '#E5E5E5',
  inputBackground: '#F8F8F8',
};

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GRID_PADDING = 16;
const GRID_SPACING = 12;
const ITEM_WIDTH = (width - (GRID_PADDING * 2) - (GRID_SPACING * (COLUMN_COUNT - 1))) / COLUMN_COUNT;
const COVER_ASPECT_RATIO = 1.5; // Typisches Manga-Cover-Verhältnis

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (searchQuery.trim().length === 0) return;
    
    setIsLoading(true);
    try {
      const results = await MangaDexApi.searchManga(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Fehler bei der Suche:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMangaItem = ({ item }: { item: Manga }) => {
    const title = item.attributes.title.en || item.attributes.title.ja || 'Unbekannter Titel';
    const coverUrl = MangaDexApi.getCoverUrl(item);
    
    return (
      <TouchableOpacity 
        style={styles.mangaItem}
        onPress={() => router.push(`/manga-details?mangaId=${item.id}`)}
      >
        <View style={styles.coverContainer}>
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderCover}>
              <Ionicons name="book" size={32} color={COLORS.border} />
            </View>
          )}
        </View>
        <Text style={styles.mangaTitle} numberOfLines={2}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons 
              name="search" 
              size={20} 
              color={COLORS.primary} 
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Manga suchen..."
              placeholderTextColor={COLORS.text + '80'}
              onSubmitEditing={handleSearch}
            />
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderMangaItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.gridContainer}
            numColumns={COLUMN_COUNT}
            columnWrapperStyle={styles.row}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: COLORS.text,
    fontSize: 16,
  },
  gridContainer: {
    padding: GRID_PADDING,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: GRID_SPACING,
  },
  mangaItem: {
    width: ITEM_WIDTH,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coverContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * COVER_ASPECT_RATIO,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.inputBackground,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
  },
  mangaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    padding: 8,
    textAlign: 'center',
  },
});
