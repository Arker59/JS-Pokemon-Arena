"use strict";

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

const API_LIST_URL = 'https://pokeapi.co/api/v2/pokemon?limit=100000';
const OUTPUT_DIR = './data';

function simplifyDamageRelations(damageRelations) {
  const simplified = {};
  for (const key in damageRelations) {
    simplified[key] = damageRelations[key].map(type => type.name);
  }
  return simplified;
}

async function fetchAllPokemon() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const listRes = await fetch(API_LIST_URL);
    if (!listRes.ok) throw new Error(`error list : ${listRes.status}`);

    const listData = await listRes.json();
    const allPokemon = listData.results;

    console.log(`total pokemon found ${allPokemon.length}`);

    for (let i = 0; i < allPokemon.length; i++) {
      const { id, name, url } = allPokemon[i];
      console.log(`(${i + 1}/${allPokemon.length}) get data from ${name}`);

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`error res : ${res.status}`);
        const data = await res.json();

        let damageToTypes = {};
        try {
          const typeUrl = data.types[0]?.type?.url;
          if (typeUrl) {
            const typeRes = await fetch(typeUrl);
            const typeData = await typeRes.json();
            damageToTypes = simplifyDamageRelations(typeData.damage_relations);
          }
        } catch (e) {
          console.warn(`no relations : ${name}`);
        }

        const formattedData = {
          name: data.name,
          id: data.id,
          base_experience: data.base_experience,
          height: data.height / 10, 
          weight: data.weight / 10, 
          types: data.types.map(t => t.type.name),
          stats: Object.fromEntries(data.stats.map(stat => [
            stat.stat.name,
            stat.base_stat
          ])),
          damageToTypes
        };

        const filePath = path.join(OUTPUT_DIR, `pokemon-${String(data.id - 1).padStart(4, '0')}.json`);
        await fs.writeFile(filePath, JSON.stringify(formattedData, null, 2));

        await new Promise(res => setTimeout(res, 800)); 
      } catch (err) {
        console.error(`error on ${name}: ${err.message}`);
      }
    }

    console.log('all pokemon has been catched !');
  } catch (err) {
    console.error('major error', err.message);
  }
}

fetchAllPokemon();
