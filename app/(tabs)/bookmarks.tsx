import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MangaProgressService, FavoriteManga, ReadingProgress } from '../../services/manga-progress-service';
import { MangaDexApi } from '../../services/mangadex-api';

const COLORS = {
  primary: '#FF6B00',
  secondary: '#000000',
  background: '#FFFFFF',
  text: '#1A1A1A',
  textLight: '#666666',
  border: '#E5E5E5',
};

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GRID_PADDING = 16;
const GRID_SPACING = 12;
const ITEM_WIDTH = (width - (GRID_PADDING * 2) - (GRID_SPACING * (COLUMN_COUNT - 1))) / COLUMN_COUNT;
const COVER_ASPECT_RATIO = 1.5;

interface MangaWithProgress extends FavoriteManga {
  progress?: ReadingProgress;
}

export default function FavoritesScreen() {
  const [favorites, setFavorites] = React.useState<MangaWithProgress[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    const favoriteManga = await MangaProgressService.getFavorites();
    const progress = await MangaProgressService.getAllReadingProgress();
    
    const favoritesWithProgress = favoriteManga.map(manga => ({
      ...manga,
      progress: progress[manga.id],
    }));
    
    setFavorites(favoritesWithProgress);
  };

  const renderMangaItem = ({ item }: { item: MangaWithProgress }) => {
    const title = item.attributes.title.en || item.attributes.title.ja || 'Unbekannter Titel';
    const coverUrl = MangaDexApi.getCoverUrl(item);
    
    const navigateToManga = () => {
      if (item.progress) {
        // Wenn es einen Lesefortschritt gibt, gehe direkt zum letzten gelesenen Kapitel
        router.push({
          pathname: "/manga/[id]/reader/[chapterId]",
          params: { 
            id: item.id,
            chapterId: item.progress.chapterId
          }
        });
      } else {
        // Sonst zur Manga-Details-Seite
        router.push({
          pathname: "/manga-details",
          params: { mangaId: item.id }
        });
      }
    };
    
    return (
      <TouchableOpacity 
        style={styles.mangaItem}
        onPress={navigateToManga}
      >
        <View style={styles.coverContainer}>
          {coverUrl && (
            <Image
              source={{ uri: coverUrl }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          )}
          {item.progress && (
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>
                Kapitel {item.progress.chapterNumber}
              </Text>
              <Text style={styles.progressSubtext}>
                Seite {item.progress.pageIndex + 1}
              </Text>
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
    <View style={styles.container}>
      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Keine Favoriten vorhanden
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Füge Manga zu deinen Favoriten hinzu, um sie hier zu sehen
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderMangaItem}
          keyExtractor={(item) => item.id}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 16,
  },
  grid: {
    padding: GRID_PADDING,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: GRID_SPACING,
  },
  mangaItem: {
    width: ITEM_WIDTH,
    marginBottom: 16,
  },
  coverContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * COVER_ASPECT_RATIO,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  mangaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
    textAlign: 'center',
  },
  progressBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary + 'CC',
    padding: 8,
  },
  progressText: {
    color: COLORS.background,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressSubtext: {
    color: COLORS.background,
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
}); 