import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../data/api";
import { useAsync } from "../data/useAsync";
import { href } from "../router";
import { Empty, ErrorNote, Loading } from "../ui/bits";
import { Icon } from "../ui/icons";
import { JOIN_WINDOW_MS, longDate, nameInitials, time, until } from "../format";

/* ============================================================
   THE VIDEO VISIT

   It lives at #/visits/<id>/join — inside the appointment, not in a tab of
   its own. A call is something an appointment DOES, and putting it in the
   navigation would leave a dead tab for the 23 hours a day nobody is in one.

   Four states, in order: too-early -> lobby -> live -> ended.

   The mental-health-specific parts, which general telehealth UI gets wrong:

   - "This session is not recorded" is stated in the lobby AND stays visible
     during the call. Patients ask this constantly and the answer decides
     what they're willing to say.
   - Camera-off is offered as a real choice, not a degraded fallback. Some
     people do better audio-only, especially early on, and the UI should not
     make that feel like failure.
   - The phone fallback appears BEFORE anything breaks, not after.
   - 988 is reachable from inside the call. If a session goes badly or the
     connection drops, the patient must not have to navigate to find help.

   In the sandbox the remote participant is simulated. The local preview is
   real getUserMedia when the patient asks for it, so the device check
   genuinely checks the device.
   ============================================================ */

type Phase = "early" | "lobby" | "live" | "ended";

export default function VisitJoin({ id }: { id: string }) {
  const { data: visit, loading, error } = useAsync(() => api.getVisit(id), [id]);

  if (loading) return <Loading lines={2} />;
  if (error) return <ErrorNote message={error} />;
  if (!visit) return <Empty>We couldn't find that visit.</Empty>;
  if (!visit.telehealth) {
    return (
      <>
        <a className="backlink" href={href("visits", id)}>
          <Icon name="back" size={16} /> Visit details
        </a>
        <section className="pcard">
          <div className="pcard-head"><span className="lbl">In person</span></div>
          <h2 className="headline sm">This visit is in the office.</h2>
          <p className="body muted">
            There's nothing to join — we'll see you at {time(visit.startAt)}.
          </p>
        </section>
      </>
    );
  }
  return <Call visit={visit} />;
}

function Call({ visit }: { visit: NonNullable<Awaited<ReturnType<typeof api.getVisit>>> }) {
  const startMs = Date.parse(visit.startAt);
  const opensMs = startMs - JOIN_WINDOW_MS;

  const [phase, setPhase] = useState<Phase>(() => (Date.now() >= opensMs ? "lobby" : "early"));
  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [deviceState, setDeviceState] = useState<"idle" | "asking" | "ok" | "denied" | "none">("idle");
  const [providerHere, setProviderHere] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const [level, setLevel] = useState(0);   // 0..1, smoothed RMS

  const stopStream = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    void audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setLevel(0);
  }, []);

  /* A mic meter that reads the real stream. "Say something and watch this
     move" is the only device check a patient can actually verify — a green
     tick claiming the mic works proves nothing to someone whose mic doesn't. */
  const startMeter = useCallback((stream: MediaStream) => {
    try {
      const Ctx: typeof AudioContext =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        // speech sits low in linear RMS; this curve makes normal talking fill
        // most of the meter without clipping on a loud room
        setLevel(Math.min(1, Math.pow(rms * 7, 0.6)));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch { /* meter is a nicety; never block the visit on it */ }
  }, []);

  /* The device check is real, and it is opt-in. Nothing asks for the camera
     until the patient presses the button — a portal that grabs the camera on
     load is exactly the thing that makes people distrust telehealth. */
  const checkDevices = useCallback(async () => {
    setDeviceState("asking");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = s;
      startMeter(s);
      setCamOn(true);
      setDeviceState("ok");
    } catch (e) {
      const name = (e as { name?: string })?.name ?? "";
      setDeviceState(name === "NotFoundError" ? "none" : "denied");
    }
  }, [startMeter]);

  useEffect(() => stopStream, [stopStream]);

  /* Attach AFTER render. The <video> only exists once deviceState is "ok",
     so assigning srcObject inside getUserMedia hit a null ref and the
     preview stayed blank — the element it wanted had not mounted yet. */
  useEffect(() => {
    if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [deviceState, camOn, phase]);

  /* Flip out of "too early" the moment the window opens, without a refresh. */
  useEffect(() => {
    if (phase !== "early") return;
    const t = window.setTimeout(() => setPhase("lobby"), Math.max(1000, opensMs - Date.now()));
    return () => window.clearTimeout(t);
  }, [phase, opensMs]);

  /* Simulated admit. A real build swaps this for the room's participant event. */
  useEffect(() => {
    if (phase !== "live" || providerHere) return;
    const t = window.setTimeout(() => setProviderHere(true), 3200);
    return () => window.clearTimeout(t);
  }, [phase, providerHere]);

  useEffect(() => {
    if (phase !== "live") return;
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  const toggleCam = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCamOn(track.enabled); }
    else setCamOn((v) => !v);
  };
  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMicOn(track.enabled); }
    else setMicOn((v) => !v);
  };
  const leave = () => { stopStream(); setPhase("ended"); };

  const who = `${visit.provider.name}, ${visit.provider.credential}`;
  const isTherapy = visit.track === "therapy";

  if (phase === "ended") {
    return (
      <>
        <section className="pcard mint">
          <div className="pcard-head">
            <span className="lbl ok"><Icon name="check" size={16} /> Visit finished</span>
          </div>
          <h2 className="headline sm">
            You were with <b>{visit.provider.name}</b> for {mmss(elapsed)}.
          </h2>
          <p className="body muted">
            {isTherapy
              ? "A short summary of what you worked on will appear here, usually within a day."
              : "A summary of anything you changed today will appear here, usually within a day."}
          </p>
        </section>

        <section className="pcard">
          <div className="pcard-head"><span className="lbl">What happens next</span></div>
          <div className="tlist">
            <a className="trow" href={href("visits", visit.id)}>
              <span className="grow"><strong>See this visit</strong>
                <span className="meta">The summary lands here when it's ready</span></span>
              <span className="chev"><Icon name="chevron" size={18} /></span>
            </a>
            <a className="trow" href={href("messages", "new")}>
              <span className="grow"><strong>Message {visit.provider.name.split(" ")[0]}</strong>
                <span className="meta">If something came up you didn't get to</span></span>
              <span className="chev"><Icon name="chevron" size={18} /></span>
            </a>
            <a className="trow" href={href("visits")}>
              <span className="grow"><strong>Book the next one</strong></span>
              <span className="chev"><Icon name="chevron" size={18} /></span>
            </a>
          </div>
        </section>
      </>
    );
  }

  if (phase === "live") {
    return (
      <div className="call">
        <div className="call-stage">
          <div className="call-remote">
            {providerHere ? (
              <>
                <span className="call-face lg" aria-hidden="true">{nameInitials(visit.provider.name)}</span>
                <p className="call-name">{who}</p>
              </>
            ) : (
              <>
                <span className="call-pulse" aria-hidden="true" />
                <p className="call-name">You're in the waiting room</p>
                <p className="call-sub">
                  {visit.provider.name.split(" ")[0]} can see you're here and will let you in.
                </p>
              </>
            )}
          </div>

          <div className={`call-self${camOn ? "" : " off"}`}>
            {camOn && deviceState === "ok"
              ? <video ref={videoRef} autoPlay playsInline muted aria-label="Your camera" />
              : <span className="call-face" aria-hidden="true">You</span>}
          </div>

          <p className="call-meta" role="status">
            <span className="call-dot" aria-hidden="true" /> {mmss(elapsed)} · Not recorded
          </p>
        </div>

        <div className="call-bar">
          <button className={`call-btn${micOn ? "" : " off"}`} onClick={toggleMic}
            aria-pressed={!micOn} aria-label={micOn ? "Mute your microphone" : "Unmute your microphone"}>
            <Icon name={micOn ? "mic" : "micOff"} size={22} />
            <span>{micOn ? "Mute" : "Unmute"}</span>
          </button>
          <button className={`call-btn${camOn ? "" : " off"}`} onClick={toggleCam}
            aria-pressed={!camOn} aria-label={camOn ? "Turn your camera off" : "Turn your camera on"}>
            <Icon name={camOn ? "video" : "videoOff"} size={22} />
            <span>{camOn ? "Camera" : "Camera off"}</span>
          </button>
          <a className="call-btn" href={href("crisis")} aria-label="Get help now">
            <Icon name="life" size={22} />
            <span>Help</span>
          </a>
          <button className="call-btn end" onClick={leave} aria-label="Leave the visit">
            <Icon name="hangup" size={22} />
            <span>Leave</span>
          </button>
        </div>
      </div>
    );
  }

  /* ---------- early + lobby ---------- */
  return (
    <>
      <a className="backlink" href={href("visits", visit.id)}>
        <Icon name="back" size={16} /> Visit details
      </a>
      <h1 className="sr-only">Join your {visit.kind.toLowerCase()}</h1>

      <section className="pcard blue">
        <div className="pcard-head">
          <span className="lbl">
            <Icon name={isTherapy ? "people" : "capsule"} size={16} />
            {visit.kind} · {until(visit.startAt)}
          </span>
        </div>
        <h2 className="headline sm">
          {phase === "early"
            ? <>The waiting room opens <b>5 minutes before</b>.</>
            : <>The waiting room is <b>open</b>.</>}
        </h2>
        <p className="who">
          <span className="inline-face" aria-hidden="true">{nameInitials(visit.provider.name)}</span>
          {who}
        </p>
        <div className="pcard-foot">
          <span>{longDate(visit.startAt)} at {time(visit.startAt)}</span>
        </div>
      </section>

      <section className="pcard">
        <div className="pcard-head"><span className="lbl">Before you join</span></div>

        <div className={`devcheck${deviceState === "ok" ? " ok" : ""}`}>
          {deviceState === "ok" && camOn
            ? <video ref={videoRef} autoPlay playsInline muted aria-label="Your camera preview" />
            : <span className="devcheck-face" aria-hidden="true">
                <Icon name={deviceState === "ok" ? "video" : "videoOff"} size={30} />
              </span>}
        </div>

        {deviceState === "ok" && (
          <div className="meter-row">
            <Icon name={micOn ? "mic" : "micOff"} size={18} />
            <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100}
                 aria-valuenow={Math.round(level * 100)} aria-label="Microphone level">
              <span className="meter-fill" style={{ transform: `scaleX(${micOn ? level : 0})` }} />
            </div>
            <span className="meter-hint">{micOn ? "Say something" : "Muted"}</span>
          </div>
        )}

        {deviceState === "idle" && (
          <button className="btn ghost" onClick={checkDevices}>Test camera and mic</button>
        )}
        {deviceState === "asking" && <p className="body muted">Waiting for your browser…</p>}
        {deviceState === "ok" && (
          <div className="devbtns">
            <button className="btn ghost" onClick={toggleCam}>
              <Icon name={camOn ? "video" : "videoOff"} size={19} />
              {camOn ? "Camera on" : "Camera off"}
            </button>
            <button className="btn ghost" onClick={toggleMic}>
              <Icon name={micOn ? "mic" : "micOff"} size={19} />
              {micOn ? "Mic on" : "Muted"}
            </button>
          </div>
        )}
        {deviceState === "denied" && (
          <p className="body muted">
            Your browser is blocking the camera. You can still join with audio only, or
            allow access in your browser settings and test again.
          </p>
        )}
        {deviceState === "none" && (
          <p className="body muted">
            We couldn't find a camera. You can still join with audio only.
          </p>
        )}

        <button className="btn" disabled={phase === "early"} onClick={() => setPhase("live")}>
          <Icon name="video" size={20} />
          {phase === "early" ? `Opens ${until(new Date(opensMs).toISOString())}` : "Enter the waiting room"}
        </button>

        <div className="pcard-foot">
          <span>
            This session is <strong>not recorded</strong>. If video won't connect, call{" "}
            <a href="tel:+16155550100">(615) 555-0100</a> and we'll do the visit by phone.
          </span>
        </div>
      </section>
    </>
  );
}

function mmss(total: number) {
  const m = Math.floor(total / 60), s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
