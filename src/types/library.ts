export interface Collection {
  id: string;
  name: string;
  description: string;
  prompt_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: string;
  collection_id: string;
  name: string;
  content: string;
  single_line: string;
  created_at: string;
  updated_at: string;
}
