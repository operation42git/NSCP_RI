import { UserInfos } from '../models/user-infos';

export interface MockUser extends UserInfos {
  label: string;
  country: string;
}

export const MOCK_USERS: MockUser[] = [
  {
    label: 'HR Authority Officer',
    country: 'HR',
    email: 'officer@hr.efti.eu',
    sub: 'hr-officer',
    roles: ['authority']
  },
  {
    label: 'AT Authority Officer',
    country: 'AT',
    email: 'officer@at.efti.eu',
    sub: 'at-officer',
    roles: ['authority']
  },
  {
    label: 'SI Authority Officer',
    country: 'SI',
    email: 'officer@si.efti.eu',
    sub: 'si-officer',
    roles: ['authority']
  },
  {
    label: 'FR Authority Officer',
    country: 'FR',
    email: 'officer@fr.efti.eu',
    sub: 'fr-officer',
    roles: ['authority']
  }
];

export const DEFAULT_MOCK_USER = MOCK_USERS[0];
