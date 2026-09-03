/* ============================================================
   Striking Out Cancer — POC
   Team data (placeholder marks — official MLB club assets to be
   delivered via MLB licensing in production build)
   ============================================================ */

const MLB_TEAMS = [
  // AL East
  { id: 'bal', city: 'Baltimore',     name: 'Orioles',      abbr: 'BAL', primary: '#DF4601', secondary: '#27251F', league: 'AL', division: 'East' },
  { id: 'bos', city: 'Boston',        name: 'Red Sox',      abbr: 'BOS', primary: '#BD3039', secondary: '#0C2340', league: 'AL', division: 'East' },
  { id: 'nyy', city: 'New York',      name: 'Yankees',      abbr: 'NYY', primary: '#0C2340', secondary: '#C4CED4', league: 'AL', division: 'East', pinstripe: true },
  { id: 'tb',  city: 'Tampa Bay',     name: 'Rays',         abbr: 'TB',  primary: '#092C5C', secondary: '#8FBCE6', league: 'AL', division: 'East' },
  { id: 'tor', city: 'Toronto',       name: 'Blue Jays',    abbr: 'TOR', primary: '#134A8E', secondary: '#E8291C', league: 'AL', division: 'East' },
  // AL Central
  { id: 'cws', city: 'Chicago',       name: 'White Sox',    abbr: 'CWS', primary: '#27251F', secondary: '#C4CED4', league: 'AL', division: 'Central', pinstripe: true },
  { id: 'cle', city: 'Cleveland',     name: 'Guardians',    abbr: 'CLE', primary: '#00385D', secondary: '#E50022', league: 'AL', division: 'Central' },
  { id: 'det', city: 'Detroit',       name: 'Tigers',       abbr: 'DET', primary: '#0C2340', secondary: '#FA4616', league: 'AL', division: 'Central' },
  { id: 'kc',  city: 'Kansas City',   name: 'Royals',       abbr: 'KC',  primary: '#004687', secondary: '#BD9B60', league: 'AL', division: 'Central' },
  { id: 'min', city: 'Minnesota',     name: 'Twins',        abbr: 'MIN', primary: '#002B5C', secondary: '#D31145', league: 'AL', division: 'Central' },
  // AL West
  { id: 'ath', city: 'Sacramento',    name: 'Athletics',    abbr: 'ATH', primary: '#003831', secondary: '#EFB21E', league: 'AL', division: 'West' },
  { id: 'hou', city: 'Houston',       name: 'Astros',       abbr: 'HOU', primary: '#002D62', secondary: '#EB6E1F', league: 'AL', division: 'West' },
  { id: 'laa', city: 'Los Angeles',   name: 'Angels',       abbr: 'LAA', primary: '#BA0021', secondary: '#003263', league: 'AL', division: 'West' },
  { id: 'sea', city: 'Seattle',       name: 'Mariners',     abbr: 'SEA', primary: '#0C2C56', secondary: '#005C5C', league: 'AL', division: 'West' },
  { id: 'tex', city: 'Texas',         name: 'Rangers',      abbr: 'TEX', primary: '#003278', secondary: '#C0111F', league: 'AL', division: 'West' },
  // NL East
  { id: 'atl', city: 'Atlanta',       name: 'Braves',       abbr: 'ATL', primary: '#CE1141', secondary: '#13274F', league: 'NL', division: 'East' },
  { id: 'mia', city: 'Miami',         name: 'Marlins',      abbr: 'MIA', primary: '#00A3E0', secondary: '#27251F', league: 'NL', division: 'East' },
  { id: 'nym', city: 'New York',      name: 'Mets',         abbr: 'NYM', primary: '#002D72', secondary: '#FF5910', league: 'NL', division: 'East' },
  { id: 'phi', city: 'Philadelphia',  name: 'Phillies',     abbr: 'PHI', primary: '#E81828', secondary: '#002D72', league: 'NL', division: 'East' },
  { id: 'wsh', city: 'Washington',    name: 'Nationals',    abbr: 'WSH', primary: '#AB0003', secondary: '#14225A', league: 'NL', division: 'East' },
  // NL Central
  { id: 'chc', city: 'Chicago',       name: 'Cubs',         abbr: 'CHC', primary: '#0E3386', secondary: '#CC3433', league: 'NL', division: 'Central' },
  { id: 'cin', city: 'Cincinnati',    name: 'Reds',         abbr: 'CIN', primary: '#C6011F', secondary: '#27251F', league: 'NL', division: 'Central' },
  { id: 'mil', city: 'Milwaukee',     name: 'Brewers',      abbr: 'MIL', primary: '#12284B', secondary: '#FFC52F', league: 'NL', division: 'Central' },
  { id: 'pit', city: 'Pittsburgh',    name: 'Pirates',      abbr: 'PIT', primary: '#27251F', secondary: '#FDB827', league: 'NL', division: 'Central' },
  { id: 'stl', city: 'St. Louis',     name: 'Cardinals',    abbr: 'STL', primary: '#C41E3A', secondary: '#0C2340', league: 'NL', division: 'Central' },
  // NL West
  { id: 'ari', city: 'Arizona',       name: 'D-backs',      abbr: 'AZ',  primary: '#A71930', secondary: '#E3D4AD', league: 'NL', division: 'West' },
  { id: 'col', city: 'Colorado',      name: 'Rockies',      abbr: 'COL', primary: '#333366', secondary: '#C4CED4', league: 'NL', division: 'West' },
  { id: 'lad', city: 'Los Angeles',   name: 'Dodgers',      abbr: 'LAD', primary: '#005A9C', secondary: '#EF3E42', league: 'NL', division: 'West' },
  { id: 'sd',  city: 'San Diego',     name: 'Padres',       abbr: 'SD',  primary: '#2F241D', secondary: '#FFC425', league: 'NL', division: 'West' },
  { id: 'sf',  city: 'San Francisco', name: 'Giants',       abbr: 'SF',  primary: '#FD5A1E', secondary: '#27251F', league: 'NL', division: 'West' },
];

/* Pre-approved dedication messages (final list subject to AbbVie
   med/legal/regulatory review — POC set pulled from concept deck) */
const APPROVED_MESSAGES = [
  'For my mom',
  'For my dad',
  'For my hero',
  'For those fighting for a cure',
  'Thank you, oncology healthcare workers',
  'In celebration of all cancer survivors',
  'For everyone still in the fight',
  'In memory of a champion',
  'For my teammate for life',
  'Every strikeout means more',
];

function getTeam(id) {
  return MLB_TEAMS.find(function (t) { return t.id === id; }) || null;
}

/* Pick a K color that stays legible on the navy postseason sign —
   falls back to white when a club's secondary color is too dark. */
function postseasonAccent(hex) {
  var n = parseInt(hex.slice(1), 16);
  var lum = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum < 90 ? '#ffffff' : hex;
}
