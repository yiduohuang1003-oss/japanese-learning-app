import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Word, ImageItem, LinkItem, WordCategory } from '../types';

interface AppContextType {
  words: Word[];
  addWord: (word: Omit<Word, 'id' | 'createdAt'>) => void;
  updateWord: (id: string, updates: Partial<Word>) => void;
  deleteWord: (id: string) => void;
  
  images: ImageItem[];
  addImage: (image: Omit<ImageItem, 'id' | 'createdAt'>) => void;
  updateImage: (id: string, updates: Partial<ImageItem>) => void;
  deleteImage: (id: string) => void;
  deleteImages: (ids: string[]) => void;
  
  links: LinkItem[];
  addLink: (link: Omit<LinkItem, 'id' | 'createdAt'>) => void;
  updateLink: (id: string, updates: Partial<LinkItem>) => void;
  deleteLink: (id: string) => void;
  deleteLinks: (ids: string[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [words, setWords] = useLocalStorage<Word[]>('words', []);
  const [images, setImages] = useLocalStorage<ImageItem[]>('images', []);
  const [links, setLinks] = useLocalStorage<LinkItem[]>('links', []);

  const addWord = (wordData: Omit<Word, 'id' | 'createdAt'>) => {
    const newWord: Word = {
      ...wordData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setWords(prev => [...prev, newWord]);
  };

  const updateWord = (id: string, updates: Partial<Word>) => {
    setWords(prev => prev.map(word => 
      word.id === id ? { ...word, ...updates } : word
    ));
  };

  const deleteWord = (id: string) => {
    setWords(prev => prev.filter(word => word.id !== id));
  };

  const addImage = (imageData: Omit<ImageItem, 'id' | 'createdAt'>) => {
    const newImage: ImageItem = {
      ...imageData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setImages(prev => [...prev, newImage]);
  };

  const updateImage = (id: string, updates: Partial<ImageItem>) => {
    setImages(prev => prev.map(image => 
      image.id === id ? { ...image, ...updates } : image
    ));
  };

  const deleteImage = (id: string) => {
    setImages(prev => prev.filter(image => image.id !== id));
  };

  const deleteImages = (ids: string[]) => {
    setImages(prev => prev.filter(image => !ids.includes(image.id)));
  };

  const addLink = (linkData: Omit<LinkItem, 'id' | 'createdAt'>) => {
    const newLink: LinkItem = {
      ...linkData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setLinks(prev => [...prev, newLink]);
  };

  const updateLink = (id: string, updates: Partial<LinkItem>) => {
    setLinks(prev => prev.map(link => 
      link.id === id ? { ...link, ...updates } : link
    ));
  };

  const deleteLink = (id: string) => {
    setLinks(prev => prev.filter(link => link.id !== id));
  };

  const deleteLinks = (ids: string[]) => {
    setLinks(prev => prev.filter(link => !ids.includes(link.id)));
  };

  return (
    <AppContext.Provider value={{
      words,
      addWord,
      updateWord,
      deleteWord,
      images,
      addImage,
      updateImage,
      deleteImage,
      deleteImages,
      links,
      addLink,
      updateLink,
      deleteLink,
      deleteLinks,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
