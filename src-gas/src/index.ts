/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const CONGESTION_LEVEL = ['available', 'crowded', 'closed'];
const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

function getEventsData() {
  const event_sheet = spreadsheet.getSheetByName('行事');
  if (event_sheet === null) throw new Error('行事シートが見つかりません'); //nullチェック
  const values = event_sheet.getDataRange().getValues();
  const events = values.slice(1).map((event, index) => {
    const date = (() => {
      if (Object.prototype.toString.call(event[0]) === '[object Date]') {
        //日付セルの中に入っているのが有効な日付型であれば
        const year = event[0].getFullYear();
        const month = ('00' + (event[0].getMonth() + 1)).slice(-2); //2桁表示にするためにこんなことをしている
        const date = ('00' + event[0].getDate()).slice(-2);
        return `${year}/${month}/${date}`;
      } else {
        throw new Error(`${index + 1}行目: 日付はちゃんと書こうね`); //日付が書いてなければエラー投げて終了
      }
    })();

    const time = (() => {
      if (Object.prototype.toString.call(event[1]) === '[object Date]') {
        //時刻セルの中に入っているのが有効な日付型であれば
        const hours = ('00' + event[1].getHours()).slice(-2);
        const minutes = ('00' + event[1].getMinutes()).slice(-2);
        return `${hours}:${minutes}`;
      } else {
        return ''; //nullを許さない
      }
    })();

    const detail = event[2];

    return {
      date: date,
      time: time,
      detail: detail,
    };
  });
  console.log(events);
  return events;
}

function getBathCongestionStatus() {
  const bath_congestion_sheet = spreadsheet.getSheetByName('風呂状態');
  if (bath_congestion_sheet === null)
    throw new Error('風呂状態シートが見つかりません'); //nullチェック
  const range = bath_congestion_sheet.getRange('A1');
  let status = Number(range.getValue());

  const hours = new Date().getHours();

  if (hours < 17 || hours >= 23) {
    range.setValue(2);
  } else if (status !== 1) {
    range.setValue(0);
  }

  status = Number(range.getValue());
  if (status === 0 || status === 1 || status === 2)
    return CONGESTION_LEVEL[status];
}

function getDutyTable() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const duty_sheet = spreadsheet.getSheetByName('当番表');
  if (duty_sheet === null) throw new Error('当番表シートが見つかりません'); //nullチェック
  const current_date = new Date().setHours(0, 0, 0, 0);
  let duty;
  duty_sheet
    .getRange('C5:C48')
    .getValues()
    .flat()
    .find((weekend_date, i) => {
      if (current_date <= weekend_date.getTime()) {
        duty = duty_sheet.getRange(`D${5 + i}:O${5 + i}`).getValues()[0];
        return true;
      }
    });
  if (duty === undefined) throw new Error('当番表が見つかりません');
  return {
    south: {
      one_floor: duty[0],
      two_floor: duty[1],
      three_floor: duty[2],
      four_floor: duty[3],
      bath: duty[4],
      shower: duty[5],
    },
    asagiri: {
      two_floor: duty[7],
      three_floor: duty[8],
      four_floor: duty[9],
      bath: duty[10],
    },
  };
}

function getNote() {
  const note_sheet = spreadsheet.getSheetByName('備考');
  if (note_sheet === null) throw new Error('備考シートが見つかりません'); //nullチェック
  const note = note_sheet.getRange('A1').getValue();
  return note;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function doGet(e: GoogleAppsScript.Events.DoGet) {
  const data = (() => {
    switch (e.parameter.param) {
      case 'events':
        return getEventsData();
      case 'bath':
        return getBathCongestionStatus();
      case 'duty':
        return getDutyTable();
      case 'note':
        return getNote();
      default:
        return {
          events: getEventsData(),
          bath: getBathCongestionStatus(),
          duty: getDutyTable(),
          note: getNote(),
        };
    }
  })();
  const response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  response.setContent(JSON.stringify(data));
  return response;
}
