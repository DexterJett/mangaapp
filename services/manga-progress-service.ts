import AsyncStorage from '@react-native-async-storage/async-storage';
import { Manga } from './mangadex-api';

const FAVORITES_KEY = '@manga_favorites';
const READING_PROGRESS_KEY = '@manga_reading_progress';

export interface ReadingProgress {
  mangaId: string;
  chapterId: string;
  pageIndex: number;
  lastReadAt: number;
  chapterNumber: string;
  isRTL?: boolean;
}

export interface FavoriteManga extends Manga {
  addedAt: number;
}

export const MangaProgressService = {
  // Favoriten-Verwaltung
  async addFavorite(manga: Manga): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const favorite: FavoriteManga = {
        ...manga,
        addedAt: Date.now(),
      };
      
      const updatedFavorites = [favorite, ...favorites.filter(f => f.id !== manga.id)];
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Fehler beim Speichern des Favoriten:', error);
      throw error;
    }
  },

  async removeFavorite(mangaId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const updatedFavorites = favorites.filter(f => f.id !== mangaId);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Fehler beim Entfernen des Favoriten:', error);
      throw error;
    }
  },

  async getFavorites(): Promise<FavoriteManga[]> {
    try {
      const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
      return favoritesJson ? JSON.parse(favoritesJson) : [];
    } catch (error) {
      console.error('Fehler beim Laden der Favoriten:', error);
      return [];
    }
  },

  async isFavorite(mangaId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.some(f => f.id === mangaId);
  },

  // Lesefortschritt-Verwaltung
  async updateReadingProgress(progress: ReadingProgress): Promise<void> {
    try {
      const allProgress = await this.getAllReadingProgress();
      const updatedProgress = {
        ...allProgress,
        [progress.mangaId]: progress,
      };
      await AsyncStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(updatedProgress));
    } catch (error) {
      console.error('Fehler beim Speichern des Lesefortschritts:', error);
      throw error;
    }
  },

  async getReadingProgress(mangaId: string): Promise<ReadingProgress | null> {
    try {
      const allProgress = await this.getAllReadingProgress();
      return allProgress[mangaId] || null;
    } catch (error) {
      console.error('Fehler beim Laden des Lesefortschritts:', error);
      return null;
    }
  },

  async getAllReadingProgress(): Promise<Record<string, ReadingProgress>> {
    try {
      const progressJson = await AsyncStorage.getItem(READING_PROGRESS_KEY);
      return progressJson ? JSON.parse(progressJson) : {};
    } catch (error) {
      console.error('Fehler beim Laden aller Lesefortschritte:', error);
      return {};
    }
  },

  async getRecentlyRead(limit: number = 10): Promise<ReadingProgress[]> {
    try {
      const allProgress = await this.getAllReadingProgress();
      return Object.values(allProgress)
        .sort((a, b) => b.lastReadAt - a.lastReadAt)
        .slice(0, limit);
    } catch (error) {
      console.error('Fehler beim Laden der zuletzt gelesenen Manga:', error);
      return [];
    }
  }
}; 