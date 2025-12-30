
export interface WordDefinition {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  chineseTranslation: string;
  examples: Array<{
    en: string;
    cn: string;
  }>;
  synonyms: string[];
  antonyms: string[];
  grammarNotes: string;
}

export interface HistoryItem {
  word: string;
  timestamp: number;
}

export interface ExternalSource {
  name: string;
  url: string;
  icon: string;
}
