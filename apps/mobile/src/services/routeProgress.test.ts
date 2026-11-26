import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateRouteProgress} from './routeProgress';
import type {Coordinate} from '../types/navigation';

const eastbound: Coordinate[] = [[0, 0], [0.01, 0]];

test('returns null when a route has fewer than two points', () => {
  assert.equal(evaluateRouteProgress([[0, 0]], [0, 0]), null);
});

test('recognizes a position close to the route without false off-route warning', () => {
  const result = evaluateRouteProgress(eastbound, [0.005, 0.00005], 2, 90);
  assert.ok(result);
  assert.equal(result.offRouteCandidate, false);
  assert.ok(result.distanceFromRouteMeters < 10);
});

test('flags a position clearly outside the 45 metre corridor', () => {
  const result = evaluateRouteProgress(eastbound, [0.005, 0.001]);
  assert.ok(result);
  assert.equal(result.offRouteCandidate, true);
  assert.ok(result.distanceFromRouteMeters > 100);
});

test('does not flag wrong-way movement when travelling with the segment', () => {
  const result = evaluateRouteProgress(eastbound, [0.005, 0], 5, 90);
  assert.ok(result);
  assert.equal(result.wrongWayCandidate, false);
});

test('flags a strong heading reversal only while moving', () => {
  const moving = evaluateRouteProgress(eastbound, [0.005, 0], 5, 270);
  const stationary = evaluateRouteProgress(eastbound, [0.005, 0], 0, 270);
  assert.ok(moving && stationary);
  assert.equal(moving.wrongWayCandidate, true);
  assert.equal(stationary.wrongWayCandidate, false);
});

test('keeps route progress near the previous segment at a loop crossing', () => {
  const loop: Coordinate[] = [[0, 0], [0.001, 0], [0.001, 0.001], [0, 0.001], [0, 0]];
  const result = evaluateRouteProgress(loop, [0, 0], 0, 0, 0);
  assert.ok(result);
  assert.ok(result.distanceAlongRouteMeters < 50);
});

test('does not jump far ahead of the previous progress after a noisy GPS fix', () => {
  const route: Coordinate[] = [[0, 0], [0.001, 0], [0.002, 0], [0.003, 0], [0.004, 0]];
  const result = evaluateRouteProgress(route, [0.0039, 0], 5, 90, 0);
  assert.ok(result);
  assert.ok(result.distanceAlongRouteMeters < 180);
});
