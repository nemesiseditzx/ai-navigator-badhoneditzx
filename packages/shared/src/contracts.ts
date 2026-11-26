export type TravelMode='auto'|'bicycle'|'pedestrian';
export type Personality='friendly'|'strict'|'funny'|'angry'|'professional'|'silent';
export type NavigationState='idle'|'planning'|'navigating'|'off_route'|'arrived'|'error';
export interface Coordinate{latitude:number;longitude:number}
export interface RouteRequest{origin:Coordinate;destination:Coordinate;mode:TravelMode;alternatives?:number}
export interface NavigationSnapshot{state:NavigationState;destinationLabel?:string;distanceRemainingMeters?:number;nextInstruction?:string;distanceToNextManeuverMeters?:number;etaEpochSeconds?:number;source:'navigation-engine'}
export interface AiToolRequest{tool:'get_next_turn'|'get_eta'|'search_nearby'|'request_reroute'|'get_saved_places';arguments:Record<string,string|number|boolean>}
