const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const bodyParser = require('body-parser');
const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');

// LINE SDK Configuration
const lineConfig = {
  channelSecret: 'YOUR_CHANNEL_SECRET',
  channelAccessToken: 'YOUR_CHANNEL_ACCESS_TOKEN'
};

const lineClient = new Client(lineConfig);

const app = express();
app.use(bodyParser.json());
app.use(middleware(lineConfig));

// Handle LINE messages
app.post('/webhook', (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.json({ success: true }))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const userMessage = event.message.text;

    let replyText;
    if (userMessage.includes('สี่เหลี่ยมผืนผ้า')) {
      replyText = 'กรุณาเลือกความกว้างและความยาว.';
    } else if (userMessage.includes('สามเหลี่ยมด้านเท่า')) {
      replyText = 'กรุณาเลือกขนาดด้าน.';
    } else if (userMessage.includes('วงกลม')) {
      replyText = 'กรุณาเลือกรัศมี.';
    } else {
      replyText = 'กรุณาเลือกประเภทพื้นที่ที่ต้องการคำนวณ.';
    }

    return lineClient.replyMessage(event.replyToken, {
      type: 'template',
      altText: 'คำนวณพื้นที่',
      template: {
        type: 'buttons',
        title: 'เลือกประเภทพื้นที่',
        text: 'เลือกหนึ่งในตัวเลือกด้านล่าง:',
        actions: [
          { type: 'message', label: 'สี่เหลี่ยมผืนผ้า', text: 'สี่เหลี่ยมผืนผ้า' },
          { type: 'message', label: 'สามเหลี่ยมด้านเท่า', text: 'สามเหลี่ยมด้านเท่า' },
          { type: 'message', label: 'วงกลม', text: 'วงกลม' }
        ]
      }
    });
  }
}

// Dialogflow Fulfillment
app.post('/dialogflow', (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  function calculateArea(agent) {
    const width = agent.parameters.width;
    const height = agent.parameters.height;
    const side = agent.parameters.side;
    const radius = agent.parameters.radius;

    let replyText;

    if (width && height) {
      const area = width * height;
      replyText = `พื้นที่ของสี่เหลี่ยมผืนผ้าคือ ${area} ตารางหน่วย.`;
    } else if (side) {
      const area = (Math.sqrt(3) / 4) * Math.pow(side, 2);
      replyText = `พื้นที่ของสามเหลี่ยมด้านเท่าคือ ${area.toFixed(2)} ตารางหน่วย.`;
    } else if (radius) {
      const area = Math.PI * Math.pow(radius, 2);
      replyText = `พื้นที่ของวงกลมคือ ${area.toFixed(2)} ตารางหน่วย.`;
    } else {
      replyText = 'กรุณาให้ข้อมูลเพิ่มเติมเพื่อคำนวณพื้นที่.';
    }

    agent.add(replyText);
  }

  let intentMap = new Map();
  intentMap.set('Calculate Area', calculateArea);
  agent.handleRequest(intentMap);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

exports.app = functions.https.onRequest(app);
