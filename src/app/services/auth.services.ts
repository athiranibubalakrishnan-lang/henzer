import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private loginUrl = 'http://localhost:8080/api/auth/admin/login';

  constructor(private http: HttpClient) {}

  login(data:any): Observable<any>{
    return this.http.post(this.loginUrl, data);
  }

}
