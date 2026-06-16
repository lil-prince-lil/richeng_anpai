export interface ParsedEntry {
  title: string;
  person: string | null;
  location: string | null;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
  needsConfirm: boolean;
}

export interface Schedule {
  id: string;
  title: string;
  person: string | null;
  location: string | null;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
  rawText: string | null;
  source: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
