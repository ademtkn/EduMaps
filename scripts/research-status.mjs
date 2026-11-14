import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('data/research/2026-11-schools');
const expected = { 'bishkek-a':7, 'bishkek-b':8, tokmok:5, 'issyk-kul':3, karakol:2, naryn:2, 'jalal-abad':5, talas:2 };
const state = await readFile(path.join(root,'import-state.json'),'utf8').then(JSON.parse).catch(()=>({schools:{},assets:{}}));
const lines = ['# School research and import checkpoint','',`Updated: ${new Date().toLocaleString('sv-SE',{timeZone:'Asia/Bishkek'})} (Asia/Bishkek).`,'','User target:34 institutions. Genius.kg Tokmok remains a draft by explicit user instruction; SI was confirmed to mean QSI.','', '| Batch | Requested | Researched | Publishable | In local DB | Logo + two images in DB |','|---|---:|---:|---:|---:|---:|'];
const batches=[];
for(const [batch,count] of Object.entries(expected)){
 const records = await readFile(path.join(root,batch+'.json'),'utf8').then(JSON.parse).catch(()=>[]);
 const imported = records.filter(s=>state.schools[s.slug]);
 const complete = imported.filter(s=>state.assets[s.slug+'/logo']&&state.assets[s.slug+'/photo-1']&&state.assets[s.slug+'/photo-2']);
 lines.push(`| ${batch} | ${count} | ${records.length} | ${records.filter(s=>s.publishable).length} | ${imported.length} | ${complete.length} |`);
 batches.push({batch,records});
}
const selectedRecords=batches.flatMap(b=>b.records);
const selectedImported=selectedRecords.filter(s=>state.schools[s.slug]).length;
const historicalCandidates=Object.keys(state.schools).length-selectedImported;
lines.push('',`Selected records locally imported: ${selectedImported}/${selectedRecords.length}. Preserved historical candidates: ${historicalCandidates}. Stored image assets: ${Object.keys(state.assets).length}.`,'','## Resume commands','','```sh','node --import tsx scripts/import-researched-schools.ts             # validate only','node --import tsx scripts/import-researched-schools.ts --apply     # loopback Supabase only','node scripts/research-status.mjs                                  # refresh this checkpoint','```','','Never run setup, reset or seed to resume. They erase local data. Import state is saved after every school/asset; original changed school rows are backed up in data/research/2026-11-schools/backups/. Source manifests and downloaded images are retained. Do not run next build and next dev at the same time.','','## Per-institution gaps','');
for(const {batch,records} of batches){
 lines.push(`### ${batch}`,'');
 for(const s of records){
  const imported=state.schools[s.slug];
  const absent=['logo','photo-1','photo-2'].filter(kind=>!state.assets[s.slug+'/'+kind]);
  lines.push(`- **${s.name.en}** — ${s.publishable?'ready to publish':'draft'}; DB:${imported?.status??'not imported'}; missing stored media:${absent.join(', ')||'none'}.`);
  for(const note of s.missing??[]) lines.push(`  - ${note}`);
 }
 lines.push('');
}
lines.push('## Source evidence','','Each batch JSON retains field-level source URLs, access dates, media source pages, localPath references, warnings and explicit missing fields. Generated2GIS coordinate views are distinguished from confirmed firm listings. Public Ministry evidence and request descriptions are under shared-ministry/. See each batch .md for its research trail.','');
await writeFile('docs/handoff/schools-status.md',lines.join('\n'));
console.log(JSON.stringify({researched:selectedRecords.length,target:34,imported:selectedImported,historicalCandidates,assets:Object.keys(state.assets).length,checkpoint:'docs/handoff/schools-status.md'}));
