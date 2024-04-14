import { useEffect, useState } from "react";
import { UnlistenFn, listen } from "@tauri-apps/api/event";
import '@fontsource/noto-sans-jp/400.css';
import '@fontsource/noto-sans-jp/700.css';

import "./App.css";
import safeLogo from "./assets/safe.svg";
import warningLogo from "./assets/warning.svg";
import alertLogo from "./assets/alert.svg";

type EventsStatus = {
    date: string,
    time: string,
    detail: string
}[];
type BathStatus = { logo: string, description: string };
type DutyStatus = {
  south: {
    one_floor: string,
    two_floor: string,
    three_floor: string,
    four_floor: string,
    bath: string,
    shower: string
  },
  asagiri: {
    two_floor: string,
    three_floor: string,
    four_floor: string,
    bath: string
  }
};

function App() {
  const [eventsStatus, setEventsStatus] = useState<EventsStatus>([{date: "", time: "", detail: ""}]);
  const [bathStatus, setBathStatus] = useState<BathStatus>({logo: alertLogo, description: "現在浴室は利用できません。"});
  const [dutyStatus, setdutyStatus] = useState<DutyStatus>({south: {one_floor: "", two_floor: "", three_floor: "", four_floor: "", bath: "", shower: ""}, asagiri: {two_floor: "", three_floor: "", four_floor: "", bath: ""}});
  const [noteStatus, setNoteStatus] = useState("");

  useEffect(() => {
    let unlisten: UnlistenFn;
    let note_unlisten: UnlistenFn;
    async function fetchStatusJson() {
      unlisten = await listen<string>("status_json", event => {
      try {
        const status_json = JSON.parse(event.payload);

        setEventsStatus(status_json.events);

        switch (status_json.bath) {
          case "available":
            setBathStatus({logo: safeLogo, description: "現在浴室は利用できます。"});
            break;
          case "crowded":
            setBathStatus({logo: warningLogo, description: "現在浴室は混雑しています。"});
            break;
          case "closed":
            setBathStatus({logo: alertLogo, description: "現在浴室は利用できません。"});
            break;
          default:
            setBathStatus({logo: alertLogo, description: "現在浴室は利用できません。"});
            break;
        }

        setdutyStatus(status_json.duty);

        setNoteStatus(status_json.note);
      } catch (e) {
        setNoteStatus("JSONのパースに失敗しました。");
        return ()=>{if(unlisten) unlisten()};
      }});
      return () => {
        if(unlisten) unlisten();
      }
    }

    async function fetchNote() {
      note_unlisten = await listen<string>("note", event => {
        setNoteStatus(event.payload);
      });
      return () => {
        if(note_unlisten) note_unlisten();
      }
    }

    fetchStatusJson();
    fetchNote();
  }, []);

  return (
    <div className="w-screen h-screen px-10 py-16 grid grid-cols-2 grid-rows-3 gap-x-20 gap-y-10">
      <div className="p-8 col-start-1 row-start-1 row-span-2 bg-blue-100 rounded-3xl">
        <div className="text-4xl mb-8">寮行事予定</div>
        <table className="[&_tr]:h-10 [&_td]:text-base w-full divide-y divide-black">
          <thead>
            <tr>
              <th className="text-left w-24 text-sm">日付</th>
              <th className="text-left w-24 text-sm">時刻</th>
              <th className="text-left w-72 text-sm">内容</th>
            </tr>
          </thead>
          <tbody>
            {eventsStatus.map((event, index) => (
              <tr key={index}>
                <td>{event.date}</td>
                <td>{event.time}</td>
                <td>{event.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-8 col-start-1 row-start-3 bg-blue-100 rounded-3xl">
        <div className="text-4xl mb-8">浴室利用状況</div>
        <div className="flex flex-row items-center gap-3">
          <img src={bathStatus.logo} alt="safe" className="size-6"/> 
          <div className="font-bold text-xl">{bathStatus.description}</div>
        </div>
      </div>
      <div className="p-8 col-start-2 row-start-1 row-span-2 bg-blue-100 rounded-3xl">
        <div className="text-4xl mb-8">今週の当番表</div>
        <table className="[&_tr]:h-10 [&_td]:text-base w-full divide-y divide-black">
          <thead>
            <tr>
              <th colSpan={6} className="w-24 text-sm" >南寮</th>
            </tr>
            <tr>
              <th className="text-left w-72 text-sm">1F</th>
              <th className="text-left w-72 text-sm">2F</th>
              <th className="text-left w-72 text-sm">3F</th>
              <th className="text-left w-72 text-sm">4F</th>
              <th className="text-left w-72 text-sm">風呂当番</th>
              <th className="text-left w-72 text-sm">シャワー室</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{dutyStatus.south.one_floor}</td>
              <td>{dutyStatus.south.two_floor}</td>
              <td>{dutyStatus.south.three_floor}</td>
              <td>{dutyStatus.south.four_floor}</td>
              <td>{dutyStatus.south.bath}</td>
              <td>{dutyStatus.south.shower}</td>
            </tr>
          </tbody>
          <tr className="h-5"></tr>
          <thead>
            <tr>
              <th colSpan={6} className="w-24 text-sm border" >あさぎり寮</th>
            </tr>
            <tr>
              <th className="text-left w-72 text-sm"></th>
              <th className="text-left w-72 text-sm">2F</th>
              <th className="text-left w-72 text-sm">3F</th>
              <th className="text-left w-72 text-sm">4F</th>
              <th className="text-left w-72 text-sm">風呂当番</th>
              <th className="text-left w-72 text-sm"></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td></td>
              <td>{dutyStatus.asagiri.two_floor}</td>
              <td>{dutyStatus.asagiri.three_floor}</td>
              <td>{dutyStatus.asagiri.four_floor}</td>
              <td>{dutyStatus.asagiri.bath}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="p-8 col-start-2 row-start-3 bg-blue-100 rounded-3xl">
        <div className="text-4xl mb-8">その他の連絡</div>
        <div className="whitespace-pre-wrap">{noteStatus}</div>
      </div>
    </div>
  );
}

export default App;
