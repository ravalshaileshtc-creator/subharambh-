// ==============================================================================
// PANCHMAHAL DISTRICT GEOGRAPHY & TALUKA DIRECTORY
// Accurate locations across Godhra & Panchmahal District, Gujarat, India
// ==============================================================================

export const PANCHMAHAL_TALUKAS = [
  {
    id: 'godhra',
    name: 'Godhra (મુખ્ય મથક)',
    areas: [
      'Godhra Central / Station Road',
      'Bamroli Road, Godhra',
      'Vavdi Buzarg, Godhra',
      'Bhamaiya, Godhra',
      'Science College Road, Godhra',
      'Bhurava / Ankur Road, Godhra',
      'Kachiyawad / Ram Sagar, Godhra',
      'Chawdi Bazar, Godhra',
      'Halol Road, Godhra',
      'Lunawada Road, Godhra',
      'Near Deep Hospital, Godhra',
    ],
  },
  {
    id: 'halol',
    name: 'Halol (હાલોલ - પાવાગઢ પાસે)',
    areas: [
      'Halol Town Central',
      'Kanjari Road, Halol',
      'Pavagadh Road, Halol',
      'Halol GIDC / Vadodara Highway',
      'Champaner Heritage Area',
    ],
  },
  {
    id: 'kalol',
    name: 'Kalol (કાલોલ)',
    areas: [
      'Kalol Station Road',
      'Kalol Town Central',
      'Derol Station Road',
      'Kalol GIDC Industrial Area',
    ],
  },
  {
    id: 'shehra',
    name: 'Shehra (શહેરા)',
    areas: [
      'Shehra Town Central',
      'Morva Road, Shehra',
      'Shahera Highway',
    ],
  },
  {
    id: 'lunawada',
    name: 'Lunawada (લુણાવાડા)',
    areas: [
      'Lunawada Town Central',
      'Modasa Road, Lunawada',
      'Bus Stand Road, Lunawada',
    ],
  },
  {
    id: 'ghoghamba',
    name: 'Ghoghamba (ઘોઘંબા)',
    areas: [
      'Ghoghamba Town',
      'Rajgadh Village',
      'Damavav Area',
    ],
  },
  {
    id: 'morva_hadaf',
    name: 'Morva Hadaf (મોરવા હડફ)',
    areas: [
      'Morva Hadaf Town',
      'Santrampur Border Area',
    ],
  },
  {
    id: 'jambughoda',
    name: 'Jambughoda (જાંબુઘોડા)',
    areas: [
      'Jambughoda Town',
      'Bodeli Road',
    ],
  },
];

export const ALL_LOCATIONS = PANCHMAHAL_TALUKAS.flatMap((t) => t.areas);
