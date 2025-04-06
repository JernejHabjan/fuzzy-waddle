const fs = require('fs');
const path = require('path');

function toPascalCase(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+|-)/g, (match, index) =>
    index === 0 ? match.toUpperCase() : match.toUpperCase()
  ).replace(/\s+|-/g, '');
}

function toEnumKey(str) {
  let key = str.replace(/ |-/g, '_').toUpperCase();
  if (key.startsWith('_')) {
    key = key.substring(1);
  }
  return key;
}

function generateAudioSpritesEnum(fileNamesWithPrefixes) {
  const enumEntries = fileNamesWithPrefixes.map(
    ({prefix, fileName}) => `  ${toEnumKey(prefix + '_' + fileName)} = "${fileName.toLowerCase()}"`
  );
  return `// This file was generated from "convert-to-enums.js" script\n` +
    `export enum AudioSprites {\n` + enumEntries.join(',\n') + '\n}\n';
}

const allFileNamesWithPrefixes = [];

function processJsonFile(jsonFilePath) {
  return new Promise((resolve, reject) => {
    const filename = path.basename(jsonFilePath, '.json');
    const folderName = path.basename(path.dirname(jsonFilePath));
    let pascalCaseFilename = toPascalCase(filename);
    let prefix = '';

    if (folderName.toLowerCase() !== 'sfx' && toPascalCase(folderName) !== pascalCaseFilename) {
      pascalCaseFilename = toPascalCase(folderName) + pascalCaseFilename;
      prefix = toPascalCase(folderName);
    }

    if (pascalCaseFilename.startsWith('_')) {
      pascalCaseFilename = pascalCaseFilename.substring(1);
    }

    allFileNamesWithPrefixes.push({prefix, fileName: filename});

    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading file ${jsonFilePath}:`, err);
        return reject(err);
      }

      const jsonData = JSON.parse(data);
      const enumEntries = Object.keys(jsonData.spritemap).map(
        (key) => `  ${toEnumKey(key)} = "${key}"`
      );

      // Join enum entries with commas and add the closing curly brace
      const tsContent = `// This file was generated from "convert-to-enums.js" script\n` +
        `export enum ${pascalCaseFilename}Sfx {\n` + enumEntries.join(',\n') + '\n}\n';
      const tsFilePath = path.join(path.dirname(jsonFilePath), `${pascalCaseFilename}Sfx.ts`);

      fs.writeFile(tsFilePath, tsContent, (err) => {
        if (err) {
          console.error(`Error writing file ${tsFilePath}:`, err);
          return reject(err);
        }

        console.log(`TypeScript enum file created at: ${tsFilePath}`);
        resolve();
      });
    });
  });
}

function processDirectory(directory) {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, { withFileTypes: true }, (err, files) => {
      if (err) {
        console.error(`Error reading directory ${directory}:`, err);
        return reject(err);
      }

      const filePromises = files.map((file) => {
        const fullPath = path.join(directory, file.name);
        if (file.isDirectory()) {
          return processDirectory(fullPath);
        } else if (file.isFile() && file.name.endsWith('.json')) {
          return processJsonFile(fullPath);
        }
      });

      Promise.all(filePromises).then(resolve).catch(reject);
    });
  });
}

// Define the starting directory (two levels up from __dirname and then down to assets/probable-waffle/sfx/)
const startingDirectory = path.join(__dirname, '..', '..', '..', 'assets', 'probable-waffle', 'sfx');
console.log(`Starting directory: ${startingDirectory}`);

// Process all JSON files recursively
processDirectory(startingDirectory).then(() => {
  const audioSpritesEnumContent = generateAudioSpritesEnum(allFileNamesWithPrefixes);
  const audioSpritesFilePath = path.join(startingDirectory, 'AudioSprites.ts');

  fs.writeFile(audioSpritesFilePath, audioSpritesEnumContent, (err) => {
    if (err) {
      console.error(`Error writing file ${audioSpritesFilePath}:`, err);
      return;
    }

    console.log(`TypeScript enum file created at: ${audioSpritesFilePath}`);
  });
}).catch((err) => {
  console.error('Error processing directories:', err);
});
