import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLocalCommand, navigationReaction} from './assistant';

test('recognizes repeat commands in English and Bangla', () => {
  assert.equal(parseLocalCommand('repeat'), 'repeat');
  assert.equal(parseLocalCommand('abar bolo'), 'repeat');
  assert.equal(parseLocalCommand('আবার বলো'), 'repeat');
});

test('recognizes mute commands', () => {
  assert.equal(parseLocalCommand('mute'), 'mute');
  assert.equal(parseLocalCommand('চুপ কর'), 'mute');
});

test('recognizes unmute commands in English and Bangla', () => {
  assert.equal(parseLocalCommand('unmute'), 'unmute');
  assert.equal(parseLocalCommand('voice on'), 'unmute');
  assert.equal(parseLocalCommand('আবার চালু কর'), 'unmute');
});

test('keeps unknown requests explicit instead of pretending to understand', () => {
  assert.equal(parseLocalCommand('find me a coffee shop'), 'unknown');
});

test('angry navigation reaction still gives a safety instruction', () => {
  assert.match(navigationReaction('off_route', 'angry'), /Do not make a sudden move/);
});
