import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { v4 as uuidv4 } from 'uuid';

export default async(req, res) => {
    const livekitHost = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    if (!livekitHost || !apiKey || !apiSecret) {
        console.error("Server not configured, LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET must be set");
        return res.status(500).send('Server not configured');
    }

    const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);

    const { name, provider, avatar, avatar_id } = req.query;
    let { room } = req.query;
    const participantName = name || 'participant-' + uuidv4();

    if (!room) {
        const providerSuffix = provider || process.env.DEFAULT_TTS_PROVIDER;
        const avatarSuffix = (avatar === 'hedra' || avatar === 'tavus') ? avatar : null;
        let newRoomName = `room-${uuidv4().substring(0, 8)}`;
        if (providerSuffix) {
            newRoomName = `${newRoomName}-prov-${providerSuffix}`;
        }
        if (avatarSuffix) {
            newRoomName = `${newRoomName}-a-${avatarSuffix}`;
            if (avatarSuffix === 'hedra' && avatar_id) {
                newRoomName = `${newRoomName}-${avatar_id}`;
            }
        }

        const rooms = await roomService.listRooms();
        const roomNames = rooms.map(r => r.name);
        while (roomNames.includes(newRoomName)) {
            newRoomName = `room-${uuidv4().substring(0, 8)}`;
            if (providerSuffix) {
                newRoomName = `${newRoomName}-prov-${providerSuffix}`;
            }
            if (avatarSuffix) {
                newRoomName = `${newRoomName}-a-${avatarSuffix}`;
                if (avatarSuffix === 'hedra' && avatar_id) {
                    newRoomName = `${newRoomName}-${avatar_id}`;
                }
            }
        }
        room = newRoomName;
    }

    const at = new AccessToken(apiKey, apiSecret, {
        identity: participantName,
        name: participantName,
    });

    at.addGrant({
        roomJoin: true,
        room: room,
        canPublish: true,
        canSubscribe: true,
    });

    res.status(200).send(at.toJwt());
};