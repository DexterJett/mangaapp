import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BookmarkManga {
  id: string;
  title: string;
  coverUrl: string;
  lastReadChapter?: {
    id: string;
    number: string;
    readAt: number;
  };
  isFavorite: boolean;
}

export interface ReadingProgress {
  mangaId: string;
  chapterId: string;
  chapterNumber: string;
  readAt: number;
}

const STORAGE_KEYS = {
  BOOKMARKS: '@manga_bookmarks',
  READING_PROGRESS: '@manga_reading_progress',
};

export const BookmarkService = {
  // Favoriten verwalten
  toggleFavorite: async (manga: BookmarkManga): Promise<boolean> => {
    try {
      const bookmarks = await BookmarkService.getBookmarks();
      const existingIndex = bookmarks.findIndex(b => b.id === manga.id);
      
      if (existingIndex >= 0) {
        bookmarks[existingIndex].isFavorite = !bookmarks[existingIndex].isFavorite;
      } else {
        bookmarks.push({ ...manga, isFavorite: true });
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
      return true;
    } catch (error) {
      console.error('Fehler beim Speichern des Favoriten:', error);
      return false;
    }
  },

  // Lesefortschritt speichern
  saveReadingProgress: async (progress: ReadingProgress): Promise<boolean> => {
    try {
      const history = await BookmarkService.getReadingProgress();
      const existingIndex = history.findIndex(h => h.mangaId === progress.mangaId);
      
      if (existingIndex >= 0) {
        history[existingIndex] = progress;
      } else {
        history.push(progress);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.READING_PROGRESS, JSON.stringify(history));
      
      // Aktualisiere auch das Lesezeichen
      const bookmarks = await BookmarkService.getBookmarks();
      const bookmarkIndex = bookmarks.findIndex(b => b.id === progress.mangaId);
      if (bookmarkIndex >= 0) {
        bookmarks[bookmarkIndex].lastReadChapter = {
          id: progress.chapterId,
          number: progress.chapterNumber,
          readAt: progress.readAt,
        };
        await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
      }
      
      return true;
    } catch (error) {
      console.error('Fehler beim Speichern des Lesefortschritts:', error);
      return false;
    }
  },

  // Alle Lesezeichen abrufen
  getBookmarks: async (): Promise<BookmarkManga[]> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Fehler beim Laden der Lesezeichen:', error);
      return [];
    }
  },

  // Lesefortschritt abrufen
  getReadingProgress: async (): Promise<ReadingProgress[]> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.READING_PROGRESS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Fehler beim Laden des Lesefortschritts:', error);
      return [];
    }
  },

  // Lesefortschritt für einen bestimmten Manga abrufen
  getMangaProgress: async (mangaId: string): Promise<ReadingProgress | null> => {
    try {
      const history = await BookmarkService.getReadingProgress();
      return history.find(h => h.mangaId === mangaId) || null;
    } catch (error) {
      console.error('Fehler beim Laden des Manga-Fortschritts:', error);
      return null;
    }
  },

  // Zuletzt gelesene Mangas abrufen
  getRecentlyRead: async (limit = 10): Promise<ReadingProgress[]> => {
    try {
      const history = await BookmarkService.getReadingProgress();
      return history
        .sort((a, b) => b.readAt - a.readAt)
        .slice(0, limit);
    } catch (error) {
      console.error('Fehler beim Laden der zuletzt gelesenen:', error);
      return [];
    }
  }
}; 