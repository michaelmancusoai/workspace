// app/types/types.ts

// Define the structure of each capability
export type CapabilityData = {
  id: string;
  desc: string;
  score: number;
  children?: Record<string, CapabilityData>;
  matched?: boolean;
};

// Define the structure of each CSV row
export type CSVRow = {
  Level1: string;
  Level1_ID: string;
  Level1_Desc: string;
  Level2?: string;
  Level2_ID?: string;
  Level2_Desc?: string;
  Level3?: string;
  Level3_ID?: string;
  Level3_Desc?: string;
  Level4?: string;
  Level4_ID?: string;
  Level4_Desc?: string;
  Score: number;
};
