import { Injectable } from '@angular/core';
import { Message } from '@fuzzy-waddle/api-interfaces';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProbableWafflePlaygroundService {
  constructor(private http: HttpClient) {}

  getData() {
    return this.http.get<Message>(environment.api + 'api/hello');
  }
}
