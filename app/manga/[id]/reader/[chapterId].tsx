import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { FlatList } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { MangaDexApi, Chapter } from '../../../../services/mangadex-api';
import { MangaProgressService } from '../../../../services/manga-progress-service';

const COLORS = {
  primary: '#FF6B00',
  secondary: '#000000',
  background: '#000000',
  text: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

const { width, height } = Dimensions.get('window');

// Erstelle eine separate, memoisierte Komponente für das Rendering der Seiten
const MangaPage = React.memo(({ uri, onPress }: { uri: string; onPress: () => void }) => (
  <TouchableOpacity
    activeOpacity={1}
    onPress={onPress}
    style={styles.pageContainer}
  >
    <Image
      source={{ uri }}
      style={styles.page}
      resizeMode="contain"
    />
  </TouchableOpacity>
));

export default function ReaderScreen() {
  const params = useLocalSearchParams();
  const chapterId = params.chapterId as string;
  const [pages, setPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isRTL, setIsRTL] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [initialScrollIndex, setInitialScrollIndex] = useState<number | null>(null);
  const flatListRef = React.useRef<FlatList>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [manga, setManga] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [nextChapter, setNextChapter] = useState<Chapter | null>(null);
  const [isLastPage, setIsLastPage] = useState(false);

  // Lade alles initial
  useEffect(() => {
    const loadInitialData = async () => {
      if (!chapterId) {
        console.log('Keine Chapter ID verfügbar');
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Lade zuerst Kapitel-Details
        const chapter = await MangaDexApi.getChapter(chapterId);
        setCurrentChapter(chapter);
        
        // Extrahiere Manga ID aus den Kapitel-Beziehungen
        const mangaRelationship = chapter.relationships.find(rel => rel.type === 'manga');
        if (!mangaRelationship) {
          console.error('Keine Manga-Beziehung im Kapitel gefunden');
          return;
        }
        
        const mangaId = mangaRelationship.id;
        
        // Lade Manga-Details und Fortschritt parallel
        const [mangaData, progress] = await Promise.all([
          MangaDexApi.getManga(mangaId),
          MangaProgressService.getReadingProgress(mangaId)
        ]);
        
        setManga(mangaData);
        
        // Prüfe Favoriten-Status
        const favorited = await MangaProgressService.isFavorite(mangaId);
        setIsFavorite(favorited);

        // Setze RTL-Status aus dem Progress
        const rtlStatus = progress?.isRTL || false;
        setIsRTL(rtlStatus);
        
        // Lade Seiten
        const pageUrls = await MangaDexApi.getChapterPages(chapterId);
        const finalPages = rtlStatus ? [...pageUrls].reverse() : pageUrls;
        setPages(finalPages);
        
        // Setze den initialen Scroll-Index
        if (progress && progress.chapterId === chapterId) {
          // Wenn es der gleiche Chapter ist, nutze den gespeicherten Index
          const savedIndex = progress.pageIndex;
          setCurrentPageIndex(savedIndex);
          setInitialScrollIndex(savedIndex);
        } else {
          // Bei einem neuen Kapitel
          const startIndex = rtlStatus ? finalPages.length - 1 : 0;
          setCurrentPageIndex(startIndex);
          setInitialScrollIndex(startIndex);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [chapterId]);

  // Speichere Lesefortschritt bei Seitenwechsel oder RTL-Änderung
  useEffect(() => {
    const saveProgress = async () => {
      if (!manga || !currentChapter) return;
      
      await MangaProgressService.updateReadingProgress({
        mangaId: manga.id,
        chapterId: currentChapter.id,
        pageIndex: currentPageIndex,
        lastReadAt: Date.now(),
        chapterNumber: currentChapter.attributes.chapter || '0',
        isRTL: isRTL,
      });
    };

    saveProgress();
  }, [currentPageIndex, manga, currentChapter, isRTL]);

  const toggleFavorite = async () => {
    if (!manga) return;
    
    try {
      if (isFavorite) {
        await MangaProgressService.removeFavorite(manga.id);
      } else {
        await MangaProgressService.addFavorite(manga);
      }
      
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Fehler beim Togglen des Favoriten:', error);
    }
  };

  const toggleReadingDirection = () => {
    const newIsRTL = !isRTL;
    const currentIndex = currentPageIndex;
    
    // Berechne den neuen Index basierend auf der aktuellen Position
    const newIndex = pages.length - 1 - currentIndex;
    
    setIsRTL(newIsRTL);
    setPages(prev => [...prev].reverse());
    setCurrentPageIndex(newIndex);
    
    // Scrolle zur entsprechenden Position
    flatListRef.current?.scrollToIndex({
      index: newIndex,
      animated: false
    });
  };

  // Füge onViewableItemsChanged hinzu
  const onViewableItemsChanged = React.useCallback(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentPageIndex(viewableItems[0].index);
    }
  }, []);

  const renderPage = React.useCallback(({ item }: { item: string }) => (
    <MangaPage 
      uri={item} 
      onPress={() => setShowControls(!showControls)} 
    />
  ), [showControls]);

  const getItemLayout = (_: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  });

  // Lade das nächste Kapitel
  useEffect(() => {
    const loadNextChapter = async () => {
      if (!manga || !currentChapter) return;
      
      try {
        const chapters = await MangaDexApi.getChapters(manga.id);
        const currentIndex = chapters.findIndex(ch => ch.id === currentChapter.id);
        if (currentIndex < chapters.length - 1) {
          setNextChapter(chapters[currentIndex + 1]);
        }
      } catch (error) {
        console.error('Fehler beim Laden des nächsten Kapitels:', error);
      }
    };

    loadNextChapter();
  }, [manga, currentChapter]);

  // Aktualisiere handlePageChange
  const handlePageChange = React.useCallback(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      const newIndex = viewableItems[0].index;
      setCurrentPageIndex(newIndex);
      setIsLastPage(isRTL ? newIndex === 0 : newIndex === pages.length - 1);
    }
  }, [pages.length, isRTL]);

  const handleNextChapter = () => {
    if (nextChapter && manga) {
      router.replace({
        pathname: "/manga/[id]/reader/[chapterId]",
        params: { id: manga.id, chapterId: nextChapter.id }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor="black"
        translucent
      />
      <Stack.Screen
        options={{
          headerShown: showControls,
          title: currentChapter ? 
            `Kapitel ${currentChapter.attributes.chapter || ''} (${isRTL ? pages.length - currentPageIndex : currentPageIndex + 1}/${pages.length})` : 
            '',
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.text,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerButtons}>
              {isLastPage && nextChapter && (
                <TouchableOpacity 
                  onPress={handleNextChapter}
                  style={styles.headerButton}
                >
                  <Ionicons name="arrow-forward-circle" size={24} color={COLORS.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                onPress={toggleFavorite}
                style={styles.headerButton}
              >
                <Ionicons 
                  name={isFavorite ? "heart" : "heart-outline"} 
                  size={24} 
                  color={COLORS.text} 
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : pages.length === 0 ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Dieses Kapitel ist leider nicht verfügbar.
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={pages}
            renderItem={renderPage}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={handlePageChange}
            viewabilityConfig={{
              itemVisiblePercentThreshold: 50
            }}
            getItemLayout={getItemLayout}
            removeClippedSubviews={true}
            maxToRenderPerBatch={2}
            windowSize={3}
            initialNumToRender={1}
            initialScrollIndex={initialScrollIndex || 0}
          />

          {showControls && (
            <View style={styles.controls}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={toggleReadingDirection}
              >
                <Ionicons 
                  name={isRTL ? "arrow-back" : "arrow-forward"} 
                  size={24} 
                  color={COLORS.text} 
                />
                <Text style={styles.controlText}>
                  {isRTL ? 'RTL' : 'LTR'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageContainer: {
    width,
    height: '100%',
    justifyContent: 'center',
  },
  page: {
    width,
    height: height,
  },
  headerButton: {
    padding: 8,
  },
  controls: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    backgroundColor: COLORS.overlay,
    borderRadius: 8,
    padding: 8,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  controlText: {
    color: COLORS.text,
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.text,
    fontSize: 16,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}); 