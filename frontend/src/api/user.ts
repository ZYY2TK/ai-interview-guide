import api from '../utils/axios';

export const getUsers = (): Promise<string[]> => {
  return api.get('/auth/list') as Promise<string[]>;
};