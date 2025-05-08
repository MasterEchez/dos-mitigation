let participant = ''
let room = ''
const url = 'https://my-stat-server.example.com/api/store-stats'
let logged = [];

// Aliases for convenience
const listen = APP.conference.addConferenceListener
const cEvents = JitsiMeetJS.events.conference
const nEvents = JitsiMeetJS.events.connection
const tEvents = JitsiMeetJS.events.track
const dEvents = JitsiMeetJS.events.mediaDevices
const qEvents = JitsiMeetJS.events.connectionQuality

// events with 0 or 1 param for callback
const events = [
        // cEvents.TRACK_ADDED,
        // cEvents.TRACK_REMOVED,
        // cEvents.TRACK_MUTE_CHANGED,
        // cEvents.DOMINANT_SPEAKER_CHANGED,
        // cEvents.CONFERENCE_JOINED,
        // cEvents.CONFERENCE_LEFT,
        // cEvents.CONFERENCE_FAILED,
        // cEvents.CONFERENCE_ERROR,
        // cEvents.STARTED_MUTED,
        // cEvents.TALK_WHILE_MUTED,
        // cEvents.NO_AUDIO_INPUT,
        // cEvents.NOISY_MIC,
        cEvents.P2P_STATUS,
        cEvents.JVB121_STATUS,

        nEvents.CONNECTION_FAILED,
        nEvents.CONNECTION_ESTABLISHED,
        nEvents.CONNECTION_DISCONNECTED,
        nEvents.WRONG_STATE,

        // tEvents.LOCAL_TRACK_STOPPED,
        // tEvents.TRACK_AUDIO_OUTPUT_CHANGED,
        // tEvents.NO_DATA_FROM_SOURCE,
        // tEvents.TRACK_VIDEOTYPE_CHANGED,
        // tEvents.TRACK_MUTE_CHANGED,

        // dEvents.DEVICE_LIST_CHANGED,
        // dEvents.PERMISSION_PROMPT_IS_SHOWN,

        qEvents.LOCAL_STATS_UPDATED,
]

// events with 2 params for callback
const targetedEvents = [
        cEvents.USER_JOINED,
        cEvents.USER_LEFT,
        cEvents.USER_STATUS_CHANGED,
]

tryLaunchingLogger()

function tryLaunchingLogger()
{
        if (APP.conference._room)
                return launchLogger()

        setTimeout(tryLaunchingLogger, 500)
}

function launchLogger()
{
        room = APP.conference.roomName
        participant = APP.conference.getLocalDisplayName() + '-' + APP.conference.getMyUserId()

        events.forEach(event =>
                listen(event, data => store(data, event, null))
        )

        targetedEvents.forEach(event =>
                listen(event, (target, data) => store(data, event, null))
        )
}

function store(data, event, target)
{
        const timestamp = Date.now()

        // Exclude circular structures.
        try {
                JSON.stringify(data)
        } catch (error) {
                data = null
        }

        logged.push({
            data,
            event,
            target,
            room,
            participant,
            timestamp
        });

        // fetch(url, {
        //         headers: {
        //                 'Content-Type': 'application/json'
        //         },
        //         method: 'POST',
        //         body: JSON.stringify({
        //                 data,
        //                 event,
        //                 target,
        //                 room,
        //                 participant,
        //                 timestamp
        //         })
        // })
}