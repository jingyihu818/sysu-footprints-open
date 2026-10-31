export type MusicStatus = 'off' | 'paused' | 'loading' | 'playing' | 'blocked' | 'error';
export interface MusicSnapshot { enabled: boolean; volume: number; status: MusicStatus }
interface Environment { entryReady: boolean; foreground: boolean; visible: boolean }
type MediaPort = Pick<HTMLMediaElement, 'play' | 'pause' | 'paused' | 'volume' | 'addEventListener' | 'removeEventListener'>;

/** One persistent media element; browser play rejection remains distinct from user intent. */
export class BackgroundMusicController {
  private media: MediaPort;
  private state: MusicSnapshot;
  private env: Environment = {entryReady:false,foreground:false,visible:true};
  private failure: 'blocked' | 'error' | null = null;
  private disposed = false;
  private generation = 0;
  private pending = false;
  private fade: ReturnType<typeof setInterval> | null = null;
  private fadeMs: number;
  private prepare?: () => Promise<void>;
  private listeners = new Set<() => void>();
  constructor(media: MediaPort, preference: {enabled:boolean;volume:number}, fadeMs=450, prepare?:()=>Promise<void>) {
    this.media=media; this.fadeMs=fadeMs;
    this.prepare=prepare;
    this.state={enabled:preference.enabled,volume:Number.isFinite(preference.volume)?Math.max(0,Math.min(1,preference.volume)):.16,status:preference.enabled?'paused':'off'};
    media.volume=0;
    media.addEventListener('playing',this.onPlaying);
    media.addEventListener('waiting',this.onWaiting);
    media.addEventListener('pause',this.onPause);
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => {this.listeners.delete(listener);}; };
  private update(status: MusicStatus) {
    if(this.disposed)return;
    this.state={...this.state,status}; this.listeners.forEach(fn=>fn());
  }
  private eligible() { return !this.disposed && this.state.enabled && !this.failure && this.env.entryReady && this.env.visible && !this.env.foreground; }
  private stopFade() { if(this.fade!==null)clearInterval(this.fade);this.fade=null; }
  private ramp(target:number,after?:()=>void) {
    this.stopFade();
    if(!this.fadeMs){this.media.volume=target;after?.();return;}
    const start=this.media.volume,at=Date.now();
    this.fade=setInterval(()=>{
      const t=Math.min(1,(Date.now()-at)/this.fadeMs);
      this.media.volume=Math.max(0,Math.min(1,start+(target-start)*t));
      if(t===1){this.stopFade();after?.();}
    },16);
  }
  private onPlaying = () => {
    if(!this.eligible()){this.media.pause();return;}
    this.update('playing');this.ramp(this.state.volume);
  };
  private onWaiting = () => { if(this.eligible())this.update('loading'); };
  private onPause = () => {if(this.state.status==='playing'||this.state.status==='loading')this.update(this.state.enabled?'paused':'off');};
  setVolume(volume:number) {
    if(!Number.isFinite(volume))return;
    this.state={...this.state,volume:Math.max(0,Math.min(1,volume))};
    if(this.eligible()&&!this.media.paused)this.ramp(this.state.volume);
    this.update(this.state.status);
  }
  userToggle() {
    if(this.state.enabled && !this.failure)this.state={...this.state,enabled:false};
    else {this.state={...this.state,enabled:true};this.failure=null;}
    this.sync();
  }
  resumeOnGesture() {
    if(!this.state.enabled || this.failure!=='blocked')return;
    this.failure=null;this.sync();
  }
  setEnvironment(env:Environment) { this.env=env;this.sync(); }
  retryAfterSourceChange() {this.generation++;this.pending=false;this.failure=null;this.stopFade();this.media.volume=0;this.media.pause();this.sync();}
  fail() {this.failure='error';this.sync();}
  private sync() {
    if(this.disposed)return;
    if(!this.eligible()){
      this.generation++;this.pending=false;
      const immediate=!this.env.entryReady||!this.env.visible||!this.state.enabled||!!this.failure;
      if(immediate){this.stopFade();this.media.volume=0;this.media.pause();}
      else if(!this.media.paused)this.ramp(0,()=>this.media.pause());
      const status=!this.state.enabled?'off':this.failure??'paused';
      this.update(status);return;
    }
    if(!this.media.paused){this.update('playing');this.ramp(this.state.volume);return;}
    if(this.pending)return;
    this.stopFade();this.pending=true;const attempt=++this.generation;this.update('loading');
    const start=()=>{
      if(attempt!==this.generation||!this.eligible())return;
      return this.media.play().then(()=>{
      if(attempt!==this.generation){if(!this.eligible())this.media.pause();return;}
      this.pending=false;
      if(this.eligible()&&!this.media.paused)this.onPlaying();else this.media.pause();
      });
    };
    const failed=(error: {name?:string})=>{
      if(attempt!==this.generation||this.disposed)return;
      this.pending=false;
      if(error.name==='AbortError'){this.update('paused');return;}
      this.failure=error.name==='NotAllowedError'?'blocked':'error';this.media.pause();this.update(this.failure);
    };
    if(this.prepare)void this.prepare().then(start).catch(failed);
    else void start()?.catch(failed);
  }
  dispose() {
    this.disposed=true;this.generation++;this.stopFade();this.media.pause();
    this.media.removeEventListener('playing',this.onPlaying);this.media.removeEventListener('waiting',this.onWaiting);this.media.removeEventListener('pause',this.onPause);this.listeners.clear();
  }
}
