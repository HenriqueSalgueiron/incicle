import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { DelegationForm } from './DelegationForm';
import { CycleChainDiagram } from './CycleChainDiagram';

const MOCK_USERS = [
  { id: 'user-2', name: 'Bruno Mendes' },
  { id: 'user-3', name: 'Carla Ferreira' },
  { id: 'user-4', name: 'Diego Oliveira' },
];

describe('DelegationForm', () => {
  it('submits valid data and resets form on success, passes axe', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);

    const { container } = render(
      <DelegationForm users={MOCK_USERS} onSubmit={onSubmit} submitting={false} />,
    );

    await user.selectOptions(screen.getByLabelText('Delegado'), 'user-2');
    await user.type(screen.getByLabelText('Data inicial'), '2026-04-01');
    await user.type(screen.getByLabelText('Data final'), '2026-04-30');
    await user.click(screen.getByRole('button', { name: /criar delegação/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        toUserId: 'user-2',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      });
    });

    // Form should reset after successful submit
    await waitFor(() => {
      expect(screen.getByLabelText('Data inicial')).toHaveValue('');
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows 3 validation errors on empty submit, passes axe', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    const { container } = render(
      <DelegationForm users={MOCK_USERS} onSubmit={onSubmit} submitting={false} />,
    );

    await user.click(screen.getByRole('button', { name: /criar delegação/i }));

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(3);
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows error when endDate < startDate, passes axe', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    const { container } = render(
      <DelegationForm users={MOCK_USERS} onSubmit={onSubmit} submitting={false} />,
    );

    await user.selectOptions(screen.getByLabelText('Delegado'), 'user-2');
    await user.type(screen.getByLabelText('Data inicial'), '2026-04-15');
    await user.type(screen.getByLabelText('Data final'), '2026-04-10');
    await user.click(screen.getByRole('button', { name: /criar delegação/i }));

    await waitFor(() => {
      expect(screen.getByText(/data final deve ser/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('does NOT reset form when onSubmit returns false', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(false);

    render(
      <DelegationForm users={MOCK_USERS} onSubmit={onSubmit} submitting={false} />,
    );

    await user.selectOptions(screen.getByLabelText('Delegado'), 'user-2');
    await user.type(screen.getByLabelText('Data inicial'), '2026-04-01');
    await user.type(screen.getByLabelText('Data final'), '2026-04-30');
    await user.click(screen.getByRole('button', { name: /criar delegação/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    // Values should still be present
    expect(screen.getByLabelText('Data inicial')).toHaveValue('2026-04-01');
  });

  it('disables fields and shows "Criando..." when submitting', async () => {
    const { container } = render(
      <DelegationForm users={MOCK_USERS} onSubmit={vi.fn()} submitting={true} />,
    );

    expect(screen.getByLabelText('Delegado')).toBeDisabled();
    expect(screen.getByLabelText('Data inicial')).toBeDisabled();
    expect(screen.getByLabelText('Data final')).toBeDisabled();

    const button = screen.getByRole('button', { name: /criando/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('CycleChainDiagram', () => {
  it('renders visual chain with role="alert" and correct ARIA, passes axe', async () => {
    const chain = [
      { id: 'user-1', name: 'Ana' },
      { id: 'user-2', name: 'Bruno' },
      { id: 'user-3', name: 'Carla' },
      { id: 'user-1', name: 'Ana' },
    ];
    const onDismiss = vi.fn();

    const { container } = render(
      <CycleChainDiagram chain={chain} onDismiss={onDismiss} />,
    );

    // role="alert" present
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // All user names rendered (Ana appears twice)
    expect(screen.getAllByText('Ana')).toHaveLength(2);
    expect(screen.getByText('Bruno')).toBeInTheDocument();
    expect(screen.getByText('Carla')).toBeInTheDocument();

    // Heading text
    expect(screen.getByText(/ciclo de delegação detectado/i)).toBeInTheDocument();

    // Dismiss button with aria-label
    expect(
      screen.getByRole('button', { name: /fechar alerta de ciclo/i }),
    ).toBeInTheDocument();

    // Screen-reader description present
    expect(screen.getByText(/formando um ciclo/i)).toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });
});
