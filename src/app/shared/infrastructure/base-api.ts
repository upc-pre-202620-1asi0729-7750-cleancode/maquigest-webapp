import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

export abstract class BaseApi {
  protected readonly http = inject(HttpClient);
}
