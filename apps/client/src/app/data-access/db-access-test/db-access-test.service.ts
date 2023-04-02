import { Injectable } from '@angular/core';
import { DataAccessService } from '../data-access.service';

@Injectable({
  providedIn: 'root'
})
export class DbAccessTestService {
  constructor(private dataAccessService: DataAccessService) {}

  get(): void {
    this.dataAccessService.supabase
      .from('test')
      .select('*')
      .then((data) => {
        console.table(data.data);
      });
  }

  add(): void {
    this.dataAccessService.supabase
      .from('test')
      .insert({ text: 'test from frontend' })
      .then((data) => {
        console.log(data);
      });
  }
}
