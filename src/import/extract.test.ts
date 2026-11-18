import { confirmationIn, extract } from './extract';
import { ev, gmail } from '../test/events';
import type { LegCandidate, StayCandidate, VisitCandidate } from './types';

const leg = (e: ReturnType<typeof ev>) => {
  const r = extract(e);
  expect(r && 'candidate' in r && r.candidate.kind).toBe('leg');
  return (r as { candidate: LegCandidate }).candidate;
};
const stay = (e: ReturnType<typeof ev>) => {
  const r = extract(e);
  expect(r && 'candidate' in r && r.candidate.kind).toBe('stay');
  return (r as { candidate: StayCandidate }).candidate;
};
const visit = (e: ReturnType<typeof ev>) => {
  const r = extract(e);
  expect(r && 'candidate' in r && r.candidate.kind).toBe('visit');
  return (r as { candidate: VisitCandidate }).candidate;
};

describe('flights', () => {
  it('reads Gmail flight events: destination in the title, origin in the location', () => {
    const l = leg(gmail.flight('Lisbon', 'TP', '202', '2026-10-11T22:15-04:00', '2026-10-12T10:05+01:00', 'New York JFK'));
    expect([l.from?.iata, l.to.iata, l.to.city]).toEqual(['JFK', 'LIS', 'Lisbon']);
    expect([l.carrier, l.number]).toEqual(['TP', '202']);
    expect([l.departDate, l.arriveDate]).toEqual(['2026-10-11', '2026-10-12']);
  });

  it.each([
    ['✈️ JFK → LIS', 'JFK', 'LIS'],
    ['Flight JFK-LIS', 'JFK', 'LIS'],
    ['Flight: LH 400 FRA-JFK', 'FRA', 'JFK'],
    ['UA123 EWR to SFO', 'EWR', 'SFO'],
    ['UA 123 EWR → SFO', 'EWR', 'SFO'],
    ['Flug nach Berlin (LH 1234)', undefined, 'BER'],
    ['Vuelo a Madrid (IB 6250)', undefined, 'MAD'],
    ['Flight to Tokyo', undefined, 'HND'],
    ['Flight from Lisbon to Porto', undefined, undefined],
  ])('%s', (title, from, to) => {
    const l = leg(ev(title, '2026-10-12T10:00', '2026-10-12T14:00'));
    if (from) expect(l.from?.iata).toBe(from);
    if (to) expect(l.to.iata ?? l.to.city).toBe(to);
    if (!to) expect(l.to.city).toBe('Porto');
  });

  it('finds the flight number after the route is removed', () => {
    const l = leg(ev('UA123 EWR to SFO', '2026-10-12T10:00', '2026-10-12T14:00'));
    expect([l.carrier, l.number]).toEqual(['UA', '123']);
  });

  it('reads departure and arrival from the description when the title is only an airline', () => {
    const l = leg(
      ev('Lufthansa LH 400', '2026-03-01T13:00+01:00', '2026-03-01T16:00-05:00', {
        description: 'Departure: Frankfurt (FRA) 13:00\nArrival: New York (JFK) 16:00\nConfirmation: XK4P9Q',
      }),
    );
    expect([l.from?.iata, l.to.iata, l.confirmation]).toEqual(['FRA', 'JFK', 'XK4P9Q']);
  });

  it('marks cancellations instead of dropping them, so dedupe can cancel the booking', () => {
    expect(leg(gmail.flight('Lisbon', 'TP', '202', '2026-10-11T22:15-04:00', '2026-10-12T10:05+01:00', 'JFK', { status: 'cancelled' })).cancelled).toBe(true);
    expect(leg(ev('Cancelled: Flight to Lisbon (TP 202)', '2026-10-11T22:15-04:00')).cancelled).toBe(true);
  });

  it('places an all-day flight on its own day', () => {
    const l = leg(ev('Flight JFK → LIS', '2026-10-11', '2026-10-12'));
    expect([l.departDate, l.arriveDate]).toEqual(['2026-10-11', '2026-10-11']);
  });
});

describe('trains, buses, ferries', () => {
  it.each([
    ['Train to Porto', 'Lisboa Santa Apolónia', 'train', 'Lisbon', 'Porto'],
    ['Eurostar London → Paris', undefined, 'train', 'London', 'Paris'],
    ['Train from Paris to Lyon', undefined, 'train', 'Paris', 'Lyon'],
    ['FlixBus Berlin - Prague', undefined, 'bus', 'Berlin', 'Prague'],
    ['Ferry to Naples', 'Capri', 'ferry', undefined, 'Naples'],
  ])('%s', (title, location, mode, from, to) => {
    const l = leg(ev(title, '2026-06-01T09:00', '2026-06-01T12:00', { location }));
    expect(l.mode).toBe(mode);
    if (from) expect(l.from?.city).toBe(from);
    expect(l.to.city).toBe(to);
  });
});

describe('stays', () => {
  it('reads a Gmail stay spanning check-in to check-out', () => {
    const s = stay(gmail.stay('Hotel Bairro Alto', '2026-10-12T15:00+01:00', '2026-10-16T11:00+01:00', 'Praça Luís de Camões 2, 1200-243 Lisboa, Portugal'));
    expect([s.name, s.checkIn, s.checkOut, s.partial, s.place?.city]).toEqual(['Hotel Bairro Alto', '2026-10-12', '2026-10-16', undefined, 'Lisbon']);
  });

  it('treats an all-day block as nights with an exclusive end', () => {
    const s = stay(ev('Hotel: Ace Hotel', '2026-05-01', '2026-05-04', { location: '20 W 29th St, New York, NY 10001, USA' }));
    expect([s.name, s.checkIn, s.checkOut]).toEqual(['Ace Hotel', '2026-05-01', '2026-05-04']);
  });

  it.each([
    ['Check-in: Park Hyatt Tokyo', 'checkin'],
    ['Check in at Park Hyatt Tokyo', 'checkin'],
    ['Check-out: Park Hyatt Tokyo', 'checkout'],
    ['Checkout from Park Hyatt Tokyo', 'checkout'],
  ])('%s is one side of a stay', (title, side) => {
    const s = stay(ev(title, '2026-04-02T15:00+09:00', '2026-04-02T16:00+09:00'));
    expect(s.partial).toBe(side);
    expect(s.name).toBe('Park Hyatt Tokyo');
  });

  it.each([
    ['Airbnb: Cozy loft in Alfama', 'Cozy loft in Alfama'],
    ['Pestana Palace (Booking.com)', 'Pestana Palace'],
    ['Memmo Alfama - Booking.com', 'Memmo Alfama'],
    ['Stay at The Hoxton, Paris', 'The Hoxton, Paris'],
    ['Lodging: Casa Amora', 'Casa Amora'],
  ])('%s', (title, name) => {
    expect(stay(ev(title, '2026-07-01', '2026-07-04')).name).toBe(name);
  });

  it('recognises a lodging name on a multi-day block even without a keyword prefix', () => {
    expect(stay(ev('Marriott Marquis', '2026-02-10', '2026-02-13')).name).toBe('Marriott Marquis');
  });

  it('does not treat "check in for flight" as a hotel', () => {
    expect(extract(ev('Check in for flight TP 202', '2026-10-10T22:00'))).toEqual({ skip: 'reminder' });
  });
});

describe('visits', () => {
  it.each([
    ['Reservation at Taberna da Rua das Flores', 'food', 'Taberna da Rua das Flores'],
    ['Dinner reservation at Cervejaria Ramiro for 2', 'food', 'Cervejaria Ramiro'],
    ['Dinner at Sukiyabashi Jiro', 'food', 'Sukiyabashi Jiro'],
    ['Tickets: Fado at Clube de Fado', 'event', 'Fado at Clube de Fado'],
    ['Sagrada Familia tickets', 'event', 'Sagrada Familia'],
    ['Walking tour of Alfama', 'activity', 'Alfama'],
    ['Belém food tour (GetYourGuide)', 'activity', 'Belém food tour'],
  ])('%s', (title, category, name) => {
    const v = visit(ev(title, '2026-10-14T20:00', '2026-10-14T22:00'));
    expect([v.category, v.name]).toEqual([category, name]);
  });
});

describe('not travel', () => {
  it.each([
    'Team sync',
    'Dinner with Sarah',
    'Q3 planning',
    'Lisbon trip planning',
    'Call with the LAX team',
    'SFO to LAX handoff doc review',
    'Movie night',
    '1:1 with Ana',
    'Dentist',
    'Pay rent',
    'Gym',
    'Standup',
    'OKR review: travel budget',
    'Check emails',
  ])('%s', (title) => {
    expect(extract(ev(title, '2026-10-14T09:00', '2026-10-14T10:00'))).toBeNull();
  });

  it.each(['Flight lesson', 'Pick up Mom from JFK', 'Book flight to Lisbon', 'Online check-in opens', 'Airport run'])('%s is a reminder', (title) => {
    expect(extract(ev(title, '2026-10-14T09:00', '2026-10-14T10:00'))).toEqual({ skip: 'reminder' });
  });

  it('ignores recurring events, birthdays and out-of-office blocks', () => {
    expect(extract(ev('Flight JFK → LIS', '2026-10-14T09:00', '2026-10-14T10:00', { recurring: true }))).toBeNull();
    expect(extract(ev('Hotel: Somewhere', '2026-10-14', '2026-10-16', { eventType: 'outOfOffice' }))).toBeNull();
    expect(extract(ev('Ana’s birthday', '2026-10-14', undefined, { eventType: 'birthday' }))).toBeNull();
  });

  it('does not invent a same-airport flight', () => {
    expect(extract(ev('Flight JFK → JFK', '2026-10-14T09:00', '2026-10-14T10:00'))).toBeNull();
  });
});

describe('confirmation codes', () => {
  it.each([
    ['Confirmation: ABC123', 'ABC123'],
    ['Booking #HB-99812', 'HB99812'],
    ['Record locator XKPQLM', 'XKPQLM'],
    ['Confirmation number: 8812773', '8812773'],
    ['Reservation at Taberna', undefined],
    ['Your booking is confirmed', undefined],
    ['Reservation details below', undefined],
  ])('%s', (text, code) => {
    expect(confirmationIn(text)).toBe(code);
  });
});
