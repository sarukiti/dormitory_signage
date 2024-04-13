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

function App() {
  const [noteStatus, setNoteStatus] = useState("");
  const [bathStatus, setBathStatus] = useState<BathStatus>({logo: alertLogo, description: "現在浴室は利用できません。"});
  const [eventsStatus, setEventsStatus] = useState<EventsStatus>([{date: "", time: "", detail: ""}]);
  useEffect(() => {
    let unlisten: UnlistenFn;
    async function fetchStatusJson() {
      unlisten = await listen<string>("status_json", event => {
      try {
        const status_json = JSON.parse(event.payload);
        console.log(status_json);

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

        setNoteStatus(status_json.note);
      } catch (e) {
        setNoteStatus("JSONのパースに失敗しました。");
        return ()=>{if(unlisten) unlisten()};
      }});
      return () => {
        if(unlisten) unlisten();
      }
    }
    fetchStatusJson();
  }, []);

  return (
    <div className="w-screen h-screen px-10 py-16 grid grid-cols-2 grid-rows-2 gap-x-20 gap-y-10">
      <div className="p-8 row-span-2 bg-blue-100 rounded-3xl">
        <div className="text-4xl mb-8">男子寮　行事予定</div>
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
      <div className="p-8 bg-blue-100 rounded-3xl">
        <div className="text-4xl mb-8">浴室利用状況</div>
        <div className="flex flex-row items-center gap-3">
          <img src={bathStatus.logo} alt="safe" className="size-6"/> 
          <div className="font-bold text-xl">{bathStatus.description}</div>
        </div>
      </div>
      <div className="p-8 bg-blue-100 rounded-3xl">
        <div className="text-4xl mb-8">その他の連絡</div>
        <div>{noteStatus}</div>
      </div>
    </div>
  );
}

export default App;
