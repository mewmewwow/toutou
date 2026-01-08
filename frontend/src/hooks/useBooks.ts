import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '../services/api';

// Types matching API contracts
export interface Book {
  id: string;
  name: string;
  code: string;
  description: string | null;
  totalWords: number;
  totalUnits: number;
  isFree: boolean;
  coverImage: string | null;
}

export interface UnitInfo {
  number: number;
  wordCount: number;
  isAccessible: boolean;
}

export interface BookDetail extends Book {
  units: UnitInfo[];
}

export interface WordDefinition {
  pos: string;
  meaning: string;
}

export interface Sentence {
  id: string;
  contentEn: string;
  contentCn: string;
  isPrimary: boolean;
  audioUrl: string | null;
}

export interface Word {
  id: string;
  word: string;
  phoneticUs: string | null;
  phoneticUk: string | null;
  audioUs: string | null;
  audioUk: string | null;
  definitions: WordDefinition[];
  sentences: Sentence[];
}

/**
 * Fetch all books
 */
async function fetchBooks(isFree?: boolean): Promise<Book[]> {
  const params = isFree !== undefined ? { isFree: String(isFree) } : {};
  const response = await api.get<Book[]>('/books', { params });
  return response.data;
}

/**
 * Fetch book details with units
 */
async function fetchBookDetail(bookId: string): Promise<BookDetail> {
  const response = await api.get<BookDetail>(`/books/${bookId}`);
  return response.data;
}

/**
 * Fetch words for a unit
 */
async function fetchUnitWords(
  bookId: string,
  unitNumber: number,
): Promise<Word[]> {
  const response = await api.get<Word[]>(
    `/books/${bookId}/units/${unitNumber}/words`,
  );
  return response.data;
}

/**
 * Hook to fetch all books
 */
export function useBooks(isFree?: boolean): UseQueryResult<Book[], Error> {
  return useQuery({
    queryKey: ['books', { isFree }],
    queryFn: () => fetchBooks(isFree),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch book details
 */
export function useBookDetail(
  bookId: string | undefined,
): UseQueryResult<BookDetail, Error> {
  return useQuery({
    queryKey: ['book', bookId],
    queryFn: () => fetchBookDetail(bookId!),
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch unit words
 */
export function useUnitWords(
  bookId: string | undefined,
  unitNumber: number | undefined,
): UseQueryResult<Word[], Error> {
  return useQuery({
    queryKey: ['words', bookId, unitNumber],
    queryFn: () => fetchUnitWords(bookId!, unitNumber!),
    enabled: !!bookId && unitNumber !== undefined,
    staleTime: 10 * 60 * 1000, // 10 minutes - words don't change often
  });
}
