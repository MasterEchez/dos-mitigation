let participant = 'participant';
let room = 'room';
const url = 'https://my-stat-server.example.com/api/store-stats';
let logged = [];

// Aliases for convenience
const listen = APP.addListener;

room = "a";

// events with 0 or 1 param for callback
const events = [
        "p2pStatusChanged",
        // {
        //     isP2p: boolean|null // whether the new connection type is P2P
        // }

        "peerConnectionFailure",
        // {
        //     // Type of PC, Peer2Peer or JVB connection.
        //     isP2P: boolean,

        //     // Was this connection previously connected. If it was it could mean
        //     // that connectivity was disrupted, if not it most likely means that the app could not reach
        //     // the JVB server, or the other peer in case of P2P.
        //     wasConnected: boolean
        // }

        "participantJoined",
        // {
        //     id: string, // the id of the participant
        //     displayName: string // the display name of the participant
        // }

        "participantLeft",
        // {
        //     id: string // the id of the participant
        // }
];

room = "b";

let tester = "";

tryLaunchingLogger();

room = "c";



function tryLaunchingLogger()
{
        if (APP.conference._room)
                return launchLogger();

        setTimeout(tryLaunchingLogger, 500);
}

function launchLogger()
{
        room = APP.conference.roomName;
        participant = APP.conference.getMyUserId();

        events.forEach(event =>
                listen(event, (data) => store(data, event))
        )
}

function store(data, event)
{
        tester = "d";
        const timestamp = Date.now();
        // let data = data;
        // // Exclude circular structures.
        // try {
        //         JSON.stringify(data);
        // } catch (error) {
        //         data = null;
        // }

        logged.push([timestamp, event]);

        // logged.push({
        //     data,
        //     event,
        //     room,
        //     participant,
        //     timestamp
        // });

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