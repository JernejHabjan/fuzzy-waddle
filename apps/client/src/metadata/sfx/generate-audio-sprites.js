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
  probableWaffleActors: {
    pattern: "metadata/probable-waffle/sfx/actors/**/*.mp3",
    outputPath: "assets/probable-waffle/sfx/actors"
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
