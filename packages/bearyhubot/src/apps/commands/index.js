import commandHandlers from './commandHandlers';

export default async function commands(clients) {
  const { rtm, http, RTMClientEvents: Events } = clients;

  const me = await http.user.me();

  function handleCommand(message, reply) {
    const [cmd, ...options] = message.text.split(/\s+/);
    const command = cmd.toLowerCase();

    const handler = commandHandlers[command];
    if (typeof handler === 'function') {
      handler.call(message, options, reply);
    } else {
      reply('欢迎来到北京浮生记，请输入 `start` 开始游戏，`status` 查看当前状态，`help` 查看游戏介绍，或输入 `cmd` 查看所有可用的命令。 ');
    }
  }

  function handleP2PMessage(message) {
    if (message.uid === me.id) {
      // prevent inifinite message loop
      return;
    }

    // eslint-disable-next-line
    console.log(message.uid + ': ' + message.text);

    const reply = text =>
      rtm.send({
        type: 'message',
        text,
        vchannel_id: message.vchannel_id,
        refer_key: message.key,
      });

    // if (message.uid !== '=bwS8J') {
    //   reply(message.text);
    //   return;
    // }

    handleCommand(message, reply);
  }

  function handleRTMEvent(message) {
    switch (message.type) {
      case 'message':
        handleP2PMessage(message);
        break;
      case 'channel_message':
        // TODO handleChannelMessage(message);
        break;
      default:
    }
  }

  rtm.on(Events.EVENT, handleRTMEvent);
}
