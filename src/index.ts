// get secret values
const spreadSheetId = PropertiesService.getScriptProperties().getProperty('SPREAD_SHEET_ID');
const webhookUrl = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');

// define functions
const removeHeader = (values: string[][]) => {
  values.shift();
  return values;
};

const choiceChannelAndDescription = (value: string[][]) => {
  const chooseRow = value[Math.floor(Math.random() * value.length)]
  return [chooseRow[0], chooseRow[1]];
};

const constructShokaiMessage = (channelId: string, description: string) => {
  return `こんなチャンネルもあります :point_right: <#${channelId}>
一言紹介 : ${description}

紹介するチャンネルは<https://docs.google.com/spreadsheets/d/${spreadSheetId}/edit#gid=0|ここ>で編集できます。`;
};

const constructSlackWebhookPayload = (text: string) => {
  const icon = !!Math.floor(Math.random() * 2)
    ? 'syoukai_business_man'
    : 'syoukai_business_woman'

  return {
    'username': 'Slackチャンネル紹介君',
    'icon_emoji': icon,
    'text': text,
  };
};

const postSlack = (payload: object) => {
  const response = UrlFetchApp.fetch(webhookUrl, {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
  });

  if (response.getResponseCode() !== 200) {
    Logger.log(payload);
    Logger.log(response.getContentText("UTF-8"));
  }
};

// running function
const run = () => {
  const sheet = SpreadsheetApp.openById(spreadSheetId);
  const sheetValues = sheet.getDataRange().getValues();

  const channels = removeHeader(sheetValues);
  const [channelId, description] = choiceChannelAndDescription(channels);
  const shokaiMessage = constructShokaiMessage(channelId, description);

  const payload = constructSlackWebhookPayload(shokaiMessage);
  postSlack(payload);
};
