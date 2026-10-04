export interface Attribution {
  type: string;
  name: string;
  url?: string;
  reason?: string;
  obtained?: string;
  license?: {
    name?: string;
    url?: string;
  };
  author?: string;
}
