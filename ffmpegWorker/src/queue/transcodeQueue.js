const {Queue} = require('bullmq')
const connection = require('../config')

const transcodeQueue = new Queue("trandcodeQueue",{
    connection,
    defaultJobOptions:{
        attempts : 3,
        backoff : {
            type : "exponential",
            delay : 5000,
        },
        removeOnComplete : true,
        removeOnFail : false
    }
});

module.exports = transcodeQueue;