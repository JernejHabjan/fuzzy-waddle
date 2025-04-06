const audiosprite = require("audiosprite-ffmpeg");
const fs = require("fs");

const audioConfigs = {
  character: {
    pattern: "metadata/sfx/character/**/*.mp3",
    outputPath: "assets/sfx/character"
  },
  probableWaffleUiFeedback: {
    pattern: "metadata/probable-waffle/sfx/ui-feedback/**/*.mp3",
    outputPath: "assets/probable-waffle/sfx/ui-feedback/ui-feedback"
  },
  probableWaffleSharedActorActions: {
    pattern: "metadata/probable-waffle/sfx/shared actor actions/**/*.mp3",
    outputPath: "assets/probable-waffle/sfx/shared actor actions"
  },
  probableWaffleEnvironment: {
    pattern: "metadata/probable-waffle/sfx/environment/**/*.mp3",
    outputPath: "assets/probable-waffle/sfx/environment"
  },
  probableWaffleActorsFoliage: {
    pattern: "metadata/probable-waffle/sfx/actors/foliage/**/*.mp3",
    outputPath: "assets/probable-waffle/sfx/actors/foliage"
  },
  probableWaffleActorsAnimals: {
    pattern: "metadata/probable-waffle/sfx/actors/animals/**/*.mp3",
    outputPath: "assets/probable-waffle/sfx/actors/animals"
  },
  probableWaffleActorsResources: {
    pattern: "metadata/probable-waffle/sfx/actors/resources/**/*.mp3",
    outputPath: "assets/probable-waffle/sfx/actors/resources"
  },
  probableWaffleActorsTivaraMaceman: {
    pattern: "metadata/probable-waffle/sfx/actors/Tivara/Maceman/**/*.mp3",
    outputPath: "assets/probable-waffle/sfx/actors/Tivara/Maceman"
  },
  probableWaffleActorsTivaraOlival: {
    pattern: "metadata/probable-waffle/sfx/actors/Tivara/Olival/**/*.mp3",
    outputPath: "assets/probable-waffle/sfx/actors/Tivara/Olival"
  },
  probableWaffleActorsTivaraSlingshot: {
    pattern: "metadata/probable-waffle/sfx/actors/Tivara/Slingshot/**/*.mp3",
    outputPath: "assets/probable-waffle/sfx/actors/Tivara/Slingshot"
  },
  probableWaffleActorsTivaraWorkerFemale: {
    pattern: "metadata/probable-waffle/sfx/actors/Tivara/Worker Female/**/*.mp3",
    outputPath: "assets/probable-waffle/sfx/actors/Tivara/Worker Female"
  },
  probableWaffleActorsTivaraWorkerMale: {
    pattern: "metadata/probable-waffle/sfx/actors/Tivara/Worker Male/**/*.mp3",
    outputPath: "assets/probable-waffle/sfx/actors/Tivara/Worker Male"
  },
  probableWaffleActorsSkaduweeMagician: {
    pattern: "metadata/probable-waffle/sfx/actors/Skaduwee/Magician/**/*.mp3",
    outputPath: "assets/probable-waffle/sfx/actors/Skaduwee/Magician"
  },
  probableWaffleActorsSkaduweeOwl: {
    pattern: "metadata/probable-waffle/sfx/actors/Skaduwee/Owl/**/*.mp3",
    outputPath: "assets/probable-waffle/sfx/actors/Skaduwee/Owl"
  },
  probableWaffleActorsSkaduweeRanged: {
    pattern: "metadata/probable-waffle/sfx/actors/Skaduwee/Ranged/**/*.mp3",
    outputPath: "assets/probable-waffle/sfx/actors/Skaduwee/Ranged"
  },
  probableWaffleActorsSkaduweeWarrior: {
    pattern: "metadata/probable-waffle/sfx/actors/Skaduwee/Warrior/**/*.mp3",
    outputPath: "assets/probable-waffle/sfx/actors/Skaduwee/Warrior"
  },
  probableWaffleActorsSkaduweeWorkerFemale: {
    pattern: "metadata/probable-waffle/sfx/actors/Skaduwee/Worker Female/**/*.mp3",
    outputPath: "assets/probable-waffle/sfx/actors/Skaduwee/Worker Female"
  },
  probableWaffleActorsSkaduweeWorkerMale: {
    pattern: "metadata/probable-waffle/sfx/actors/Skaduwee/Worker Male/**/*.mp3",
    outputPath: "assets/probable-waffle/sfx/actors/Skaduwee/Worker Male"
  }
};

const commonOpts = {
  export: "mp3",
  samplerate: 48000
};

function updateResources(obj) {
  obj.resources = obj.resources.map((resource) => resource.replace("apps/client/src/", ""));
  return obj;
}

function generateAudioSprites(pattern, outputPath) {
  const fullPattern = `apps/client/src/${pattern}`;
  const fullOutputPath = `apps/client/src/${outputPath}`;
  const opts = { ...commonOpts, output: fullOutputPath };
  audiosprite([fullPattern], opts, function (err, obj) {
    if (err) {
      console.error(`Error generating audio sprites for ${outputPath}:`, err);
    } else {
      obj = updateResources(obj);
      fs.writeFileSync(`${opts.output}.json`, JSON.stringify(obj, null, 2));
      console.log(`Audio sprites generated successfully for ${outputPath}:`, obj);
    }
  });
}

Object.values(audioConfigs).forEach((config) => {
  generateAudioSprites(config.pattern, config.outputPath);
});
