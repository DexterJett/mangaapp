import axios from 'axios';
import qs from 'qs';
import { MANGADEX_CLIENT_ID, MANGADEX_CLIENT_SECRET } from '@env';

const AUTH_URL = 'https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token';
const API_URL = 'https://api.mangadex.org';

// Konfiguration für den Client
const CLIENT_CONFIG = {
  client_id: MANGADEX_CLIENT_ID,
  client_secret: MANGADEX_CLIENT_SECRET,
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

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
  auth: {
    tokens: null as AuthTokens | null,

    login: async (username: string, password: string): Promise<boolean> => {
      try {
        const response = await axios.post(AUTH_URL, 
          qs.stringify({
            grant_type: 'password',
            username,
            password,
            client_id: CLIENT_CONFIG.client_id,
            client_secret: CLIENT_CONFIG.client_secret,
          }), 
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        MangaDexApi.auth.tokens = {
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
        };

        // Setze den Auth-Header für alle zukünftigen API-Requests
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        return true;
      } catch (error) {
        console.error('Login Fehler:', error);
        return false;
      }
    },

    refreshToken: async (): Promise<boolean> => {
      if (!MangaDexApi.auth.tokens?.refresh_token) return false;

      try {
        const response = await axios.post(AUTH_URL,
          qs.stringify({
            grant_type: 'refresh_token',
            refresh_token: MangaDexApi.auth.tokens.refresh_token,
            client_id: CLIENT_CONFIG.client_id,
            client_secret: CLIENT_CONFIG.client_secret,
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        MangaDexApi.auth.tokens = {
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token || MangaDexApi.auth.tokens.refresh_token,
        };

        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        return true;
      } catch (error) {
        console.error('Token Refresh Fehler:', error);
        return false;
      }
    },

    // Interceptor für automatisches Token-Refresh
    setupTokenRefresh: () => {
      api.interceptors.response.use(
        (response) => response,
        async (error) => {
          if (error.response?.status === 401) {
            const success = await MangaDexApi.auth.refreshToken();
            if (success) {
              // Wiederhole den ursprünglichen Request mit dem neuen Token
              const originalRequest = error.config;
              return api(originalRequest);
            }
          }
          return Promise.reject(error);
        }
      );
    },
  },

  searchManga: async (query: string): Promise<Manga[]> => {
    try {
      const response = await api.get('/manga', {
        params: {
          title: query,
          limit: 20,
          includes: ['cover_art'],
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Fehler beim Suchen von Manga:', error);
      return [];
    }
  },

  getPopularManga: async (): Promise<Manga[]> => {
    try {
      const response = await api.get('/manga', {
        params: {
          'order[rating]': 'desc',
          limit: 20,
          includes: ['cover_art'],
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Fehler beim Abrufen beliebter Manga:', error);
      return [];
    }
  },

  getChapters: async (mangaId: string, language = 'en'): Promise<Chapter[]> => {
    try {
      const response = await api.get(`/manga/${mangaId}/feed`, {
        params: {
          'translatedLanguage[]': language,
          'order[chapter]': 'asc',
          limit: 100,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Fehler beim Laden der Kapitel:', error);
      return [];
    }
  },

  getChapterPages: async (chapterId: string): Promise<string[]> => {
    try {
      const response = await api.get(`/at-home/server/${chapterId}`);
      const { baseUrl, chapter } = response.data;
      
      if (!chapter?.dataSaver?.length) {
        console.warn('Kapitel nicht verfügbar');
        return [];
      }
      
      return chapter.dataSaver.map(
        (page: string) => `${baseUrl}/data-saver/${chapter.hash}/${page}`
      );
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn('Kapitel wurde nicht gefunden oder ist nicht verfügbar');
      } else {
        console.error('Fehler beim Laden der Seiten:', error);
      }
      return [];
    }
  },

  getCoverUrl: (manga: Manga): string | null => {
    const coverRelationship = manga.relationships.find(
      (rel) => rel.type === 'cover_art'
    );
    
    if (coverRelationship?.attributes?.fileName) {
      return `https://uploads.mangadex.org/covers/${manga.id}/${coverRelationship.attributes.fileName}`;
    }
    return null;
  },

  getManga: async (mangaId: string): Promise<Manga> => {
    try {
      const response = await api.get(`/manga/${mangaId}`, {
        params: {
          includes: ['cover_art'],
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Fehler beim Laden des Mangas:', error);
      throw error;
    }
  },

  getChapter: async (chapterId: string): Promise<Chapter> => {
    const response = await api.get(`/chapter/${chapterId}`);
    return response.data.data;
  }
};

// Setup des Token-Refresh-Interceptors
MangaDexApi.auth.setupTokenRefresh(); 