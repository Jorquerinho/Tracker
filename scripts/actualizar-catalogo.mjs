import {readFile,writeFile,access} from 'node:fs/promises';
const root=new URL('../',import.meta.url),teams=JSON.parse(await readFile(new URL('escudos/catalogo.json',root),'utf8')),ids=new Set(),names=new Set();
for(const team of teams){
  if(!team||!/^[a-z0-9-]+$/.test(team.id)||typeof team.name!=='string'||!team.name.trim()||typeof team.country!=='string'||!Array.isArray(team.aliases)||team.aliases.some(a=>typeof a!=='string')||team.crest!==`escudos/${team.id}.png`)throw Error('Entrada inválida: '+JSON.stringify(team));
  if(ids.has(team.id)||names.has(team.name.toLowerCase()))throw Error('Equipo duplicado: '+team.name);ids.add(team.id);names.add(team.name.toLowerCase());
  await access(new URL(team.crest,root));
}
await writeFile(new URL('src/teams-data.js',root),'// Catálogo local de clubes. Las imágenes viven en escudos/.\nexport const TEAMS = '+JSON.stringify(teams,null,2)+';\n');
console.log(`${teams.length} equipos actualizados. Recuerda incrementar VERSION en sw.js antes de publicar.`);
