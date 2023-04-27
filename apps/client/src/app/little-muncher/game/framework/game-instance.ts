export class GameInstance {
  id: string;

  constructor(id: string | null = null) {
    if (id) {
      this.id = id;
      return;
    }
    this.id = this.generateRandomId(20);
  }

  generateRandomId(length: number): string {
    // todo move this later?
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
  }
}
