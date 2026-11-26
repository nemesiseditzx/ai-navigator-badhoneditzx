import {CONFIG} from '../config';
import type {Personality,RouteSummary} from '../types/navigation';
export type AssistantChatMessage={role:'user'|'assistant';content:string};
export function navigationReaction(event:'off_route'|'rerouted'|'arriving',personality:Personality):string{const m:Record<typeof event,Record<Personality,string>>={off_route:{friendly:'Looks like we missed the route. I am finding another way.',strict:'You are off route. Stay calm; recalculating now.',funny:'Well, that was not the road we planned. Let me fix it.',angry:'HEY! Wrong turn. I am recalculating. Do not make a sudden move.',professional:'Route deviation detected. Recalculating your route.'},rerouted:{friendly:'I found another route. Follow the updated directions.',strict:'New route ready. Follow the updated instructions.',funny:'Plan B is ready. Let us get back on track.',angry:'New route ready. Follow it carefully this time.',professional:'Route updated. Continue using the new guidance.'},arriving:{friendly:'We are almost there. Your destination is nearby.',strict:'You are approaching your destination.',funny:'Destination incoming. Nice work getting here.',angry:'Almost there. Keep your eyes on the road.',professional:'You are approaching the destination.'}};return m[event][personality];}
export function parseLocalCommand(text:string):'repeat'|'mute'|'unknown'{const v=text.toLowerCase();if(/repeat|say that again|abar bolo|আবার বল/.test(v))return'repeat';if(/mute|quiet|silence|চুপ|বন্ধ কর/.test(v))return'mute';return'unknown';}
export async function askLocalAssistant(message:string,personality:Personality,history:AssistantChatMessage[],route?:RouteSummary|null,destinationName?:string):Promise<string>{
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),CONFIG.requestTimeoutMs);
  const routeContext=route?'Active route: destination '+(destinationName??'selected destination')+', '+(route.distanceMeters/1000).toFixed(1)+' km, estimated '+Math.round(route.durationSeconds/60)+' minutes. First current route instruction: '+(route.instructions[0]??'not available')+'.':'No active route.';
  const system='You are AI Navigator, a concise and friendly driving companion. Personality: '+personality+'. Reply in the same language as the user message (Bangla, English, or mixed). Keep spoken answers to one or two short sentences. '+routeContext+' Never invent road conditions, traffic, speed limits, or route instructions. The navigation engine, not you, calculates routes. Never tell the driver to make a sudden or illegal maneuver; tell them to follow road signs and drive safely. If the user asks something unrelated to driving, answer briefly. This model runs on the user own local server; do not claim to access the internet or live map data.';
  try {
    const response=await fetch(CONFIG.assistantURL,{method:'POST',headers:{'content-type':'application/json'},signal:controller.signal,body:JSON.stringify({temperature:0.35,max_tokens:120,messages:[{role:'system',content:system},...history.slice(-10),{role:'user',content:message}]})});
    if(!response.ok)throw new Error('Local assistant returned HTTP '+response.status);
    const data=await response.json();const answer=data.choices?.[0]?.message?.content;
    if(typeof answer!=='string'||!answer.trim())throw new Error('The local assistant returned an empty response.');
    return answer.trim();
  } catch(error) {
    if(error instanceof Error&&error.name==='AbortError')throw new Error('Local assistant timed out. Check that llama.cpp is running on your network.');
    if(error instanceof TypeError)throw new Error('Local assistant is offline. Start llama.cpp or check assistantURL in src/config.ts.');
    throw error;
  } finally {clearTimeout(timeout);}
}
