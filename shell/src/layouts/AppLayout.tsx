import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const NAV_LINKS = [
  { to: '/approvals/inbox', label: 'Inbox' },
  { to: '/instances/new', label: 'Nova Instância' },
  { to: '/delegations', label: 'Delegações' },
];

function AppLayout({ children }: { children: ReactNode }) {
  const auth = useAuthStore();
  const { pathname } = useLocation();

  if (!auth.isAuthenticated) return null;

  return (
    <div>
      <header
        style={{
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Workflow de Aprovações</h1>
          <nav style={{ display: 'flex', gap: '0.5rem' }} aria-label="Navegação principal">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.to || pathname.startsWith(link.to + '/');
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    padding: '0.25rem 0.625rem',
                    borderRadius: '4px',
                    fontSize: '0.8125rem',
                    textDecoration: 'none',
                    color: isActive ? '#1d4ed8' : '#6b7280',
                    background: isActive ? '#eff6ff' : 'transparent',
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label htmlFor="company-select" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Empresa:
          </label>
          <select
            id="company-select"
            value={auth.currentCompanyId}
            onChange={(e) => auth.switchCompany(e.target.value)}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
            }}
          >
            {auth.companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <span style={{ fontSize: '0.875rem', color: '#374151' }}>{auth.user.name}</span>
        </div>
      </header>
      <main style={{ padding: '1rem' }}>{children}</main>
    </div>
  );
}

export default AppLayout;
