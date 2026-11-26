import type {Coordinate} from '../types/navigation';

export interface RouteProgressResult {
  nearestSegmentIndex: number;
  distanceFromRouteMeters: number;
  distanceAlongRouteMeters: number;
  offRouteCandidate: boolean;
  wrongWayCandidate: boolean;
}

const R = 6371008.8;
const rad = (degrees: number) => degrees * Math.PI / 180;

function haversine(a: Coordinate, b: Coordinate): number {
  const p1 = rad(a[1]), p2 = rad(b[1]);
  const dp = p2 - p1, dl = rad(b[0] - a[0]);
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function bearing(a: Coordinate, b: Coordinate): number {
  const p1 = rad(a[1]), p2 = rad(b[1]), dl = rad(b[0] - a[0]);
  return (Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)) * 180 / Math.PI + 360) % 360;
}

function angleDiff(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}

/**
 * Geometric route progress estimate, not road-network map matching.
 * When a previous progress value is supplied, constrain matching to a forward
 * corridor with a small backwards tolerance to reduce jumps at crossings.
 */
export function evaluateRouteProgress(
  route: Coordinate[],
  location: Coordinate,
  speedMetersPerSecond?: number,
  courseDegrees?: number,
  previousDistanceAlongRouteMeters?: number,
): RouteProgressResult | null {
  if (route.length < 2) return null;

  const cumulative = new Array<number>(route.length).fill(0);
  for (let i = 1; i < route.length; i++) cumulative[i] = cumulative[i - 1] + haversine(route[i - 1], route[i]);

  const moving = typeof speedMetersPerSecond === 'number' && speedMetersPerSecond > 3;
  const hasCourse = typeof courseDegrees === 'number' && Number.isFinite(courseDegrees);
  const forwardWindow = Math.max(150, (moving ? speedMetersPerSecond! : 0) * 12 + 60);
  const minAlong = previousDistanceAlongRouteMeters === undefined ? 0 : Math.max(0, previousDistanceAlongRouteMeters - 35);
  const maxAlong = previousDistanceAlongRouteMeters === undefined ? cumulative[cumulative.length - 1] : previousDistanceAlongRouteMeters + forwardWindow;

  let bestScore = Infinity;
  let bestDistance = Infinity;
  let bestIndex = -1;
  let bestAlong = 0;
  let bestBearing = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i], b = route[i + 1];
    const segmentLength = cumulative[i + 1] - cumulative[i];
    if (cumulative[i + 1] < minAlong || cumulative[i] > maxAlong) continue;

    const meanLatitude = rad((a[1] + b[1] + location[1]) / 3);
    const scaleX = Math.cos(meanLatitude) * R * Math.PI / 180;
    const scaleY = R * Math.PI / 180;
    const ax = (a[0] - location[0]) * scaleX, ay = (a[1] - location[1]) * scaleY;
    const bx = (b[0] - location[0]) * scaleX, by = (b[1] - location[1]) * scaleY;
    const dx = bx - ax, dy = by - ay;
    const denominator = dx * dx + dy * dy;
    const t = denominator === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / denominator));
    const distance = Math.hypot(ax + t * dx, ay + t * dy);
    const along = cumulative[i] + segmentLength * t;

    // Small continuity penalty breaks ties at intersections in favour of the
    // segment nearest the previous route progress without overriding distance.
    const continuityPenalty = previousDistanceAlongRouteMeters === undefined
      ? 0
      : Math.min(18, Math.abs(along - previousDistanceAlongRouteMeters) * 0.025);
    const score = distance + continuityPenalty;
    if (score < bestScore) {
      bestScore = score;
      bestDistance = distance;
      bestIndex = i;
      bestAlong = along;
      bestBearing = bearing(a, b);
    }
  }

  if (bestIndex < 0) return null;
  const distanceFromRouteMeters = Math.max(0, bestDistance);
  return {
    nearestSegmentIndex: bestIndex,
    distanceFromRouteMeters,
    distanceAlongRouteMeters: bestAlong,
    offRouteCandidate: distanceFromRouteMeters > 45,
    wrongWayCandidate: moving && hasCourse && angleDiff(courseDegrees!, bestBearing) > 135,
  };
}
