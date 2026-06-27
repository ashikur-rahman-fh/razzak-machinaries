import { describe, expect, it } from 'vitest';

import { API_ROUTES } from '../constants/routes';
import { adminHalkhataInvitationsApi } from './admin-halkhata-invitations';

describe('adminHalkhataInvitationsApi routes', () => {
  it('maps invitation endpoints', () => {
    expect(API_ROUTES.adminHalkhatas.invitations(1)).toBe('/api/admin/halkhatas/1/invitations/');
    expect(API_ROUTES.adminHalkhatas.invitationCustomers(1)).toBe(
      '/api/admin/halkhatas/1/invitations/customers/',
    );
    expect(API_ROUTES.adminHalkhatas.invitationGenerations(1)).toBe(
      '/api/admin/halkhatas/1/invitations/generations/',
    );
    expect(API_ROUTES.adminHalkhatas.invitationGenerationDetail(1, 10)).toBe(
      '/api/admin/halkhatas/1/invitations/generations/10/',
    );
  });

  it('exports API client methods', () => {
    expect(typeof adminHalkhataInvitationsApi.getInvitationPageContext).toBe('function');
    expect(typeof adminHalkhataInvitationsApi.listInvitationCustomers).toBe('function');
    expect(typeof adminHalkhataInvitationsApi.createInvitationGeneration).toBe('function');
    expect(typeof adminHalkhataInvitationsApi.getInvitationGeneration).toBe('function');
  });
});
