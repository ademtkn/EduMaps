/** Read-only checks of selected research profiles, stored media and optional local HTTP pages. */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFile, writeFile } from 'node:fs/promises';
config({path:'.env.local',quiet:true});
const root='data/research/2026-11-schools';
const batches=['bishkek-a','bishkek-b','tokmok','issyk-kul','karakol','naryn','jalal-abad','talas'];
const records=(await Promise.all(batches.map(async b=>JSON.parse(await readFile(`${root}/${b}.json`,'utf8'))))).flat();
const state=JSON.parse(await readFile(`${root}/import-state.json`,'utf8'));
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
if(!url||!['localhost','127.0.0.1'].includes(new URL(url).hostname))throw new Error('Local Supabase required.');
const db=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const anon=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const failures=[], gaps=[], results=[];
const check=(ok,text)=>{if(!ok)failures.push(text);};
check(records.length===34,'Selection must contain34 records.');
check(new Set(records.map(s=>s.slug)).size===records.length,'Duplicate selected slugs.');
let published=0,completeMedia=0;
for(const s of records){
 const {data:row,error}=await db.from('schools').select('*,school_locations(*),school_languages(*),school_programs(*),school_media(*),cities(slug)').eq('slug',s.slug).single();
 if(error||!row){failures.push(`${s.slug}: ${error?.message??'missing DB row'}`);continue;}
 check(row.status===(s.publishable?'published':'draft'),`${s.slug}: publication state differs`);
 check(row.data_status==='unverified',`${s.slug}: public-source profile must stay unverified`);
 check(row.cities.slug===s.city.slug,`${s.slug}: wrong city`);
 for(const lang of ['kg','ru','en'])check(row.name[lang]===s.name[lang]&&Boolean(row.name[lang]),`${s.slug}: ${lang} name mismatch`);
 check(row.grade_from===s.gradeFrom&&row.grade_to===s.gradeTo,`${s.slug}: unknown/preschool grade bounds changed`);
 check(row.school_type===s.schoolType,`${s.slug}: school type mismatch`);
 for(const field of ['phone','email','website'])check(row[field]===s[field],`${s.slug}: stale or mismatched ${field}`);
 check(Boolean(row.whatsapp)===Boolean(s.whatsapp),`${s.slug}: stale WhatsApp contact`);
 for(const field of ['instagram','facebook'])check((row.social?.[field]??null)===s[field],`${s.slug}: stale or mismatched ${field}`);
 const location=Array.isArray(row.school_locations)?row.school_locations[0]:row.school_locations;
 if(s.address&&Object.values(s.address).some(Boolean))for(const lang of ['kg','ru','en'])check(location?.address?.[lang]===s.address[lang],`${s.slug}: ${lang} address mismatch`);
 if(s.lat!==null)check(location?.lat!=null&&Math.abs(Number(location.lat)-s.lat)<=0.000001&&Math.abs(Number(location.lng)-s.lng)<=0.000001,`${s.slug}: location differs from sourced coordinates`);
 if(s.twoGisUrl)check(location?.twogis_url===s.twoGisUrl,`${s.slug}: map link mismatch`);
 check(!row.school_media.some(m=>m.url.includes(`/seed/schools/${s.slug}/`)),`${s.slug}: seed illustration remains`);
 for(const code of s.languages)check(row.school_languages.some(l=>l.language_code===code),`${s.slug}: missing instructional language ${code}`);
 check(row.school_languages.every(l=>s.languages.includes(l.language_code)),`${s.slug}: stale unsourced instructional language`);
 check(row.school_languages.filter(l=>l.is_primary).every(l=>l.language_code===s.primaryLanguage),`${s.slug}: unsourced primary language`);
 const missingMedia=[];
 for(const kind of ['logo','photo-1','photo-2']){
  const asset=state.assets[`${s.slug}/${kind}`];
  if(!asset){missingMedia.push(kind);continue;}
  if(kind==='logo')check(row.logo_url===asset.publicUrl,`${s.slug}: logo URL not stored`);
  else check(row.school_media.some(m=>m.kind==='image'&&m.url===asset.publicUrl),`${s.slug}: ${kind} not in gallery`);
  const response=await fetch(asset.publicUrl,{method:'HEAD',signal:AbortSignal.timeout(10000)});
  check(response.ok&&response.headers.get('content-type')?.startsWith('image/'),`${s.slug}: ${kind} image inaccessible`);
 }
 if(!missingMedia.length)completeMedia++;
 else gaps.push({slug:s.slug,media:missingMedia,fields:s.missing});
 const publicRow=await anon.from('schools').select('id').eq('slug',s.slug).maybeSingle();
 check(!publicRow.error&&Boolean(publicRow.data)===s.publishable,`${s.slug}: public visibility mismatch`);
 if(s.publishable)published++;
 if(process.argv.includes('--http'))for(const lang of ['kg','ru','en']){
  const target=`http://localhost:3100/${lang}/schools/${s.slug}`;
  const response=await fetch(target,{signal:AbortSignal.timeout(30000)});
  const html=await response.text();
  check(response.status===(s.publishable?200:404),`${s.slug}/${lang}: HTTP${response.status}`);
  if(s.publishable)check(html.includes(s.name[lang]),`${s.slug}/${lang}: localized school name absent`);
 }
 results.push({slug:s.slug,status:row.status,mediaComplete:!missingMedia.length});
}
const report={checkedAt:new Date().toISOString(),selected:records.length,published,drafts:records.length-published,completeMedia,managedAssetCount:Object.keys(state.assets).length,httpChecked:process.argv.includes('--http'),failures,gaps,results};
await writeFile(`${root}/verification.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({selected:report.selected,published,drafts:report.drafts,completeMedia,assets:report.managedAssetCount,httpChecked:report.httpChecked,failures}));
if(failures.length)process.exitCode=1;
