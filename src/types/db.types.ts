// src/types.ts
export interface Technique {
  id: string;
  name: string;
  description: string;
  matrix: 'enterprise' | 'mobile' | 'ics';
}