const videoViewSchema = {

    
    
    

    accountId: {
        type: "string",
        required: true
    },

    profileId: {
        type: "string",
        required: true
    },


    
    
    

    videoId: {
        type: "string",
        required: true
    },

    sessionId: {
        type: "string",
        required: true
    },

    deviceId: {
        type: "string",
        required: true
    },


    
    
    

    watchTime: {
        type: "number",
        required: true
    },

    videoDuration: {
        type: "number",
        required: true
    },

    
    
    
    
    

    completionRate: {
        type: "number",
        required: true
    },


    
    
    

    platform: {
        type: "string",
        required: true
    },


    
    
    

    device: {
        type: "string",
        required: true
    },

    os: {
        type: "string",
        required: true
    },

    browser: {
        type: "string",
        required: true
    },


    
    
    

    country: {
        type: "string",
        required: true
    },

    city: {
        type: "string",
        required: false
    },


    
    
    

    referrer: {
        type: "string",
        required: true
    },

    networkType: {
        type: "string",
        required: false
    }
};


module.exports = videoViewSchema;

