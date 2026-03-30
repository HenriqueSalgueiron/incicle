import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { ApprovalInboxItem } from './ApprovalInboxItem';
import { renderWithRouter, createMockApprovalItem } from '@/test/helpers';
import type { ApprovalItem } from '@workflow/shared-types';

/** Wraps the item in a list container to satisfy ARIA listitem -> list requirement */
function renderItem(item: ApprovalItem, onApprove = vi.fn(), onReject = vi.fn()) {
  return renderWithRouter(
    <div role="list">
      <ApprovalInboxItem item={item} onApprove={onApprove} onReject={onReject} />
    </div>,
  );
}

describe('ApprovalInboxItem', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-03-30T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders pending item with ok SLA, shows buttons, passes axe', async () => {
    const item = createMockApprovalItem({
      slaDeadline: new Date('2026-03-31T12:00:00Z').toISOString(), // 24h
    });
    const { container } = renderItem(item);

    expect(screen.getByText(item.title)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aprovar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reprovar/i })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders warning SLA state, passes axe', async () => {
    const item = createMockApprovalItem({
      slaDeadline: new Date('2026-03-30T14:00:00Z').toISOString(), // 2h
    });
    const { container } = renderItem(item);

    expect(screen.getByRole('button', { name: /aprovar/i })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders breached SLA state, passes axe', async () => {
    const item = createMockApprovalItem({
      slaDeadline: new Date('2026-03-30T11:00:00Z').toISOString(), // -1h
    });
    const { container } = renderItem(item);

    expect(screen.getByText('Expirado')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('hides buttons and shows badge when approved, passes axe', async () => {
    const item = createMockApprovalItem({ status: 'approved' });
    const { container } = renderItem(item);

    expect(screen.queryByRole('button', { name: /aprovar/i })).not.toBeInTheDocument();
    expect(screen.getByText('Aprovado')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows "Reprovado" badge when rejected, passes axe', async () => {
    const item = createMockApprovalItem({ status: 'rejected' });
    const { container } = renderItem(item);

    expect(screen.queryByRole('button', { name: /reprovar/i })).not.toBeInTheDocument();
    expect(screen.getByText('Reprovado')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('fires onApprove and onReject callbacks with item id', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onApprove = vi.fn();
    const onReject = vi.fn();
    const item = createMockApprovalItem();

    renderItem(item, onApprove, onReject);

    await user.click(screen.getByRole('button', { name: /aprovar/i }));
    expect(onApprove).toHaveBeenCalledWith(item.id);

    await user.click(screen.getByRole('button', { name: /reprovar/i }));
    expect(onReject).toHaveBeenCalledWith(item.id);
  });

  it('renders link to instance detail with aria-label', () => {
    const item = createMockApprovalItem();
    renderItem(item);

    const link = screen.getByRole('link', { name: /ver detalhes/i });
    expect(link).toHaveAttribute('href', `/instances/${item.instanceId}`);
  });
});
