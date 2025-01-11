const BASE_URL = 'https://api.mangadex.org';

export interface Manga {
  id: string;
  type: string;
  attributes: {
    title: {
      en?: string;
      ja?: string;
    };
    description: {
      en?: string;
      ja?: string;
    };
    status: string;
    year: number | null;
    contentRating: string;
    tags: Array<{
      id: string;
      type: string;
      attributes: {
        name: {
          en: string;
        };
      };
    }>;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: {
      fileName?: string;
    };
  }>;
}

export interface Chapter {
  id: string;
  type: string;
  attributes: {
    volume: string | null;
    chapter: string | null;
    title: string | null;
    pages: number;
    publishAt: string;
    translatedLanguage: string;
  };
  relationships: Array<{
    id: string;
    type: string;
  }>;
}

export const MangaDexApi = {
  // Suche nach Mangas
  searchManga: async (query: string): Promise<Manga[]> => {
    try {
      const response = await fetch(
        `${BASE_URL}/manga?title=${query}&limit=20&includes[]=cover_art`
      );
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Fehler beim Suchen von Manga:', error);
      return [];
    }
  },

  // Beliebte Mangas abrufen
  getPopularManga: async (): Promise<Manga[]> => {
    try {
      const response = await fetch(
        `${BASE_URL}/manga?order[rating]=desc&limit=20&includes[]=cover_art`
      );
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Fehler beim Abrufen beliebter Manga:', error);
      return [];
    }
  },

  // Cover-URL für einen Manga generieren
  getCoverUrl: (manga: Manga): string | null => {
    const coverRelationship = manga.relationships.find(
      (rel) => rel.type === 'cover_art'
    );
    
    if (coverRelationship?.attributes?.fileName) {
      return `https://uploads.mangadex.org/covers/${manga.id}/${coverRelationship.attributes.fileName}`;
    }
    return null;
  },

  // Neue Funktion zum Abrufen der Kapitel
  getChapters: async (mangaId: string, language = 'en'): Promise<Chapter[]> => {
    try {
      const response = await fetch(
        `${BASE_URL}/manga/${mangaId}/feed?translatedLanguage[]=${language}&order[chapter]=asc&limit=100`
      );
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Fehler beim Laden der Kapitel:', error);
      return [];
    }
  },

  // Neue Funktion zum Abrufen der Seiten eines Kapitels
  getChapterPages: async (chapterId: string): Promise<string[]> => {
    try {
      const response = await fetch(
        `${BASE_URL}/at-home/server/${chapterId}`
      );
      const data = await response.json();
      return data.chapter.data.map(
        (page: string) => `${data.baseUrl}/data/${data.chapter.hash}/${page}`
      );
    } catch (error) {
      console.error('Fehler beim Laden der Seiten:', error);
      return [];
    }
  }
}; 