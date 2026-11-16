import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { db } from '../db/db';
import { SampleCalendarSource } from '../google/sample';
import type { SourceFactory } from './screens/ImportFlow';

const sample: SourceFactory = () => new SampleCalendarSource();

async function go(path: string) {
  window.location.hash = path;
  await new Promise((r) => setTimeout(r, 0));
}

beforeEach(async () => {
  await db.delete();
  await db.open();
  window.location.hash = '/';
});

async function runSampleImport(user: ReturnType<typeof userEvent.setup>) {
  // Land on home first so the import screen starts fresh, even on a slow runner.
  await go('/');
  await screen.findByText(/Distance traveled/i);
  await go('/import');
  await user.click(await screen.findByRole('button', { name: /sample calendar/i }));
  await user.click(await screen.findByRole('button', { name: /find my trips/i }));
  await screen.findByRole('heading', { name: 'Review' });
}

describe('calendar import, end to end', () => {
  it('finds the trips, lets you review them, and saves them on this device', async () => {
    const user = userEvent.setup();
    render(<App sourceFactory={sample} />);
    await runSampleImport(user);

    for (const name of ['Lisbon, Oct ’26', 'Kyoto & Tokyo, Apr ’25', 'Mexico City, Mar ’24', 'Berlin, Jun ’23']) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument();
    }
    // Nobody typed a home airport: it was worked out from the trips.
    expect(within(screen.getByRole('region', { name: 'Where you were based' })).getByText('New York')).toBeInTheDocument();
    expect(screen.queryByLabelText(/home airport/i)).not.toBeInTheDocument();
    // Untick one visit before saving.
    const lisbon = screen.getByRole('region', { name: 'Lisbon, Oct ’26' });
    await user.click(within(lisbon).getByRole('checkbox', { name: /Sintra day trip/ }));

    await user.click(screen.getByRole('button', { name: /save 4 trails/i }));
    await screen.findByText(/Saved 4 new trails/);

    expect(await db.trails.count()).toBe(4);
    const entries = await db.entries.toArray();
    expect(entries.map((e) => e.name)).not.toContain('Sintra day trip');
    expect(entries.filter((e) => e.kind === 'stay').map((e) => e.name).sort()).toEqual(['Ace Hotel Kyoto', 'Condesa DF', 'Hotel Bairro Alto', 'Michelberger Hotel', 'Park Hyatt Tokyo']);
    expect(await db.dismissed.count()).toBe(1);
    expect(await db.settings.get('homeAirport')).toBeUndefined();

    // Home shows the distance and the trails.
    await user.click(screen.getByRole('button', { name: /see your atlas/i }));
    await screen.findByText(/laps of the Earth/);
    const km = (await db.trails.toArray()).reduce((n, t) => n + t.km, 0);
    expect(screen.getByText(km.toLocaleString('en-US'))).toBeInTheDocument();
    expect(screen.getAllByText('Lisbon, Oct ’26').length).toBeGreaterThan(0);
  });

  it('adds nothing when you import the same calendar again', async () => {
    const user = userEvent.setup();
    render(<App sourceFactory={sample} />);
    await runSampleImport(user);
    await user.click(screen.getByRole('button', { name: /save 4 trails/i }));
    await screen.findByText(/Saved 4 new trails/);
    const before = { trails: await db.trails.count(), entries: await db.entries.count(), legs: await db.legs.count() };

    await runSampleImport(user);
    expect(screen.getByText('Nothing new')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save 0 trails/i })).toBeDisabled();
    expect({ trails: await db.trails.count(), entries: await db.entries.count(), legs: await db.legs.count() }).toEqual(before);
  });

  it('brings back nothing you unticked, but adds what you kept later', async () => {
    const user = userEvent.setup();
    render(<App sourceFactory={sample} />);
    await runSampleImport(user);
    // Keep only Berlin this time, and don't dismiss the rest.
    for (const name of ['Lisbon, Oct ’26', 'Kyoto & Tokyo, Apr ’25', 'Mexico City, Mar ’24']) {
      await user.click(within(screen.getByRole('region', { name })).getByRole('checkbox', { name: `Keep ${name}` }));
    }
    await user.click(screen.getByRole('checkbox', { name: /don’t suggest unticked items again/i }));
    await user.click(screen.getByRole('button', { name: /save 1 trail/i }));
    await screen.findByText(/Saved 1 new trail/);

    await runSampleImport(user);
    expect(screen.queryByRole('region', { name: 'Berlin, Jun ’23' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Lisbon, Oct ’26' })).toBeInTheDocument();
  });

  it('shows what was left out and why', async () => {
    const user = userEvent.setup();
    render(<App sourceFactory={sample} />);
    await runSampleImport(user);
    await user.click(screen.getByText(/Left out:/));
    expect(screen.getByText('Cancelled bookings')).toBeInTheDocument();
    expect(screen.getByText(/Not during a trip/)).toBeInTheDocument();
    expect(screen.getByText(/Via Carota/)).toBeInTheDocument();
  });

  it('explains how to fix a missing Google client ID', async () => {
    const user = userEvent.setup();
    render(<App />);
    await go('/import');
    await user.click(await screen.findByRole('button', { name: /connect google calendar/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/client ID/);
    expect(screen.getByRole('link', { name: /open settings/i })).toBeInTheDocument();
  });
});

describe('pinning a place by hand', () => {
  it('searches cities and saves a visit to a new list', async () => {
    const user = userEvent.setup();
    render(<App />);
    await go('/pin');
    await user.type(await screen.findByLabelText('City'), 'Lisb');
    await user.click(await screen.findByRole('option', { name: /Lisbon/ }));
    await user.click(screen.getByRole('radio', { name: /Visit/ }));
    await user.type(screen.getByLabelText(/What it was/), 'Taberna da Rua das Flores');
    await user.type(screen.getByLabelText('New list name'), 'Lisbon food');
    await user.click(screen.getByRole('button', { name: /pin it/i }));

    await waitFor(async () => expect(await db.entries.count()).toBe(1));
    const [e] = await db.entries.toArray();
    expect([e.kind, e.name, e.city, e.country]).toEqual(['visit', 'Taberna da Rua das Flores', 'Lisbon', 'PT']);
    const [t] = await db.trails.toArray();
    expect([t.name, t.kind]).toEqual(['Lisbon food', 'list']);
    expect(e.trailIds).toEqual([t.id]);
  });
});
