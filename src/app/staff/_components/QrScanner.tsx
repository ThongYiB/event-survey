"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import s from "../staff.module.css";
import { QrMiniIcon, ScanIcon } from "./icons";

// สแกน QR ด้วยกล้องจริง
// - ใช้ BarcodeDetector ของเบราว์เซอร์ถ้ามี (Chrome บน Android / macOS)
// - ถ้าไม่มี (เช่น Chrome บน Windows, Safari) ใช้ไลบรารี jsqr แทน
// - กล้องใช้ได้เฉพาะ https หรือ localhost เท่านั้น

type CameraState = "idle" | "starting" | "scanning" | "denied" | "no-camera" | "insecure" | "error";

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
type BarcodeDetectorCtor = {
  new (opts: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
};
type JsQR = (data: Uint8ClampedArray, width: number, height: number, opts?: { inversionAttempts?: string }) => { data: string } | null;

const AUTO_START_KEY = "event-survey:staff:camera-enabled";
const SCAN_INTERVAL_MS = 180;
const MAX_DECODE_WIDTH = 640;

const MESSAGES: Record<Exclude<CameraState, "scanning">, string> = {
  idle: "กดเปิดกล้องเพื่อเริ่มสแกน",
  starting: "กำลังเปิดกล้อง…",
  denied: "ไม่ได้รับอนุญาตให้ใช้กล้อง เปิดสิทธิ์กล้องในการตั้งค่าเบราว์เซอร์แล้วลองอีกครั้ง",
  "no-camera": "ไม่พบกล้องในอุปกรณ์นี้ ใช้การค้นหาด้วยชื่อแทน",
  insecure: "กล้องใช้ได้เฉพาะเมื่อเปิดผ่าน https หรือ localhost",
  error: "เปิดกล้องไม่สำเร็จ ลองอีกครั้ง",
};

export default function QrScanner({
  onScan,
  paused = false,
}: {
  /** เรียกเมื่ออ่าน QR ได้ (ข้อความดิบใน QR) */
  onScan: (text: string) => void;
  /** หยุดอ่านชั่วคราว เช่น ระหว่างส่งข้อมูลไป server */
  paused?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const cameraAttempt = useRef(0);
  const decoderRef = useRef<((v: HTMLVideoElement) => Promise<string | null>) | null>(null);
  const pausedRef = useRef(paused);
  const onScanRef = useRef(onScan);
  const [state, setState] = useState<CameraState>("idle");

  useEffect(() => {
    pausedRef.current = paused;
    onScanRef.current = onScan;
  }, [paused, onScan]);

  const stop = useCallback(() => {
    cameraAttempt.current++;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const createDecoder = useCallback(async () => {
    const BD = (globalThis as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    if (BD) {
      try {
        const formats = (await BD.getSupportedFormats?.()) ?? ["qr_code"];
        if (formats.includes("qr_code")) {
          const detector = new BD({ formats: ["qr_code"] });
          return async (video: HTMLVideoElement) => (await detector.detect(video))[0]?.rawValue ?? null;
        }
      } catch {
        /* ใช้ jsqr แทน */
      }
    }
    const jsQR = (await import("jsqr")).default as unknown as JsQR;
    return async (video: HTMLVideoElement) => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return null;
      const scale = Math.min(1, MAX_DECODE_WIDTH / w);
      const cw = Math.round(w * scale);
      const ch = Math.round(h * scale);
      const canvas = (canvasRef.current ??= document.createElement("canvas"));
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, cw, ch);
      const img = ctx.getImageData(0, 0, cw, ch);
      return jsQR(img.data, cw, ch, { inversionAttempts: "dontInvert" })?.data ?? null;
    };
  }, []);

  const loop = useCallback((stream: MediaStream) => {
    const tick = async () => {
      const video = videoRef.current;
      const decode = decoderRef.current;
      if (!video || !decode || streamRef.current !== stream) return;
      if (!pausedRef.current && video.readyState >= 2) {
        try {
          const text = await decode(video);
          if (text && !pausedRef.current && streamRef.current === stream) onScanRef.current(text);
        } catch {
          /* เฟรมนี้อ่านไม่ได้ ข้ามไป */
        }
      }
      if (streamRef.current === stream) timerRef.current = window.setTimeout(tick, SCAN_INTERVAL_MS);
    };
    void tick();
  }, []);

  const start = useCallback(async () => {
    if (!window.isSecureContext) return setState("insecure");
    if (!navigator.mediaDevices?.getUserMedia) return setState("no-camera");
    stop();
    const attempt = cameraAttempt.current;
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const video = videoRef.current;
      if (cameraAttempt.current !== attempt || !video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      const decoder = await createDecoder();
      if (cameraAttempt.current !== attempt) return;
      decoderRef.current = decoder;
      try {
        localStorage.setItem(AUTO_START_KEY, "1");
      } catch {
        /* ignore */
      }
      setState("scanning");
      loop(stream);
    } catch (e) {
      if (cameraAttempt.current !== attempt) return;
      stop();
      const name = (e as DOMException)?.name;
      if (name === "NotAllowedError" || name === "SecurityError") setState("denied");
      else if (name === "NotFoundError" || name === "OverconstrainedError") setState("no-camera");
      else setState("error");
    }
  }, [createDecoder, loop, stop]);

  // เคยอนุญาตกล้องแล้ว → เปิดให้อัตโนมัติ (สแกนคนถัดไปได้ทันที)
  useEffect(() => {
    let auto = false;
    try {
      auto = localStorage.getItem(AUTO_START_KEY) === "1";
    } catch {
      /* ignore */
    }
    const scheduled = auto ? window.setTimeout(() => void start(), 0) : undefined;
    return () => {
      window.clearTimeout(scheduled);
      stop();
    };
  }, [start, stop]);

  const scanning = state === "scanning";

  return (
    <div className={s.scanner}>
      <video
        ref={videoRef}
        className={`${s.scanVideo} ${scanning ? s.scanVideoOn : ""}`}
        muted
        playsInline
        aria-label="ภาพจากกล้องสำหรับสแกน QR"
      />
      <div className={`${s.scanFrame} ${scanning ? s.scanFrameLive : ""}`}>
        {!scanning && <QrMiniIcon size={44} />}
        {scanning && <span className={s.scanLine} />}
      </div>
      <p className={s.scanCaption} role="status">
        {scanning ? (paused ? "กำลังตรวจสอบ…" : "กำลังสแกน • วาง QR ให้อยู่ในกรอบ") : MESSAGES[state]}
      </p>
      {!scanning && state !== "starting" && state !== "insecure" && state !== "no-camera" && (
        <button type="button" className={s.scanStart} onClick={() => void start()}>
          <ScanIcon /> {state === "idle" ? "เปิดกล้อง" : "ลองอีกครั้ง"}
        </button>
      )}
    </div>
  );
}
