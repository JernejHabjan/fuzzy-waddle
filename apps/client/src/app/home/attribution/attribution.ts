export interface Attribution {
  type: string;
  name: string;
  url?: string;
  reason?: string;
  license?: {
    name?: string;
    url?: string;
  };
  author?: string;
}
