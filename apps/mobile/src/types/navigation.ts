export type Coordinate=[number,number];
export interface Place{id:string;name:string;label:string;coordinate:Coordinate;}
export interface RouteSummary{distanceMeters:number;durationSeconds:number;shape:Coordinate[];instructions:string[];}
export type Personality='friendly'|'strict'|'funny'|'angry'|'professional';
