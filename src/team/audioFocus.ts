// One foreground owner, including pending voice requests and videos. Never owns background music.
let current: HTMLMediaElement | null = null;
let introBlocking = true;
const listeners=new Set<()=>void>();
const notify=()=>listeners.forEach(fn=>fn());
const finished=(event:Event)=>{if(event.currentTarget===current)releaseOwnership();};
function detach(element:HTMLMediaElement) { for(const name of ['pause','ended','error'])element.removeEventListener(name,finished); }
function releaseOwnership() {if(!current)return;detach(current);current=null;notify();}
export function subscribeAudioFocus(fn:()=>void) {listeners.add(fn);return ()=>{listeners.delete(fn);};}
export function getAudioFocus() {return {owner:current,introBlocking};}
export function setIntroBlocking(value:boolean) {if(value!==introBlocking){introBlocking=value;notify();}}
export function claimAudio(element: HTMLMediaElement) {
  if(current===element)return;
  const previous=current;if(previous)detach(previous);
  current=element;
  for(const name of ['pause','ended','error'])element.addEventListener(name,finished);
  // Publish the replacement before pausing the old owner: there is no idle gap.
  notify();previous?.pause();
}
export function releaseAudio(element: HTMLMediaElement) {if(current===element)releaseOwnership();element.pause();}
export function pauseTeamAudio() {const previous=current;releaseOwnership();previous?.pause();}
export function ownsAudio(element: HTMLMediaElement) {return current===element;}
