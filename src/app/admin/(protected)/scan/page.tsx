"use client";

import Link from "next/link";
import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Gate check-in.
 *
 * Decodes QR codes two ways, because the gate cannot depend on which phone a
 * staff member happens to be holding:
 *
 *  1. `BarcodeDetector` where the browser has it (Chrome on Android). It is
 *     hardware-accelerated and the fastest option.
 *  2. jsQR otherwise. Safari and every iPhone browser lack BarcodeDetector
 *     entirely, so without this an iPhone could not scan at all.
 *
 * The manual booking-code box remains as a third fallback for a dead camera.
 *
 * Camera access requires HTTPS or localhost. On a deployed site that is
 * automatic; over a bare LAN IP the browser will refuse.
 */

interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (options?: {
      formats?: string[];
    }) => BarcodeDetectorLike;
  }
}

type ScanResult = {
  status: "ok" | "already-used" | "invalid";
  message: string;
  name?: string;
  booking?: string;
  passName?: string;
  passType?: "SINGLE" | "COUPLE" | "GROUP4" | "CHILD";
  seats?: number;
  checkedInAt?: string | null;
};

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  // Guards against the same QR firing dozens of times per second.
  const lastScanRef = useRef<{ token: string; at: number }>({ token: "", at: 0 });

  const [cameraOn, setCameraOn] = useState(false);
  const [decoder, setDecoder] = useState<"native" | "jsqr" | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedCount, setScannedCount] = useState(0);

  useEffect(() => {
    const native =
      typeof window !== "undefined" && "BarcodeDetector" in window;
    setDecoder(native ? "native" : "jsqr");
  }, []);

  const submitToken = useCallback(async (token: string) => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await response.json()) as ScanResult;
      setResult(data);
      if (data.status === "ok") setScannedCount((c) => c + 1);

      // A short vibration gives staff confirmation without looking down.
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(data.status === "ok" ? 80 : [60, 50, 60]);
      }
    } catch {
      setResult({ status: "invalid", message: "Network error — try again." });
    } finally {
      setBusy(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);

      const useNative = "BarcodeDetector" in window;
      const detector = useNative
        ? new window.BarcodeDetector!({ formats: ["qr_code"] })
        : null;

      const tick = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
          // jsQR inspects every pixel in JavaScript, so a full-resolution
          // frame from a modern phone would drop the frame rate to a crawl.
          // Downscaling to ~480px keeps decoding fast and is still far more
          // detail than a QR needs. BarcodeDetector is native and does not
          // care, but sharing one canvas keeps the loop simple.
          const scale = Math.min(1, 480 / (video.videoWidth || 480));
          canvas.width = Math.round(video.videoWidth * scale);
          canvas.height = Math.round(video.videoHeight * scale);

          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            let value: string | undefined;
            try {
              if (detector) {
                value = (await detector.detect(canvas))[0]?.rawValue;
              } else {
                const frame = context.getImageData(
                  0,
                  0,
                  canvas.width,
                  canvas.height,
                );
                value =
                  jsQR(frame.data, frame.width, frame.height, {
                    inversionAttempts: "dontInvert",
                  })?.data ?? undefined;
              }
            } catch {
              // A single failed frame is normal; keep scanning.
            }

            const now = Date.now();
            if (
              value &&
              !(
                value === lastScanRef.current.token &&
                now - lastScanRef.current.at < 3000
              )
            ) {
              lastScanRef.current = { token: value, at: now };
              await submitToken(value);
            }
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setCameraError(
        "Could not open the camera. Allow camera access, or use the booking code box below.",
      );
    }
  }, [submitToken]);

  // Always release the camera when leaving the page.
  useEffect(() => stopCamera, [stopCamera]);

  const palette = {
    ok: "border-emerald-400/50 bg-emerald-500/12 text-emerald-300",
    "already-used": "border-amber-400/50 bg-amber-500/12 text-amber-300",
    invalid: "border-rose-500/50 bg-rose-600/12 text-rose-300",
  } as const;

  return (
    <div className="min-h-screen">
      <header className="border-b border-night-600/50 bg-night-900/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-4">
          <div>
            <h1 className="font-display text-xl text-cream">Gate check-in</h1>
            <p className="text-[11px] text-muted">
              {scannedCount} admitted this session
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-muted transition-colors hover:text-gold-400"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-5 py-7">
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-night-500/70 bg-night-950">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`h-full w-full object-cover ${cameraOn ? "" : "hidden"}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {cameraOn && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-52 w-52 rounded-2xl border-2 border-gold-400/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
            </div>
          )}

          {!cameraOn && (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <p className="text-sm text-muted">
                Point the camera at the QR on the guest&rsquo;s phone.
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-5 rounded-full bg-rose-500 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-400"
              >
                Start camera
              </button>
              {decoder === "jsqr" && (
                <p className="mt-4 text-[11px] leading-relaxed text-muted">
                  Hold the phone steady — this browser decodes in software, so
                  it reads a fraction slower than Chrome on Android.
                </p>
              )}
            </div>
          )}
        </div>

        {cameraOn && (
          <button
            type="button"
            onClick={stopCamera}
            className="mt-3 w-full rounded-full border border-night-500 px-6 py-2.5 text-sm text-muted transition-colors hover:text-cream"
          >
            Stop camera
          </button>
        )}

        {cameraError && (
          <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-600/12 px-4 py-3 text-sm text-rose-200">
            {cameraError}
          </p>
        )}

        {result && (
          <div
            role="status"
            aria-live="assertive"
            className={`mt-5 rounded-2xl border p-6 text-center ${palette[result.status]}`}
          >
            <p className="font-display text-3xl font-semibold">
              {result.status === "ok"
                ? `✓ ${result.message}`
                : result.status === "already-used"
                  ? "Already scanned"
                  : "Not valid"}
            </p>

            {result.name && (
              <p className="mt-2.5 text-lg text-cream">{result.name}</p>
            )}
            {result.passName && (
              <p className="text-sm text-muted">
                {result.passName}
                {result.seats ? ` · admits ${result.seats}` : ""}
              </p>
            )}

            {/* A child pass costs far less than an adult one, so the gate has
                to actually look at who is standing there. The pass name alone
                is too easy to skim past in a queue. */}
            {result.passType === "CHILD" && result.status !== "invalid" && (
              <p className="mt-3 rounded-xl border-2 border-amber-400/70 bg-amber-400/15 px-4 py-3 text-base font-bold uppercase tracking-wide text-amber-200">
                Child pass — check age 6 to 12
              </p>
            )}
            {result.booking && (
              <p className="mt-1.5 font-mono text-xs text-muted">
                {result.booking}
              </p>
            )}
            {result.status === "already-used" && result.checkedInAt && (
              <p className="mt-2.5 text-xs">
                Scanned at{" "}
                {new Date(result.checkedInAt).toLocaleTimeString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            )}
            {result.status === "invalid" && (
              <p className="mt-2 text-sm">{result.message}</p>
            )}
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = manual.trim();
            if (value) {
              submitToken(value);
              setManual("");
            }
          }}
          className="mt-7"
        >
          <label htmlFor="manual" className="block text-sm text-cream/85">
            Or enter the booking code manually
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="manual"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="SNR-7K3M9Q or paste the ticket link"
              autoComplete="off"
              className="flex-1 rounded-xl border border-night-500 bg-night-900/70 px-4 py-3 text-sm text-cream placeholder:text-muted/45 focus:border-gold-600/70 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !manual.trim()}
              className="rounded-xl bg-rose-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-rose-400 disabled:opacity-50"
            >
              Check
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Works with the booking code from the guest&rsquo;s email, or the
            full ticket link. On a multi-pass booking the code admits the next
            unscanned pass.
          </p>
        </form>
      </main>
    </div>
  );
}
