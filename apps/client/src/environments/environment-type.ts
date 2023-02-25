export type Environment = {
  production: boolean;
  api: string;

  supabase:{
    url: string;
    key: string;
  }
}
