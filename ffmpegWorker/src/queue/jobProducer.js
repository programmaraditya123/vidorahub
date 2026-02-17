const transcodeQueue = require('./transcodeQueue')

async function addTranscodeJob(data){
    await transcodeQueue.add("transcode-video",data)
}

module.exports = addTranscodeJob;