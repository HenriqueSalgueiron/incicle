import { http, HttpResponse } from 'msw';
import { MOCK_USER, MOCK_TOKEN, MOCK_COMPANIES } from './fixtures/auth';

export const handlers = [
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      user: MOCK_USER,
      token: MOCK_TOKEN,
      companies: MOCK_COMPANIES,
    });
  }),
];
