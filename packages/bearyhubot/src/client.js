import { HTTPClient } from 'bearychat';
import RTMClient from 'bearychat-rtm-client';
import WebSocket from 'ws';
import { HUBOT_TOKEN } from './token';

export const http = new HTTPClient(HUBOT_TOKEN);

export const rtm = new RTMClient({
  url() {
    return http.rtm.start()
      .then(data => data.ws_host);
  },
  WebSocket,
});

const { RTMClientEvents, RTMClientState } = RTMClient;
export { RTMClientEvents, RTMClientState };
