// get secret values
const spreadSheetId = PropertiesService.getScriptProperties().getProperty('SPREAD_SHEET_ID');
const webhookUrl = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');

type RowType = {
  rowNumber: number
  channelId: string;
  description: string;
  lastSelectedAt: number | undefined;
}

const convertRowToRowType = (row: string[], index: number) => {
  let lastSelectedAt = undefined;
  if (row[2].length > 0) {
    lastSelectedAt = Date.parse(row[2])
  }

  // 2 is plus origin
  return { rowNumber: index + 2, channelId: row[0], description: row[1], lastSelectedAt };
};

const getSelectedRowNumber = (rows: RowType[]) => {
  const randomSelect = (rows: RowType[]) =>
    rows[Math.floor(Math.random() * rows.length)];

  // select logic
  // 1. never selected channels
  const neverSelected = rows.filter(row => row.lastSelectedAt === undefined);
  let selected = randomSelect(neverSelected);
  if (selected) { return selected; }

  // 2. last selected 1 month ago
  const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const lastSeleted = rows.filter(row => row.lastSelectedAt < oneMonthAgo);
  selected = randomSelect(lastSeleted);
  if (selected) { return selected; }

  // 3. other
  return randomSelect(rows);
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
  const ss = SpreadsheetApp.openById(spreadSheetId);
  const sheet = ss.getSheets()[0];

  const channelCount = sheet.getRange('A:A').getValues().filter(cell => cell[0].length > 0).length - 1  // subtract by header num;

  const channelRows = sheet.getRange(`A2:C${channelCount+1}`).getValues().map(convertRowToRowType);
  const selectedRow = getSelectedRowNumber(channelRows);

  const shokaiMessage = constructShokaiMessage(selectedRow.channelId, selectedRow.description);

  const today = new Date();
  sheet.getRange(`C${selectedRow.rowNumber}`).setValue(today.toISOString());

  const payload = constructSlackWebhookPayload(shokaiMessage);
  postSlack(payload);
};
