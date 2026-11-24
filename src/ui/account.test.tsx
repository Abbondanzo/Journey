import 'fake-indexeddb/auto';
import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setAccountStateForTests } from '../cloud/session';
import { AccountCard, StorageLabel } from './Account';

afterEach(() => setAccountStateForTests({ status: 'off' }));

describe('account card', () => {
  it('stays out of the way when accounts are off', () => {
    setAccountStateForTests({ status: 'off' });
    const { container } = render(<AccountCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it('offers Google and GitHub sign-in on a signed-out device', () => {
    setAccountStateForTests({ status: 'local' });
    render(
      <>
        <AccountCard />
        <StorageLabel />
      </>,
    );
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument();
    expect(screen.getByText('Kept on this device')).toBeInTheDocument();
  });

  it('asks before mixing this phone’s trips into an account that has some', () => {
    setAccountStateForTests({ status: 'local', me: { uid: 'a', name: 'Peter' }, merge: { atlasId: 'x', trails: 3 } });
    render(<AccountCard />);
    expect(screen.getByRole('heading', { name: /this phone has 3 trails/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add them to my account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /leave them on this phone/i })).toBeInTheDocument();
  });

  it('shows the atlas, its people and an invite button to the owner', () => {
    const atlas = { id: 'x', name: 'Peter’s atlas', owner: 'p', members: { p: 'owner' as const, c: 'editor' as const }, names: { p: 'Peter', c: 'Caroline' } };
    setAccountStateForTests({ status: 'synced', me: { uid: 'p', name: 'Peter' }, atlas, atlases: [atlas] });
    render(
      <>
        <AccountCard />
        <StorageLabel />
      </>,
    );
    const people = screen.getByRole('list', { name: /people in this atlas/i });
    expect(within(people).getAllByRole('listitem')).toHaveLength(2);
    expect(within(people).getByRole('button', { name: 'Remove Caroline' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /invite someone/i })).toBeInTheDocument();
    expect(screen.getByText('Synced to your account')).toBeInTheDocument();
  });

  it('lets a member leave instead of inviting', () => {
    const atlas = { id: 'x', name: 'Peter’s atlas', owner: 'p', members: { p: 'owner' as const, c: 'editor' as const }, names: { p: 'Peter', c: 'Caroline' } };
    setAccountStateForTests({ status: 'synced', me: { uid: 'c', name: 'Caroline' }, atlas, atlases: [atlas] });
    render(<AccountCard />);
    expect(screen.queryByRole('button', { name: /invite someone/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^remove/i })).toBeNull();
    expect(screen.getByRole('button', { name: /leave this atlas/i })).toBeInTheDocument();
  });
});
