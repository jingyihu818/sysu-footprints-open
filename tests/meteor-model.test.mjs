import test from 'node:test';
import assert from 'node:assert/strict';
import {meteorScore,meteorTravel} from '../src/motion/meteorModel.ts';
test('all light traces have substantial horizontal and vertical travel on every supported width',()=>{
 for(const width of [320,390,760,1440,1920])for(const s of meteorScore){
  const t=meteorTravel(s,width),angle=Math.atan2(t.y,t.x)*180/Math.PI;
  assert.ok(t.x>100&&t.y>60);assert.ok(angle>=25&&angle<=50);
 }
});
test('sparse score never exceeds three primary traces across ten minutes',()=>{
 let max=0;
 for(let time=0;time<600;time+=.05){
  const primary=meteorScore.filter(s=>s.depth!=='far'&&time>=s.delay&&((time-s.delay)%s.cycle)<s.cycle*s.flight).length;
  max=Math.max(max,primary);assert.ok(primary<=3);
 }
 assert.ok(max>=2);
});
test('depth, speed and appearance times vary within one consistent lighting direction',()=>{
 assert.equal(new Set(meteorScore.map(s=>s.depth)).size,3);
 assert.equal(new Set(meteorScore.map(s=>s.delay)).size,meteorScore.length);
 const velocities=meteorScore.map(s=>meteorTravel(s,1440).x/(s.flight*s.cycle));
 assert.ok(Math.max(...velocities)>Math.min(...velocities)*2);
 assert.ok(meteorScore.find(s=>s.depth==='near').cycle>=40);
});
