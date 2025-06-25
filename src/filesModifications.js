// ===================== /!\ BE CAREFULL WHILE USING THIS FILE /!\ ===================== \\

"use strict";

import fs from 'fs';
import path from 'path';

const baseDir = './SpriteCollab-master';
const targetDir = './sprites';


if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir);
  console.log(`Création de ${targetDir}`);
}

function copyFileIfExists(src, dest) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copie : ${path.basename(src)}`);
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  fs.readdirSync(src).forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

copyFileIfExists(path.join(baseDir, 'credit_names.txt'), path.join(targetDir, 'credit_names.txt'));

const animationsSrc = path.join(baseDir, 'sprite');
const animationsDest = path.join(targetDir, 'animations');
copyDir(animationsSrc, animationsDest);

const portraitsSrc = path.join(baseDir, 'portrait');
const portraitsDest = path.join(targetDir, 'portraits');
copyDir(portraitsSrc, portraitsDest);

const licenseHistorySrc = path.join(baseDir, 'license_history');
const licenseHistoryDest = path.join(targetDir, 'license_history');
copyDir(licenseHistorySrc, licenseHistoryDest);

const folder0000A = path.join(animationsDest, '0000');
if (fs.existsSync(folder0000A)) {
  fs.rmSync(folder0000A, { recursive: true, force: true });
  console.log(`Suppression : ${folder0000A}`);
}

const folder0000P = path.join(portraitsDest, '0000');
if (fs.existsSync(folder0000P)) {
  fs.rmSync(folder0000P, { recursive: true, force: true });
  console.log(`Suppression : ${folder0000P}`);
}

function deleteSubSubFoldersOnly(basePath) {
  if (!fs.existsSync(basePath)) return;

  const firstLevelFolders = fs.readdirSync(basePath).filter(item =>
    fs.statSync(path.join(basePath, item)).isDirectory()
  );

  firstLevelFolders.forEach(folder => {
    const firstLevelPath = path.join(basePath, folder);
    fs.readdirSync(firstLevelPath).forEach(item => {
      const itemPath = path.join(firstLevelPath, item);
      if (fs.statSync(itemPath).isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
        console.log(`Suppression : ${itemPath}`);
      }
    });
  });
}

deleteSubSubFoldersOnly(portraitsDest);
deleteSubSubFoldersOnly(animationsDest);

if (fs.existsSync(animationsNew)) {
  const folders = fs.readdirSync(animationsNew).filter(item => {
    const itemPath = path.join(animationsNew, item);
    return fs.statSync(itemPath).isDirectory() && /^\d+$/.test(item);
  });

  folders.forEach(folder => {
    const oldPath = path.join(animationsNew, folder);
    const newName = String(parseInt(folder) - 1).padStart(4, '0');
    const newPath = path.join(animationsNew, newName);
    fs.renameSync(oldPath, newPath);
    console.log(`Renommage : ${oldPath} → ${newPath}`);
  });
} else {
  console.warn(`${animationsNew} n'existe pas.`);
}

if (fs.existsSync(portraitsNew)) {
  const folders = fs.readdirSync(portraitsNew).filter(item => {
    const itemPath = path.join(portraitsNew, item);
    return fs.statSync(itemPath).isDirectory() && /^\d+$/.test(item);
  });

  folders.forEach(folder => {
    const oldPath = path.join(portraitsNew, folder);
    const newName = String(parseInt(folder) - 1).padStart(4, '0');
    const newPath = path.join(portraitsNew, newName);
    fs.renameSync(oldPath, newPath);
    console.log(`Renommage : ${oldPath} → ${newPath}`);
  });
} else {
  console.warn(`${portraitsNew} n'existe pas.`);
}

// ===================== /!\ BE CAREFULL WHILE USING THIS FILE /!\ ===================== \\