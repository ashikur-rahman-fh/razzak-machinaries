import {
  DISPLAY_MODE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
  type LanguagePreference,
} from '@razzak-machinaries/shared/i18n';
import { render, screen, waitFor, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangePasswordPage } from './src/app/change-password/ChangePasswordPage';
import { AdminProfilePage } from './src/app/AdminProfilePage';
import { LoginPage } from './src/app/login/LoginPage';
import { AdminAuthProvider } from './src/auth/AdminAuthProvider';
import { ADMIN_AUTH_COPY } from './src/auth/messages';
import { BRAND_LOGO_ALT } from '@razzak-machinaries/shared/ui';
import { adminTranslationsBn, adminTranslationsEn } from './src/i18n/translations';
import { adminUser, server } from './vitest.setup';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: vi.fn(),
  }),
  usePathname: () => '/profile',
}));

function setLanguagePreference(preference: LanguagePreference) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, preference.language);
  localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, preference.displayMode);
}

function renderWithAuth(
  ui: ReactElement,
  preference: LanguagePreference = { language: 'en', displayMode: 'en' },
) {
  setLanguagePreference(preference);
  return render(
    <LanguageProvider catalogs={{ en: adminTranslationsEn, bn: adminTranslationsBn }}>
      <AdminAuthProvider>{ui}</AdminAuthProvider>
    </LanguageProvider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    replaceMock.mockClear();
  });

  it('renders login page with accessible fields', async () => {
    renderWithAuth(<LoginPage />);
    expect(await screen.findByTestId('admin-login-page')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: BRAND_LOGO_ALT })).toBeInTheDocument();
    expect(screen.getByLabelText(ADMIN_AUTH_COPY.usernameOrEmailLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(ADMIN_AUTH_COPY.passwordLabel)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ADMIN_AUTH_COPY.signIn })).toBeInTheDocument();
  });

  it('does not render language switcher on login', async () => {
    renderWithAuth(<LoginPage />);
    await screen.findByTestId('admin-login-page');
    expect(screen.queryByRole('button', { name: 'Both' })).not.toBeInTheDocument();
  });

  it('disables submit when required fields are empty', async () => {
    renderWithAuth(<LoginPage />);
    await screen.findByTestId('admin-login-page');
    expect(screen.getByRole('button', { name: ADMIN_AUTH_COPY.signIn })).toBeDisabled();
  });

  it('disables submit while loading', async () => {
    let resolveLogin!: () => void;
    const pending = new Promise<void>((resolve) => {
      resolveLogin = resolve;
    });
    server.use(
      http.post('*/api/admin/auth/login/', async () => {
        await pending;
        return HttpResponse.json(adminUser);
      }),
    );

    const user = userEvent.setup();
    renderWithAuth(<LoginPage />);
    await screen.findByTestId('admin-login-page');

    await user.type(screen.getByLabelText(ADMIN_AUTH_COPY.usernameOrEmailLabel), 'admin');
    await user.type(screen.getByLabelText(ADMIN_AUTH_COPY.passwordLabel), 'correct');
    await user.click(screen.getByRole('button', { name: ADMIN_AUTH_COPY.signIn }));

    expect(screen.getByRole('button', { name: ADMIN_AUTH_COPY.signingIn })).toBeDisabled();
    resolveLogin();
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/');
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginPage />);
    await screen.findByTestId('admin-login-page');

    const password = screen.getByLabelText(ADMIN_AUTH_COPY.passwordLabel);
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: ADMIN_AUTH_COPY.showPassword }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: ADMIN_AUTH_COPY.hidePassword }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('shows friendly error on failed login without raw API text', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginPage />);
    await screen.findByTestId('admin-login-page');

    await user.type(screen.getByLabelText(ADMIN_AUTH_COPY.usernameOrEmailLabel), 'admin');
    await user.type(screen.getByLabelText(ADMIN_AUTH_COPY.passwordLabel), 'wrong');
    await user.click(screen.getByRole('button', { name: ADMIN_AUTH_COPY.signIn }));

    expect(await screen.findByText(ADMIN_AUTH_COPY.invalidLogin)).toBeInTheDocument();
    expect(screen.queryByText(/INVALID_CREDENTIALS/i)).not.toBeInTheDocument();
  });

  it('redirects to profile after successful login', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginPage />);
    await screen.findByTestId('admin-login-page');

    await user.type(screen.getByLabelText(ADMIN_AUTH_COPY.usernameOrEmailLabel), 'admin');
    await user.type(screen.getByLabelText(ADMIN_AUTH_COPY.passwordLabel), 'correct');
    await user.click(screen.getByRole('button', { name: ADMIN_AUTH_COPY.signIn }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/');
    });
  });
});

describe('Admin profile and route guards', () => {
  beforeEach(() => {
    replaceMock.mockClear();
  });

  it('redirects unauthenticated users away from profile', async () => {
    renderWithAuth(<AdminProfilePage />);
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
    expect(screen.queryByTestId('admin-profile-name')).not.toBeInTheDocument();
  });

  it('shows loading state while checking auth', () => {
    renderWithAuth(<AdminProfilePage />);
    expect(screen.getByTestId('admin-auth-loading')).toBeInTheDocument();
  });

  it('renders profile for authenticated user', async () => {
    server.use(http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)));

    renderWithAuth(<AdminProfilePage />);

    expect(await screen.findByTestId('admin-profile-name')).toHaveTextContent(adminUser.name);
    expect(screen.getByTestId('admin-profile-username')).toHaveTextContent(adminUser.username);
    expect(screen.getByTestId('admin-profile-email')).toHaveTextContent(adminUser.email);
    expect(screen.getByTestId('admin-profile-staff-badge')).toHaveTextContent(
      adminTranslationsEn['profile.staffYes'],
    );
    expect(screen.getByTestId('admin-profile-superuser-badge')).toHaveTextContent(
      adminTranslationsEn['profile.superuserYes'],
    );
  });

  it('shows inactive staff badge when user is not staff', async () => {
    server.use(
      http.get('*/api/admin/auth/me/', () =>
        HttpResponse.json({ ...adminUser, isStaff: false, isSuperuser: true }),
      ),
    );

    renderWithAuth(<AdminProfilePage />);
    await screen.findByTestId('admin-profile-name');

    expect(screen.getByTestId('admin-profile-staff-badge')).toHaveTextContent(
      adminTranslationsEn['profile.staffNo'],
    );
    expect(screen.getByTestId('admin-profile-superuser-badge')).toHaveTextContent(
      adminTranslationsEn['profile.superuserYes'],
    );
  });

  it('shows both languages on profile when display mode is both', async () => {
    server.use(http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)));

    const user = userEvent.setup();
    renderWithAuth(<AdminProfilePage />, { language: 'en', displayMode: 'both' });
    await screen.findByTestId('admin-profile-name');

    await user.click(screen.getByRole('button', { name: 'Both' }));

    expect(await screen.findByText(adminTranslationsEn['profile.title'])).toHaveAttribute(
      'lang',
      'en',
    );
    expect(screen.getByText(adminTranslationsBn['profile.title'])).toHaveAttribute('lang', 'bn');
    expect(screen.getByTestId('admin-profile-staff-badge')).toHaveTextContent(
      adminTranslationsEn['profile.staffYes'],
    );
    expect(screen.getByText(adminTranslationsBn['profile.staffYes'])).toHaveAttribute('lang', 'bn');
    expect(screen.getByText(adminTranslationsBn['profile.superuserYes'])).toHaveAttribute(
      'lang',
      'bn',
    );
    expect(screen.getByText(adminTranslationsEn['profile.name'])).toHaveAttribute('lang', 'en');
    expect(screen.getByText(adminTranslationsBn['profile.name'])).toHaveAttribute('lang', 'bn');
    expect(screen.getByText(adminTranslationsEn['profile.username'])).toHaveAttribute('lang', 'en');
    expect(screen.getByText(adminTranslationsBn['profile.username'])).toHaveAttribute('lang', 'bn');
    expect(screen.getByText(adminTranslationsEn['profile.email'])).toHaveAttribute('lang', 'en');
    expect(screen.getByText(adminTranslationsBn['profile.email'])).toHaveAttribute('lang', 'bn');
  });

  it('redirects authenticated users away from login page', async () => {
    server.use(http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)));

    renderWithAuth(<LoginPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/');
    });
  });

  it('logout clears session and redirects to login', async () => {
    server.use(http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)));

    const user = userEvent.setup();
    renderWithAuth(<AdminProfilePage />);
    await screen.findByTestId('admin-profile-name');

    await user.click(
      screen.getByRole('button', { name: new RegExp(adminTranslationsEn['profile.logout']) }),
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
  });

  it('shows both languages on link buttons when display mode is both', async () => {
    server.use(http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)));

    renderWithAuth(<AdminProfilePage />, { language: 'en', displayMode: 'both' });
    await screen.findByTestId('admin-profile-name');

    const changePasswordLink = screen.getByRole('link', {
      name: new RegExp(adminTranslationsEn['password.changePassword']),
    });
    expect(changePasswordLink).toHaveAttribute('data-slot', 'button');
    expect(screen.getByText(adminTranslationsBn['password.changePassword'])).toHaveAttribute(
      'lang',
      'bn',
    );
  });

  it('shows permission message when me returns forbidden', async () => {
    server.use(
      http.get('*/api/admin/auth/me/', () =>
        HttpResponse.json(
          {
            success: false,
            error: {
              code: 'ADMIN_FORBIDDEN',
              message: ADMIN_AUTH_COPY.unauthorized,
              details: {},
            },
          },
          { status: 403 },
        ),
      ),
    );

    renderWithAuth(<AdminProfilePage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
  });

  it('opens edit profile form with current values and saves', async () => {
    let profile = { ...adminUser };
    server.use(
      http.get('*/api/admin/auth/me/', () => HttpResponse.json(profile)),
      http.patch('*/api/admin/auth/me/', async ({ request }) => {
        const body = (await request.json()) as {
          firstName?: string;
          lastName?: string;
          email?: string;
        };
        profile = {
          ...profile,
          firstName: body.firstName ?? profile.firstName,
          lastName: body.lastName ?? profile.lastName,
          email: body.email ?? profile.email,
          name: `${body.firstName ?? profile.firstName} ${body.lastName ?? profile.lastName}`,
        };
        return HttpResponse.json(profile);
      }),
    );

    const user = userEvent.setup();
    renderWithAuth(<AdminProfilePage />);
    await screen.findByTestId('admin-profile-name');

    await user.click(
      screen.getByRole('button', { name: adminTranslationsEn['profile.editProfile'] }),
    );
    expect(screen.getByLabelText(adminTranslationsEn['profile.firstName'])).toHaveValue(
      adminUser.firstName,
    );
    expect(screen.getByLabelText(adminTranslationsEn['profile.email'])).toHaveValue(
      adminUser.email,
    );

    await user.clear(screen.getByLabelText(adminTranslationsEn['profile.email']));
    await user.type(
      screen.getByLabelText(adminTranslationsEn['profile.email']),
      'updated@example.com',
    );
    await user.click(
      screen.getByRole('button', { name: adminTranslationsEn['profile.saveProfile'] }),
    );

    expect(await screen.findByTestId('admin-profile-success')).toHaveTextContent(
      adminTranslationsEn['profile.saved'],
    );
    expect(screen.getByTestId('admin-profile-email')).toHaveTextContent('updated@example.com');
  });

  it('shows friendly validation error on profile save failure', async () => {
    server.use(
      http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)),
      http.patch('*/api/admin/auth/me/', () =>
        HttpResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Please check your input and try again.',
              details: { email: ['Enter a valid email address.'] },
            },
          },
          { status: 400 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithAuth(<AdminProfilePage />);
    await screen.findByTestId('admin-profile-name');
    await user.click(
      screen.getByRole('button', { name: adminTranslationsEn['profile.editProfile'] }),
    );
    await user.click(
      screen.getByRole('button', { name: adminTranslationsEn['profile.saveProfile'] }),
    );

    expect(await screen.findByTestId('admin-profile-error')).toBeInTheDocument();
    expect(screen.queryByText(/VALIDATION_ERROR/i)).not.toBeInTheDocument();
  });
});

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    server.use(http.get('*/api/admin/auth/me/', () => HttpResponse.json(adminUser)));
  });

  it('shows mismatch error before submit', async () => {
    const user = userEvent.setup();
    renderWithAuth(<ChangePasswordPage />);
    await screen.findByTestId('admin-change-password-page');

    await user.type(
      screen.getByLabelText(adminTranslationsEn['password.currentPasswordLabel']),
      'current',
    );
    await user.type(
      screen.getByLabelText(adminTranslationsEn['password.newPasswordLabel']),
      'NewPass123!',
    );
    await user.type(
      screen.getByLabelText(adminTranslationsEn['password.confirmPasswordLabel']),
      'OtherPass123!',
    );

    expect(screen.getByText(adminTranslationsEn['password.mismatch'])).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: adminTranslationsEn['password.updatePassword'] }),
    ).toBeDisabled();
  });

  it('shows success and clears fields after password change', async () => {
    server.use(
      http.post('*/api/admin/auth/change-password/', () => HttpResponse.json({ success: true })),
    );

    const user = userEvent.setup();
    renderWithAuth(<ChangePasswordPage />);
    await screen.findByTestId('admin-change-password-page');

    await user.type(
      screen.getByLabelText(adminTranslationsEn['password.currentPasswordLabel']),
      'current',
    );
    await user.type(
      screen.getByLabelText(adminTranslationsEn['password.newPasswordLabel']),
      'NewPass123!',
    );
    await user.type(
      screen.getByLabelText(adminTranslationsEn['password.confirmPasswordLabel']),
      'NewPass123!',
    );
    await user.click(
      screen.getByRole('button', { name: adminTranslationsEn['password.updatePassword'] }),
    );

    expect(await screen.findByTestId('admin-change-password-success')).toHaveTextContent(
      adminTranslationsEn['password.updated'],
    );
    expect(screen.getByLabelText(adminTranslationsEn['password.currentPasswordLabel'])).toHaveValue(
      '',
    );
    expect(screen.getByLabelText(adminTranslationsEn['password.newPasswordLabel'])).toHaveValue('');
  });

  it('shows friendly error for wrong current password', async () => {
    server.use(
      http.post('*/api/admin/auth/change-password/', () =>
        HttpResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_CURRENT_PASSWORD',
              message: adminTranslationsEn['password.currentPasswordWrong'],
            },
          },
          { status: 400 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithAuth(<ChangePasswordPage />);
    await screen.findByTestId('admin-change-password-page');

    await user.type(
      screen.getByLabelText(adminTranslationsEn['password.currentPasswordLabel']),
      'wrong',
    );
    await user.type(
      screen.getByLabelText(adminTranslationsEn['password.newPasswordLabel']),
      'NewPass123!',
    );
    await user.type(
      screen.getByLabelText(adminTranslationsEn['password.confirmPasswordLabel']),
      'NewPass123!',
    );
    await user.click(
      screen.getByRole('button', { name: adminTranslationsEn['password.updatePassword'] }),
    );

    expect(await screen.findByTestId('admin-change-password-error')).toHaveTextContent(
      adminTranslationsEn['password.currentPasswordWrong'],
    );
    expect(screen.queryByText(/INVALID_CURRENT_PASSWORD/i)).not.toBeInTheDocument();
  });

  it('shows unique password toggle labels per field', async () => {
    renderWithAuth(<ChangePasswordPage />);
    await screen.findByTestId('admin-change-password-page');

    expect(
      screen.getByRole('button', { name: adminTranslationsEn['password.showCurrentPassword'] }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: adminTranslationsEn['password.showNewPassword'] }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: adminTranslationsEn['password.showConfirmPassword'] }),
    ).toBeInTheDocument();
  });

  it('shows sign out in navbar', async () => {
    renderWithAuth(<ChangePasswordPage />);
    await screen.findByTestId('admin-change-password-page');
    expect(
      screen.getByRole('button', { name: adminTranslationsEn['profile.logout'] }),
    ).toBeInTheDocument();
  });

  it('shows both languages on change password when display mode is both', async () => {
    const user = userEvent.setup();
    renderWithAuth(<ChangePasswordPage />, { language: 'en', displayMode: 'both' });
    await screen.findByTestId('admin-change-password-page');

    await user.click(screen.getByRole('button', { name: 'Both' }));

    const page = await screen.findByTestId('admin-change-password-page');
    const heading = within(page).getByRole('heading', { level: 1 });
    expect(within(heading).getByText(adminTranslationsEn['password.title'])).toHaveAttribute(
      'lang',
      'en',
    );
    expect(within(heading).getByText(adminTranslationsBn['password.title'])).toHaveAttribute(
      'lang',
      'bn',
    );
    expect(
      within(page).getByText(adminTranslationsEn['password.currentPasswordLabel']),
    ).toHaveAttribute('lang', 'en');
    expect(
      within(page).getByText(adminTranslationsBn['password.currentPasswordLabel']),
    ).toHaveAttribute('lang', 'bn');
    expect(
      within(page).getByText(adminTranslationsEn['password.newPasswordLabel']),
    ).toHaveAttribute('lang', 'en');
    expect(
      within(page).getByText(adminTranslationsBn['password.newPasswordLabel']),
    ).toHaveAttribute('lang', 'bn');
    expect(
      within(page).getByText(adminTranslationsEn['password.confirmPasswordLabel']),
    ).toHaveAttribute('lang', 'en');
    expect(
      within(page).getByText(adminTranslationsBn['password.confirmPasswordLabel']),
    ).toHaveAttribute('lang', 'bn');
  });
});
