/* ============================================================
   Name moderation — POC first-pass filter
   Client-side screening of the optional first-name field:
   normalizes leetspeak / spacing / repeated characters, then
   checks a blocklist (substring for unambiguous terms, whole-
   word for terms that appear inside innocent names).
   Production: server-side moderation service + human review
   queue before any name reaches a stadium display.
   ============================================================ */

var Moderation = (function () {
  'use strict';

  /* Unambiguous terms — flagged anywhere in the string */
  var BLOCK_SUBSTRING = [
    'fuck', 'shit', 'cunt', 'bitch', 'asshole', 'arsehole', 'bastard',
    'dickhead', 'pussy', 'wanker', 'twat', 'prick', 'bollock',
    'douche', 'faggot', 'nigger', 'nigga', 'spic', 'kike', 'chink',
    'gook', 'wetback', 'beaner', 'retard', 'rapist', 'nazi', 'hitler',
    'whore', 'slut', 'jizz', 'penis', 'vagina', 'boner', 'dildo',
    'blowjob', 'handjob', 'cumshot', 'porn', 'pedo', 'molest',
    'genocide', 'terrorist',
  ];

  /* Ambiguous terms — flagged only as a whole word
     (so "Cassie", "Dickinson", "Cummings" pass) */
  var BLOCK_WORD = [
    'ass', 'arse', 'anal', 'anus', 'homo', 'coon', 'paki', 'tard',
    'fag', 'dick', 'cock', 'cum', 'sex', 'rape', 'tits', 'hoe',
    'damn', 'piss', 'crap', 'perv', 'meth', 'heroin', 'cocaine',
    'kill', 'hate',
  ];

  /* Real surnames that collide with blocklist fragments — always allowed */
  var ALLOW_WORD = [
    'hancock', 'alcock', 'cockburn', 'hitchcock', 'ho', 'cocke',
    'woodcock', 'babcock', 'glasscock', 'dickson', 'dickinson',
  ];

  var LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i', '+': 't' };

  function deLeet(s) {
    return s.replace(/[0134578@$!+]/g, function (c) { return LEET[c]; });
  }

  /* lowercase, map leetspeak, strip everything but letters */
  function normalize(s) {
    return deLeet(String(s).toLowerCase()).replace(/[^a-z]/g, '');
  }

  /* collapse runs of the same letter: "fuuuck" -> "fuck" */
  function collapse(s) {
    return s.replace(/(.)\1+/g, '$1');
  }

  function isClean(name) {
    if (!name) return true;

    /* strip allowlisted surnames out before any matching */
    var scrubbed = String(name).toLowerCase().split(/[^a-zA-Z]+/).filter(function (w) {
      return ALLOW_WORD.indexOf(w) === -1;
    }).join(' ');

    var forms = [normalize(scrubbed)];
    forms.push(collapse(forms[0]));

    for (var f = 0; f < forms.length; f++) {
      for (var i = 0; i < BLOCK_SUBSTRING.length; i++) {
        if (forms[f].indexOf(BLOCK_SUBSTRING[i]) !== -1) return false;
      }
    }

    /* whole-word pass on the original tokenization (leet-mapped) */
    var words = deLeet(scrubbed).split(/[^a-z]+/);
    for (var w = 0; w < words.length; w++) {
      if (!words[w]) continue;
      if (BLOCK_WORD.indexOf(words[w]) !== -1) return false;
      if (BLOCK_WORD.indexOf(collapse(words[w])) !== -1) return false;
    }
    return true;
  }

  /* For display surfaces (wall/board): never trust stored input */
  function displayName(name) {
    return isClean(name) ? name : '';
  }

  return { isClean: isClean, displayName: displayName };
})();
