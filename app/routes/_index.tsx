import type { MetaFunction } from "@remix-run/node";
import { useCallback, useEffect, useState } from "react";
import * as Tone from "tone";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  const [player, setPlayer] = useState<Tone.Player | Tone.Oscillator>();
  const [pitchShift, setPitchShift] = useState<Tone.PitchShift>();
  type Material = "piano" | "sine";
  const [material, setMaterial] = useState<Material>("piano");

  type Coordinate = { x: number; y: number };
  const [coordinate, setCoordinate] = useState<Coordinate>({ x: 0, y: 0 });
  const [randomCoordinate, setRandomCoordinate] = useState<Coordinate>({
    x: 0,
    y: 0,
  });
  const toPitchShift = useCallback((c: Coordinate) => (1 - c.y) * 35 - 20, []); // -40 to +10
  const toPeriod = useCallback(
    (c: Coordinate) => 0.3 + Math.max(0, (1 - c.x) * 0.7),
    []
  );
  type Record = { c: Coordinate; randomC: Coordinate };
  const [records, setRecords] = useState<Record[]>([]);

  useEffect(() => {
    if (material === "piano") {
      const player = new Tone.Player("/C4.ogg");
      player.loop = true;
      Tone.loaded().then(() => {
        player.start();
      });
      setPlayer(player);

      const newPitchShift = new Tone.PitchShift();
      setPitchShift(newPitchShift);
      player.connect(newPitchShift);
      newPitchShift.toDestination();

      return () => {
        player.dispose();
        newPitchShift.dispose();
      };
    } else if (material === "sine") {
      const player = new Tone.Oscillator(261.626, "sine");
      Tone.loaded().then(() => {
        player.start();
      });
      setPlayer(player);

      const gain = new Tone.Gain(0.2);
      player.connect(gain);

      const newPitchShift = new Tone.PitchShift();
      setPitchShift(newPitchShift);
      gain.connect(newPitchShift);
      newPitchShift.toDestination();

      return () => {
        player.dispose();
        newPitchShift.dispose();
      };
    }
  }, [material]);

  useEffect(() => {
    if (pitchShift) {
      pitchShift.pitch = toPitchShift(coordinate);
    }
  }, [coordinate, pitchShift, toPitchShift]);

  useEffect(() => {
    if (player && player instanceof Tone.Player) {
      player.loopEnd = toPeriod(coordinate);
    }
  }, [coordinate, player, toPeriod]);

  const randomlyChoose = useCallback(() => {
    const c = { x: Math.random(), y: Math.random() };
    setRandomCoordinate(c);
    setCoordinate(c);
    console.log(
      `y: ${c.y}, x: ${c.x}, pitch shift: ${toPitchShift(
        c
      )}, period: ${toPeriod(c)}, randomly chosen`
    );
  }, [toPitchShift, toPeriod]);

  const playModel = useCallback(() => {
    setCoordinate(randomCoordinate);
  }, [randomCoordinate]);

  const recordToLog = useCallback(
    (record: Record) =>
      `y: ${record.c.y}, x: ${record.c.x}, pitch shift: ${toPitchShift(
        record.c
      )}, period: ${toPeriod(record.c)}\ndiffY: ${
        record.c.y - record.randomC.y
      }, diffX: ${record.c.x - record.randomC.x}, diff pitch shift: ${
        toPitchShift(record.c) - toPitchShift(record.randomC)
      }, diff period: ${toPeriod(record.c) - toPeriod(record.randomC)}`,
    [toPitchShift, toPeriod]
  );

  return (
    <div className="flex flex-col h-screen items-center justify-center">
      <div className="flex gap-20 items-center mt-auto">
        <div className="flex flex-col w-40">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded mb-2"
            onClick={() => {
              Tone.start();
              randomlyChoose();
            }}
          >
            Start
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded mb-2"
            onClick={randomlyChoose}
          >
            Choose Again
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded mb-2"
            onClick={playModel}
          >
            Play Model
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded mb-2"
            onClick={() => {
              player?.stop();
            }}
          >
            Stop
          </button>
          <div className="flex gap-2 justify-center">
            <label>
              <input
                type="radio"
                key="material"
                checked={material === "piano"}
                onClick={() => setMaterial("piano")}
              />
              Piano
            </label>
            <label>
              <input
                type="radio"
                key="material"
                checked={material === "sine"}
                onClick={() => setMaterial("sine")}
              />
              Sine
            </label>
          </div>
        </div>
        <div className="flex flex-col w-72">
          <div>y: {coordinate.y}</div>
          <div>x: {coordinate.x}</div>
          <div>pitch shift: {toPitchShift(coordinate)}</div>
          <div>period: {toPeriod(coordinate)}</div>
        </div>
      </div>
      <div className="flex w-full my-auto px-10">
        <div className="flex-grow basis-0 mr-10" />
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          className="bg-slate-500 size-[800px]"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            setCoordinate({ x, y });
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const record = { c: { x, y }, randomC: randomCoordinate };
            setRecords((prev) => [...prev, record]);
            console.log(recordToLog(record));
            randomlyChoose();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            playModel();
          }}
        ></div>
        <div className="flex-grow basis-0 ml-10 overflow-auto h-[800px]">
          <div className="bg-slate-300 p-2 my-2 rounded">
            Ave.
            <div>
              {(() => {
                const sum = records.reduce(
                  (acc, record) => {
                    acc.x += Math.abs(record.c.x - record.randomC.x);
                    acc.y += Math.abs(record.c.y - record.randomC.y);
                    acc.pi += Math.abs(
                      toPitchShift(record.c) - toPitchShift(record.randomC)
                    );
                    acc.pe += Math.abs(
                      toPeriod(record.c) - toPeriod(record.randomC)
                    );
                    return acc;
                  },
                  { x: 0, y: 0, pi: 0, pe: 0 }
                );
                return `diffY: ${sum.y / records.length}, diffX: ${
                  sum.x / records.length
                }, diff pitch shift: ${sum.pi / records.length}, diff period: ${
                  sum.pe / records.length
                }`;
              })()}
            </div>
          </div>
          {records.map((record, index) => (
            <div key={index} className="bg-slate-300 p-2 my-2 rounded">
              {index + 1}.{" "}
              {recordToLog(record)
                .split("\n")
                .map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
