export interface IChatService {
  postMessage(text: string): Promise<void>;
}
