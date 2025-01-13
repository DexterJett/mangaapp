import AsyncStorage from '@react-native-async-storage/async-storage';
import { Manga } from './mangadex-api';

const BOOKMARKS_KEY = '@manga_bookmarks';

export interface BookmarkedManga extends Manga {
  lastReadChapter?: string;
  bookmarkedAt: number;
}

export const BookmarkService = {
  async addBookmark(manga: Manga, lastReadChapter?: string): Promise<void> {
    try {
      console.log('Starte addBookmark für:', manga.id);
      const bookmarks = await this.getBookmarks();
      const bookmark: BookmarkedManga = {
        ...manga,
        lastReadChapter,
        bookmarkedAt: Date.now(),
      };
      
      const updatedBookmarks = [bookmark, ...bookmarks.filter(b => b.id !== manga.id)];
      console.log('Speichere Lesezeichen. Neue Anzahl:', updatedBookmarks.length);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updatedBookmarks));
      console.log('Lesezeichen erfolgreich gespeichert');
    } catch (error) {
      console.error('Fehler beim Speichern des Lesezeichens:', error);
      throw error;
    }
  },

  async removeBookmark(mangaId: string): Promise<void> {
    try {
      console.log('Starte removeBookmark für:', mangaId);
      const bookmarks = await this.getBookmarks();
      const updatedBookmarks = bookmarks.filter(b => b.id !== mangaId);
      console.log('Entferne Lesezeichen. Neue Anzahl:', updatedBookmarks.length);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updatedBookmarks));
      console.log('Lesezeichen erfolgreich entfernt');
    } catch (error) {
      console.error('Fehler beim Entfernen des Lesezeichens:', error);
      throw error;
    }
  },

  async getBookmarks(): Promise<BookmarkedManga[]> {
    try {
      console.log('Lade Lesezeichen...');
      const bookmarksJson = await AsyncStorage.getItem(BOOKMARKS_KEY);
      const bookmarks = bookmarksJson ? JSON.parse(bookmarksJson) : [];
      console.log('Lesezeichen geladen. Anzahl:', bookmarks.length);
      return bookmarks;
    } catch (error) {
      console.error('Fehler beim Laden der Lesezeichen:', error);
      return [];
    }
  },

  async isBookmarked(mangaId: string): Promise<boolean> {
    try {
      console.log('Prüfe Lesezeichen-Status für:', mangaId);
      const bookmarks = await this.getBookmarks();
      const isBookmarked = bookmarks.some(b => b.id === mangaId);
      console.log('Lesezeichen-Status:', isBookmarked);
      return isBookmarked;
    } catch (error) {
      console.error('Fehler beim Prüfen des Lesezeichen-Status:', error);
      return false;
    }
  }
}; 