import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { FlatList } from 'react-native-gesture-handler';
import { MangaDexApi } from '../../../../services/mangadex-api';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#FF6B00',
  secondary: '#000000',
  background: '#000000', // Dunkler Hintergrund für besseres Lesen
  text: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

const { width, height } = Dimensions.get('window');

export default function ReaderScreen() {
  const { chapterId } = useLocalSearchParams();
  const [pages, setPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    loadChapterPages();
  }, [chapterId]);

  const loadChapterPages = async () => {
    if (!chapterId) return;
    setIsLoading(true);
    try {
      const pageUrls = await MangaDexApi.getChapterPages(chapterId as string);
      setPages(pageUrls);
    } catch (error) {
      console.error('Fehler beim Laden der Seiten:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const renderPage = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      activeOpacity={1}
      onPress={toggleControls}
      style={styles.pageContainer}
    >
      <Image
        source={{ uri: item }}
        style={styles.page}
        resizeMode="contain"
      />
      {showControls && (
        <View style={styles.pageNumberContainer}>
          <Text style={styles.pageNumber}>
            {index + 1} / {pages.length}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const onViewableItemsChanged = React.useCallback(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentPage(viewableItems[0].index + 1);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: showControls,
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
        <FlatList
          data={pages}
          renderItem={renderPage}
          keyExtractor={(item, index) => index.toString()}
          pagingEnabled
          horizontal
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 50,
          }}
        />
      )}

      {showControls && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.navButton, styles.leftButton]}
            onPress={() => {/* Vorheriges Kapitel */}}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            <Text style={styles.navButtonText}>Vorheriges</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, styles.rightButton]}
            onPress={() => {/* Nächstes Kapitel */}}
          >
            <Text style={styles.navButtonText}>Nächstes</Text>
            <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
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
  pageNumberContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.overlay,
    padding: 8,
    borderRadius: 8,
  },
  pageNumber: {
    color: COLORS.text,
    fontSize: 14,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.overlay,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  leftButton: {
    marginRight: 'auto',
  },
  rightButton: {
    marginLeft: 'auto',
  },
  navButtonText: {
    color: COLORS.text,
    fontSize: 16,
    marginHorizontal: 4,
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
}); 