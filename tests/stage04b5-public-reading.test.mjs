import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectReadingSources,withImageSources} from '../scripts/stage04b5/public-reading.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,''));
test('public source notes keep attribution and omit acquisition instructions without mutating evidence',()=>{
 const original=read('content/release/sources.json'),before=JSON.stringify(original),publicSources=projectReadingSources(original);
 assert.equal(JSON.stringify(original),before);
 for(const source of publicSources){assert.doesNotMatch(source.reviewNote,/本轮用户授权|imageReferences|保存在|逐项签名/);assert.equal(source.imageReferences,undefined);const prior=original.find(s=>s.id===source.id);for(const key of ['title','url','locator','creator'])assert.deepEqual(source[key],prior[key]);}
});
test('each dossier page includes every displayed image source and keeps original page text',()=>{
 const original=read('content/release/exhibition.json').dossiers,events=read('content/release/events.json'),before=JSON.stringify(original);
 const projected=withImageSources(original,events);
 assert.equal(JSON.stringify(original),before);
 for(const dossier of projected)for(const page of dossier.pages){const prior=original.find(d=>d.id===dossier.id).pages.find(p=>p.id===page.id);assert.deepEqual({...page,sourceIds:prior.sourceIds},prior);for(const event of events.filter(e=>page.eventIds.includes(e.id)))for(const media of event.media.filter(m=>m.type==='image'))assert.ok(page.sourceIds.includes(media.sourceId));assert.equal(page.sourceIds.length,new Set(page.sourceIds).size);}
});
