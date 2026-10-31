/** Gesture-triggered complete-file cache: reliable finite duration/looping on hosts without Range. */
export class MusicSource {
  private element: HTMLAudioElement;
  private paths: string[];
  private index=0;
  private objectUrl: string|null=null;
  private pending: Promise<void>|null=null;
  private abort=new AbortController();
  private disposed=false;
  constructor(element:HTMLAudioElement,paths:string[]) {this.element=element;this.paths=paths;}
  prepare=():Promise<void>=>{
    if(this.objectUrl)return Promise.resolve();
    if(this.pending)return this.pending;
    this.pending=this.load().finally(()=>{this.pending=null;});return this.pending;
  };
  private async load():Promise<void> {
    try {
      const path=this.paths[this.index];
      const response=await fetch(path,{signal:this.abort.signal});
      if(!response.ok)throw new Error('Music resource unavailable');
      const blob=await response.blob();
      if(blob.size<1024||!blob.type.startsWith('audio/'))throw new Error('Music response is not audio');
      if(this.disposed)throw new DOMException('Disposed','AbortError');
      this.objectUrl=URL.createObjectURL(blob);
      this.element.dataset.musicSource=new URL(path,location.href).href;
      this.element.src=this.objectUrl;this.element.load();
    }catch(error){
      if(!this.disposed&&this.index<this.paths.length-1){this.index++;return this.load();}
      throw error;
    }
  }
  fallback() {
    if(this.index>=this.paths.length-1)return false;
    this.index++;
    if(this.objectUrl)URL.revokeObjectURL(this.objectUrl);
    this.objectUrl=null;this.pending=null;return true;
  }
  dispose() {this.disposed=true;this.abort.abort();if(this.objectUrl)URL.revokeObjectURL(this.objectUrl);this.objectUrl=null;}
}
