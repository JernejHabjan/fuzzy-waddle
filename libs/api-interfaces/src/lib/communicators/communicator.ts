export interface CommunicatorEvent<T, K> {
  gameInstanceId?: string;
  communicator: K;
  payload: T;
}
