import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Sidebar from './Sidebar';

vi.mock('../api/lists', () => ({
  fetchLists: vi.fn(() => new Promise(() => undefined)),
  createList: vi.fn(),
  renameList: vi.fn(),
  deleteList: vi.fn(),
}));

describe('Sidebar', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows a loading state while lists are being fetched', async () => {
    render(<Sidebar selectedListId={null} onSelect={() => undefined} />);

    await waitFor(() => {
      expect(screen.getAllByLabelText('Loading lists').length).toBeGreaterThan(0);
    });
  });

  it('opens the mobile panel when mobileOpen is true', () => {
    const { container } = render(
      <Sidebar selectedListId={null} onSelect={() => undefined} mobileOpen />,
    );

    expect(container.querySelector('.translate-x-0')).not.toBeNull();
  });
});
