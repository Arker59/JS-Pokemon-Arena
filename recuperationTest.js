"use strict";

import fs from 'fs';

let path = 'data/pokemon-';
let i = Math.floor(Math.random() * 76) + 1;
let url = (path + i + ".json")

let result;
let contenu = fs.readFileSync(url, "utf-8");

result = JSON.parse(contenu);

console.log(url);
console.log(result.name);

//TODO: relier frameAnalysistFunction ici et script.js (à renommer) afin de faire l'automatisation de l'envoie de pokémon dans l'arène avec leur animations frame ajouté au json