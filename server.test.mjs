import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generate,createServer} from './server.mjs';
const card={title:'수업 프로젝트',period:'2026',summary:'설문 분석',contributions:['설문 분석'],achievements:[],skills:['Python']};
test('AI sends evidence and validates structured activity output',async()=>{
 const result=await generate('activity',{source:'설문 분석을 맡았다'},{key:'test',fetcher:async(url,options)=>{assert.match(url,/generateContent/);const body=JSON.parse(options.body);assert.match(body.systemInstruction.parts[0].text,/과장하지/);assert.equal(options.headers['x-goog-api-key'],'test');return Response.json({candidates:[{content:{parts:[{text:JSON.stringify(card)}]}}]})}});assert.deepEqual(result,card);
});
test('missing key and empty evidence report actionable errors',async()=>{await assert.rejects(generate('activity',{source:'기록'},{key:''}),{status:503});await assert.rejects(generate('activity',{source:''},{key:'test'}),{status:400})});
test('rejects invalid model response and handles quota errors',async()=>{await assert.rejects(generate('activity',{source:'기록'},{key:'test',fetcher:async()=>Response.json({candidates:[{content:{parts:[{text:'{"title":3}'}]}}]})}),{status:502});await assert.rejects(generate('profile',{source:'기록'},{key:'test',fetcher:async()=>new Response('',{status:429})}),{status:429})});
test('HTTP server serves UI but never secrets or source, rejects foreign origins',async()=>{const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));try{const base=`http://127.0.0.1:${server.address().port}`;assert.equal((await fetch(base)).status,200);for(const name of ['.env.local','server.mjs','.git/config'])assert.equal((await fetch(`${base}/${name}`)).status,404);assert.equal((await fetch(`${base}/api/ai/activity`,{method:'POST',headers:{Origin:'https://other.example'},body:'{}'})).status,403)}finally{await new Promise(r=>server.close(r))}});
