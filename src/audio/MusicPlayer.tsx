import {useEffect, useRef, useState} from 'react';
import {BackgroundMusicController} from './BackgroundMusicController';
import {MusicSource} from './MusicSource';
import type {MusicSnapshot} from './BackgroundMusicController';
import {claimAudio,getAudioFocus,pauseTeamAudio,subscribeAudioFocus} from '../team/audioFocus';
import config from '../../content/release/music.json';
import './music.css';

const key='footprints-music-v2';
function preference() {
  try {
    const saved=JSON.parse(localStorage.getItem(key)??'null');
    // A first visit stays silent; only a saved explicit preference may resume playback.
    const volume=saved?.volume??JSON.parse(localStorage.getItem('footprints-music-v1')??'null')?.volume;
    return {enabled:typeof saved?.enabled==='boolean'?saved.enabled:false,volume:typeof volume==='number'&&Number.isFinite(volume)?Math.max(0,Math.min(1,volume)):config.defaultVolume};
  } catch {return {enabled:false,volume:config.defaultVolume};}
}

/** Mounted once outside the chapter tree; never resets source or position on navigation. */
export default function MusicPlayer() {
  const audio=useRef<HTMLAudioElement>(null),controller=useRef<BackgroundMusicController|null>(null);
  const [state,setState]=useState<MusicSnapshot>({...preference(),status:'off'});
  useEffect(()=>{
    const element=audio.current;if(!element)return;
    const useOpus=!!element.canPlayType('audio/ogg; codecs="opus"');
    const paths=[useOpus?config.opus:config.aac,useOpus?config.aac:config.opus].map(path=>import.meta.env.BASE_URL+path);
    const source=new MusicSource(element,paths);
    element.dataset.musicSource=new URL(paths[0],location.href).href;
    const music=new BackgroundMusicController(element,preference(),450,source.prepare);controller.current=music;
    const refresh=()=>{
      const focus=getAudioFocus();
      music.setEnvironment({entryReady:!focus.introBlocking&&!document.documentElement.dataset.footprintsEntry&&!document.querySelector('.film-shell[data-entry-motion="running"]'),foreground:!!focus.owner,visible:!document.hidden});
    };
    const unsubscribe=music.subscribe(()=>{
      const next=music.getSnapshot();setState(next);
      try{localStorage.setItem(key,JSON.stringify({enabled:next.enabled,volume:next.volume}));}catch{/* Private modes may disable storage. */}
    });
    const focusOff=subscribeAudioFocus(refresh);
    const observer=new MutationObserver(refresh);
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-footprints-entry']});
    const shell=element.closest('.film-shell');if(shell)observer.observe(shell,{attributes:true,attributeFilter:['data-entry-motion']});
    const foreground=(event:Event)=>{
      const media=event.target;
      if(!(media instanceof HTMLMediaElement)||media===element||media.closest('.intro-sequence'))return;
      if(getAudioFocus().introBlocking){media.pause();return;}
      claimAudio(media);
    };
    const visibility=()=>{if(document.hidden)pauseTeamAudio();refresh();};
    const resourceError=()=>{
      if(source.fallback())music.retryAfterSourceChange();
      else music.fail();
    };
    const gesture=(event:Event)=>{
      if(!event.isTrusted || (event.target instanceof Element && event.target.closest('.global-music')))return;
      if(event instanceof KeyboardEvent && (event.repeat || event.ctrlKey || event.altKey || event.metaKey))return;
      music.resumeOnGesture();
    };
    document.addEventListener('play',foreground,true);
    document.addEventListener('pointerup',gesture);
    document.addEventListener('keydown',gesture);
    document.addEventListener('visibilitychange',visibility);
    element.addEventListener('error',resourceError);
    refresh();setState(music.getSnapshot());
    return ()=>{unsubscribe();focusOff();observer.disconnect();document.removeEventListener('play',foreground,true);document.removeEventListener('pointerup',gesture);document.removeEventListener('keydown',gesture);document.removeEventListener('visibilitychange',visibility);element.removeEventListener('error',resourceError);music.dispose();source.dispose();controller.current=null;};
  },[]);
  const label=state.status==='playing'?'音乐播放中':state.status==='loading'?'音乐加载中':state.status==='error'?'音乐加载失败':state.status==='blocked'?'点击开启音乐':state.enabled?'音乐暂停中':'音乐关闭';
  const action=state.status==='error'?'重试播放背景音乐':state.status==='blocked'?'开启背景音乐《烽火中的足迹》':state.enabled?'关闭背景音乐':'开启背景音乐《烽火中的足迹》';
  return <aside className="global-music" aria-label="全站背景音乐" data-music-status={state.status} data-music-enabled={state.enabled}>
    <audio ref={audio} data-background-music="war" preload="none" loop playsInline />
    <button className="music-toggle" type="button" aria-label={action} aria-pressed={state.enabled} title="《烽火中的足迹》 · 背景音乐" onClick={()=>{if(state.status==='error')audio.current?.load();controller.current?.userToggle();}}>
      <span className="music-note" aria-hidden="true">♫</span><span>{label}</span>
    </button>
    <details className="music-volume"><summary aria-label="调整背景音乐音量" title="调整音量">音量</summary><label>背景音乐音量<input type="range" min="0" max="1" step="0.01" value={state.volume} aria-label="背景音乐音量" onChange={event=>controller.current?.setVolume(Number(event.target.value))}/><output>{Math.round(state.volume*100)}%</output></label><p>《烽火中的足迹》</p></details>
    <span className="sr-only" role="status">{label}</span>
  </aside>;
}
