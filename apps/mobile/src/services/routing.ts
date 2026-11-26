import {CONFIG} from '../config';
import {decodePolyline6} from '../utils/polyline';
import type {Coordinate,NavigationManeuver,RouteSummary} from '../types/navigation';
const R=6371008.8;
const rad=(d:number)=>d*Math.PI/180;
function distance(a:Coordinate,b:Coordinate):number{const p1=rad(a[1]),p2=rad(b[1]),dp=p2-p1,dl=rad(b[0]-a[0]);const h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));}
export async function calculateRoute(origin:Coordinate,destination:Coordinate):Promise<RouteSummary>{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),CONFIG.requestTimeoutMs);
  try {
    const response=await fetch(`${CONFIG.valhallaURL}/route`,{method:'POST',headers:{'content-type':'application/json'},signal:controller.signal,body:JSON.stringify({locations:[{lon:origin[0],lat:origin[1],type:'break'},{lon:destination[0],lat:destination[1],type:'break'}],costing:'auto',units:'kilometers',directions_options:{units:'kilometers'}})});
    if(!response.ok)throw Error(`Routing failed (${response.status})`);
    const data=await response.json();const trip=data.trip;
    if(!trip?.legs?.length||!trip.summary)throw Error('No drivable route was returned.');
    const shape:Coordinate[]=[];const pending:{instruction:string;shapeIndex:number}[]=[];
    for(const leg of trip.legs){
      const legShape:Coordinate[]=decodePolyline6(leg.shape);
      const offset=shape.length;
      shape.push(...legShape);
      for(const maneuver of leg.maneuvers??[]){
        if(typeof maneuver.instruction==='string'&&Number.isFinite(maneuver.begin_shape_index))pending.push({instruction:maneuver.instruction,shapeIndex:offset+Math.max(0,Math.min(legShape.length-1,maneuver.begin_shape_index))});
      }
    }
    const cumulative=[0];
    for(let i=1;i<shape.length;i++)cumulative[i]=cumulative[i-1]+distance(shape[i-1],shape[i]);
    const maneuvers:NavigationManeuver[]=pending.map(item=>({instruction:item.instruction,distanceAlongRouteMeters:cumulative[item.shapeIndex]??0}));
    return{distanceMeters:trip.summary.length*1000,durationSeconds:trip.summary.time,shape,instructions:maneuvers.map(m=>m.instruction),maneuvers};
  } catch(error) {
    if(error instanceof Error&&error.name==='AbortError')throw Error('Routing request timed out. Check your Valhalla service.');
    throw error;
  } finally {clearTimeout(timeout);}
}
