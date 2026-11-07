import { useEffect, useState, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import "./App.css";

/* ─── Dynamic API & QR URLs ─── */
const getApiBase = () => {
  // Relative '/api' works seamlessly across localhost, Wi-Fi LAN IP, and Cloud tunnels via Vite proxy
  if (typeof window !== "undefined") {
    return "/api";
  }
  return "http://localhost:5000/api";
};

const PUBLIC_TUNNEL_URL = "https://outreach-random-concrete-cats.trycloudflare.com";

const getQrBaseUrl = () => {
  if (typeof window !== "undefined") {
    // 1. If admin configured a custom QR host in localStorage
    const customHost = localStorage.getItem("vignan_custom_qr_host");
    if (customHost && customHost.trim()) {
      return customHost.trim().replace(/\/$/, "");
    }

    // 2. If opened in browser via an IP or public domain other than localhost (e.g. tunnel, domain)
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return window.location.origin;
    }

    // 3. Default to the active Cloudflare Tunnel URL so ANY mobile phone on 4G/5G or any network can scan!
    return PUBLIC_TUNNEL_URL;
  }
  return PUBLIC_TUNNEL_URL;
};

/* ─── Client-side Image Compression (Keeps photo < 150 KB base64) ─── */
function compressImage(dataUrl, maxW = 600, maxH = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const ratio = Math.min(maxW / width, maxH / height, 1);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Failed to process image"));
    img.src = dataUrl;
  });
}

const emptyForm = {
  name: "",
  regNo: "",
  phone: "",
  email: "",
  section: "A",
  dob: "",
  department: "CSE",
  course: "B.Tech",
  academicYear: "2024-2028",
  validTill: "2028-06-30",
  photo: "",
};

/* ─── Toast Notifications ─── */
let _toastId = 0;
function ToastContainer({ toasts, onClose }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}${t.hiding ? " hiding" : ""}`}>
          <span className="toast-icon">
            {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}
          </span>
          <span style={{ flex: 1 }}>{t.message}</span>
          <button className="toast-close" onClick={() => onClose(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, hiding: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 380);
  }, []);

  const addToast = useCallback((message, type = "info") => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5500);
    return id;
  }, [removeToast]);

  return { toasts, addToast, removeToast };
}

/* ─── Skeleton Loading Rows ─── */
function SkeletonRows() {
  return Array.from({ length: 4 }).map((_, i) => (
    <tr key={i} className="skeleton-row">
      <td><div className="skeleton-circle" /></td>
      <td><div className="skeleton-cell wide" /></td>
      <td><div className="skeleton-cell short" /></td>
      <td><div className="skeleton-cell short" /></td>
      <td><div className="skeleton-cell thin" /></td>
      <td><div className="skeleton-cell thin" /></td>
      <td><div className="skeleton-cell wide" /></td>
    </tr>
  ));
}

/* ─── Official Student ID Card Component (Exact Vignan PVC Card Format) ─── */
function StudentIdCard({ student, isVerified = false, verifiedAt = null }) {
  // Secure QR URL containing unique token rather than private student info
  const qrUrl = `${getQrBaseUrl()}/verify?token=${encodeURIComponent(student?.qrToken || student?._id || "")}`;

  // Formatting student details exactly as on the physical Vignan ID Card
  const studentName = (student?.name || "STUDENT NAME").toUpperCase();
  const regNo = (student?.regNo || "REGISTRATION NO").toUpperCase();
  const course = (student?.course || "B.TECH").toUpperCase();
  const dept = (student?.department || "CSE").toUpperCase();
  const rawSec = (student?.section || "01").toString().trim();
  const secFormatted = rawSec.toLowerCase().startsWith("sec") ? rawSec : `Sec - ${rawSec}`;
  const academicYear = student?.academicYear || "2024 - 2028";
  const photoSrc = student?.photo || "";

  return (
    <div className="card-center-wrapper" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", margin: "0 auto", textAlign: "center" }}>
      {/* Physical PVC Card Container */}
      <div className="vignan-pvc-card" id="student-card">
        {/* University Header Banner */}
        <div className="vignan-pvc-header-wrap">
          <img
            src="/vignan-card-header.png"
            alt="Vignan's Foundation for Science, Technology & Research"
            className="vignan-pvc-header-img"
          />
        </div>

        {/* Verified Ribbon (When scanned & verified via OTP) */}
        {isVerified && (
          <div className="vignan-pvc-verified-tag">
            🛡️ OFFICIAL VERIFIED RECORD &nbsp;•&nbsp; STATUS: ACTIVE
          </div>
        )}

        {/* Middle Section: Left Green Vertical Ribbon + Center Student Photo */}
        <div className="vignan-pvc-middle">
          <div className="vignan-pvc-student-ribbon">
            <span>STUDENT</span>
          </div>

          <div className="vignan-pvc-photo-box">
            {photoSrc ? (
              <img
                src={photoSrc}
                alt={studentName}
                loading="eager"
              />
            ) : (
              <div className="vignan-pvc-photo-placeholder">
                <span style={{ fontSize: 36, opacity: 0.45 }}>📷</span>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginTop: 4 }}>
                  Student Photo
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Student Details Section */}
        <div className="vignan-pvc-details">
          <div className="vignan-pvc-name">{studentName}</div>
          <div className="vignan-pvc-regno">{regNo}</div>
          <div className="vignan-pvc-course-dept">
            {course} {dept}&nbsp; {secFormatted}
          </div>

          <div className="vignan-pvc-bottom-row">
            <div className="vignan-pvc-year">{academicYear}</div>
            <div className="vignan-pvc-sig-container">
              <img
                src="/registrar-signature.png"
                alt="Registrar Signature"
                className="vignan-pvc-sig-img"
              />
              <div className="vignan-pvc-sig-label">Registrar</div>
            </div>
          </div>
        </div>

        {/* Bottom Green Footer Strip */}
        <div className="vignan-pvc-footer">
          <span className="vignan-pvc-footer-url">www.vignan.ac.in</span>
          <div className="vignan-pvc-footer-lines">
            <div />
            <div />
          </div>
        </div>
      </div>

      {/* Attached QR Code Verification Tray */}
      <div className="card-qr-tray">
        <div style={{ background: "#ffffff", padding: 10, borderRadius: 10, display: "inline-block", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
          <a href={qrUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
            <QRCodeSVG value={qrUrl} size={118} level="M" />
          </a>
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#1e293b", marginTop: 8 }}>
          📱 Scan QR Code with any phone to verify student
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
          Security Token: <code style={{ color: "#2563eb", fontWeight: 700 }}>{(student?.qrToken || student?._id || "").toString().substring(0, 16)}...</code>
        </div>
        <a
          href={qrUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            marginTop: 6,
            fontSize: 12,
            color: "#2563eb",
            textDecoration: "underline",
            fontWeight: 700,
          }}
        >
          🔗 Or click here to test verification in browser
        </a>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   VERIFICATION PORTAL COMPONENT
   Triggered when scanning QR code on phone or visiting /verify
────────────────────────────────────────────────────────── */
function VerificationPortal({ tokenFromUrl, onGoToAdmin }) {
  const [step, setStep] = useState(1); // 1: Input details, 2: OTP, 3: Verified Card
  const [regNo, setRegNo] = useState("");
  const [contact, setContact] = useState("");
  const [method, setMethod] = useState("phone"); // 'phone' or 'email'
  const [tokenInfo, setTokenInfo] = useState(null);

  // 6-digit OTP states
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [maskedTarget, setMaskedTarget] = useState("");
  const [timer, setTimer] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(45);
  const [verifiedStudent, setVerifiedStudent] = useState(null);
  const [verifiedAt, setVerifiedAt] = useState(null);
  const [devDemoOtp, setDevDemoOtp] = useState(null);

  const digitRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const { toasts, addToast, removeToast } = useToast();

  /* If QR token is present, lookup token context */
  useEffect(() => {
    if (tokenFromUrl) {
      fetch(`${getApiBase()}/verification/lookup-token/${encodeURIComponent(tokenFromUrl)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setTokenInfo(data);
            setRegNo(data.regNo);
            if (data.maskedPhone) setContact(data.maskedPhone);
          }
        })
        .catch(() => {});
    }
  }, [tokenFromUrl]);

  /* Countdown timer for OTP expiry */
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  /* Resend cooldown timer */
  useEffect(() => {
    let interval = null;
    if (step === 2 && resendCooldown > 0) {
      interval = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendCooldown]);

  /* Handle Step 1: Send OTP */
  async function handleSendOtp(e) {
    if (e) e.preventDefault();

    if (!regNo.trim()) {
      addToast("Please enter student Registration Number.", "error");
      return;
    }
    if (!contact.trim()) {
      addToast("Please enter registered Mobile Number or Email.", "error");
      return;
    }

    setLoading(true);
    setDevDemoOtp(null);

    try {
      const response = await fetch(`${getApiBase()}/verification/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regNo: regNo.trim().toUpperCase(),
          contact: contact.trim(),
          method,
          token: tokenFromUrl || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Verification request failed.");
      }

      setMaskedTarget(data.maskedTarget || contact);
      setTimer(300);
      setResendCooldown(45);
      setOtpDigits(["", "", "", "", "", ""]);
      setStep(2);

      if (data.demoOtp) {
        setDevDemoOtp(data.demoOtp);
      }

      addToast(data.message, "success");
      setTimeout(() => digitRefs[0]?.current?.focus(), 250);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  /* Handle 6-Digit OTP Box input */
  function handleDigitChange(index, value) {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      const newDigits = [...otpDigits];
      newDigits[index] = "";
      setOtpDigits(newDigits);
      return;
    }

    // Single digit or paste
    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split("");
      const newDigits = [...otpDigits];
      chars.forEach((c, i) => {
        if (i < 6) newDigits[i] = c;
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(chars.length, 5);
      digitRefs[nextIdx]?.current?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = clean;
    setOtpDigits(newDigits);

    if (index < 5) {
      digitRefs[index + 1]?.current?.focus();
    }
  }

  function handleDigitKeyDown(index, e) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      digitRefs[index - 1]?.current?.focus();
    }
  }

  /* Handle Step 2: Verify OTP */
  async function handleVerifyOtp(e) {
    if (e) e.preventDefault();
    const fullOtp = otpDigits.join("");

    if (fullOtp.length !== 6) {
      addToast("Please enter the complete 6-digit OTP.", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${getApiBase()}/verification/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regNo: regNo.trim().toUpperCase(),
          otp: fullOtp,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed.");
      }

      setVerifiedStudent(data.student);
      setVerifiedAt(data.verifiedAt);
      setStep(3);
      addToast("🎉 Student ID verified successfully!", "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="app">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <header className="header">
        <div>
          <h1>🎓 Vignan University</h1>
          <p>Official Student ID Card Verification Portal</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="admin" style={{ background: "#059669", borderColor: "#10b981" }}>
            🔒 Verified 2FA Gateway
          </span>
          {onGoToAdmin && (
            <button
              className="secondary"
              style={{ fontSize: 12, padding: "8px 14px", borderRadius: 20 }}
              onClick={onGoToAdmin}
            >
              Admin Portal
            </button>
          )}
        </div>
      </header>

      <main className="container" style={{ maxWidth: 680, marginTop: 24 }}>
        {/* STEP 1: Enter Registration & Contact */}
        {step === 1 && (
          <div className="otp-box">
            <div className="otp-icon-wrap">🛡️</div>
            <h2>Student ID Verification</h2>
            <p>
              Verify student credentials and authenticity with two-factor authentication.
              Enter the registration number and registered contact.
            </p>

            {tokenInfo && (
              <div style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 12,
                padding: "12px 16px",
                marginBottom: 20,
                textAlign: "left",
                fontSize: 13,
                color: "#1e40af"
              }}>
                <div><strong>Institution:</strong> {tokenInfo.college}</div>
                <div><strong>Student Name:</strong> {tokenInfo.studentName}</div>
                <div><strong>Program:</strong> {tokenInfo.course} ({tokenInfo.department})</div>
              </div>
            )}

            <form onSubmit={handleSendOtp}>
              <div style={{ textAlign: "left", marginBottom: 16 }}>
                <label>
                  Registration Number *
                  <input
                    type="text"
                    required
                    placeholder="e.g. 241FA04B53"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                    style={{ textTransform: "uppercase" }}
                  />
                </label>
              </div>

              <div style={{ textAlign: "left", marginBottom: 18 }}>
                <label>
                  Registered Mobile Number or Email *
                  <input
                    type="text"
                    required
                    placeholder={method === "email" ? "Enter registered student email" : "Enter 10-digit mobile number"}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                  />
                </label>
              </div>

              {/* Delivery method toggle */}
              <div style={{ textAlign: "left", marginBottom: 22 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>
                  Deliver Verification OTP Via:
                </span>
                <div className="delivery-selector">
                  <button
                    type="button"
                    className={`delivery-tab ${method === "phone" ? "active" : ""}`}
                    onClick={() => setMethod("phone")}
                  >
                    📱 Mobile SMS
                  </button>
                  <button
                    type="button"
                    className={`delivery-tab ${method === "email" ? "active" : ""}`}
                    onClick={() => setMethod("email")}
                  >
                    ✉️ College Email
                  </button>
                </div>
              </div>

              <div className="actions" style={{ justifyContent: "center" }}>
                <button
                  type="submit"
                  className="primary"
                  disabled={loading}
                  style={{ width: "100%", padding: "14px", fontSize: 15 }}
                >
                  {loading ? <span className="spinner" /> : "⚡ "}
                  {loading ? "Verifying & Sending OTP…" : "Send Verification OTP"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: Enter 6-Digit OTP */}
        {step === 2 && (
          <div className="otp-box">
            <div className="otp-icon-wrap">🔑</div>
            <h2>Enter 6-Digit OTP</h2>
            <p>
              A one-time verification code has been dispatched to{" "}
              <strong style={{ color: "#1d4ed8" }}>{maskedTarget}</strong>.
            </p>

            {/* Development demo notice when gateway credentials are not yet set in .env */}
            {devDemoOtp && (
              <div
                className="otp-notice"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  const arr = devDemoOtp.split("");
                  setOtpDigits(arr);
                  addToast("OTP code auto-filled!", "success");
                }}
                title="Click to auto-fill for testing"
              >
                <span>🔔 Simulated Alert (Demo Code):</span>
                <span className="otp-code-pill">{devDemoOtp}</span>
                <span style={{ fontSize: 11, opacity: 0.8 }}>(tap to fill)</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp}>
              {/* 6 Individual Digit Inputs */}
              <div className="otp-digit-inputs">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={digitRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`otp-digit-box ${digit ? "filled" : ""}`}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                  />
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 4px 24px", fontSize: 13 }}>
                <span style={{ color: timer > 60 ? "#64748b" : "#dc2626", fontWeight: 700 }}>
                  ⏱️ Code expires in: {formatTimer(timer)}
                </span>
                <button
                  type="button"
                  className="secondary"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleSendOtp}
                  style={{ fontSize: 12, padding: "6px 12px" }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "🔄 Resend OTP"}
                </button>
              </div>

              <div className="actions" style={{ justifyContent: "center" }}>
                <button
                  type="submit"
                  className="primary"
                  disabled={loading || otpDigits.join("").length !== 6}
                  style={{ width: "100%", padding: "14px", fontSize: 15 }}
                >
                  {loading ? <span className="spinner" /> : "🔓 "}
                  {loading ? "Validating OTP…" : "Verify OTP & View ID Card"}
                </button>
              </div>
            </form>

            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                className="secondary"
                style={{ fontSize: 12 }}
                onClick={() => setStep(1)}
              >
                ← Change Registration / Contact
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Verified Student ID Card Display */}
        {step === 3 && verifiedStudent && (
          <section className="panel" style={{ textAlign: "center", marginTop: 20 }}>
            <div className="verified-card-badge">
              <span>✅</span> STUDENT IDENTITY AUTHENTICATED & VERIFIED
            </div>

            {/* Official ID Card */}
            <StudentIdCard
              student={verifiedStudent}
              isVerified={true}
              verifiedAt={verifiedAt}
            />

            {/* Verification Metadata Certificate */}
            <div className="verified-meta">
              <div className="verified-meta-grid">
                <div className="verified-meta-item">
                  <strong>Verification Timestamp:</strong><br />
                  {verifiedAt ? new Date(verifiedAt).toLocaleString() : new Date().toLocaleString()}
                </div>
                <div className="verified-meta-item">
                  <strong>Authentication Method:</strong><br />
                  Two-Factor OTP ({method === "email" ? "Registered Email" : "Mobile SMS"})
                </div>
                <div className="verified-meta-item">
                  <strong>Security Reference:</strong><br />
                  <code>VIGNAN-CERT-{verifiedStudent.regNo}</code>
                </div>
                <div className="verified-meta-item">
                  <strong>Institutional Record:</strong><br />
                  Active Registered Student
                </div>
              </div>
            </div>

            {/* Print and Actions */}
            <div className="actions" style={{ justifyContent: "center", gap: 14, marginTop: 24 }}>
              <button
                className="primary print-btn"
                style={{ fontSize: 15, padding: "14px 28px", display: "inline-flex", alignItems: "center", gap: 8 }}
                onClick={() => window.print()}
              >
                🖨️ Print Verified ID Card
              </button>
              {onGoToAdmin && (
                <button className="secondary" onClick={onGoToAdmin}>
                  🏠 Open Admin Dashboard
                </button>
              )}
            </div>
          </section>
        )}
      </main>

      <footer>
        <span>🏛️ Vignan's Foundation for Science, Technology & Research (Deemed to be University)</span>
      </footer>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   ADMIN LOGIN COMPONENT
   Protects the Admin Board so only authorized admins can edit details
────────────────────────────────────────────────────────── */
function AdminLogin({ onLoginSuccess, onCancel }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quickFilled, setQuickFilled] = useState(false);

  // 3D Tilt & Specular Glare Micro-Interaction
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Elegant subtle 3D tilt angles (-5deg to +5deg)
    const rotX = -((y - centerY) / centerY) * 5;
    const rotY = ((x - centerX) / centerX) * 5;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setTilt({ x: rotX, y: rotY, glareX, glareY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  };

  const handleQuickFill = () => {
    setUsername("admin");
    setPassword("admin123");
    setQuickFilled(true);
    setTimeout(() => setQuickFilled(false), 2200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${getApiBase()}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Invalid credentials.");
      }

      onLoginSuccess(data.token, data.admin);
    } catch (err) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* High-Level Ambient Prismatic Glow Orbs */}
      <div className="login-ambient-orb orb-1" />
      <div className="login-ambient-orb orb-2" />
      <div className="login-ambient-orb orb-3" />

      {/* 3D Dynamic Card Container */}
      <div
        ref={cardRef}
        className="login-card"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1200px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg)`,
        }}
      >
        {/* Specular Interactive Glass Glare */}
        <div
          className="login-card-glare"
          style={{
            background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.25) 0%, transparent 65%)`,
          }}
        />

        {/* Security Live Beacon */}
        <div className="login-security-beacon">
          <span className="beacon-radar">
            <span className="beacon-ping" />
            <span className="beacon-dot" />
          </span>
          <span className="beacon-text">256-BIT ENCRYPTION &bull; CAMPUS GATEWAY &bull; ACTIVE</span>
        </div>

        {/* Official Wide University Logo with Floating & Glow Animation */}
        <div className="login-official-logo-wrap animate-float-logo">
          <img
            src="/vignan-official-logo-transparent.png"
            alt="Vignan's Foundation for Science, Technology and Research - Deemed to be University"
            className="login-official-logo"
          />
        </div>

        <div className="login-portal-badge">
          🛡️ OFFICIAL ADMINISTRATOR GATEWAY
        </div>

        <h2 className="login-title">Administrator Portal</h2>
        <p className="login-sub">
          Authorized university personnel only. Authenticate to manage records, update student details, and maintain the admin board.
        </p>

        {error && <div className="login-error-alert">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">
            <span>Admin Username</span>
            <div className="input-icon-wrap">
              <span className="input-lead-icon">👤</span>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-field-input"
              />
            </div>
          </label>

          <label className="login-label">
            <span>Password</span>
            <div className="input-icon-wrap password-input-wrap">
              <span className="input-lead-icon">{password ? "🔐" : "🔒"}</span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-field-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </label>

          <button type="submit" className="login-submit-btn-glow" disabled={loading}>
            <span className="btn-sweep-light" />
            <span className="btn-inner-content">
              {loading ? (
                <>
                  <span className="login-btn-spinner" /> Authenticating Portal...
                </>
              ) : (
                <>
                  <span className="btn-lock-icon">🔓</span> Log In to Admin Board
                </>
              )}
            </span>
          </button>
        </form>

        <div className="login-hint-box">
          <div className="hint-header-row">
            <span className="hint-title">🔑 Default Admin Credentials</span>
            <button
              type="button"
              className={`quick-fill-pill ${quickFilled ? "active" : ""}`}
              onClick={handleQuickFill}
              title="Click to auto-fill credentials"
            >
              {quickFilled ? "✓ Auto-Filled!" : "⚡ Quick Fill"}
            </button>
          </div>
          <div className="credentials-chip-row">
            <span>Username: <code>admin</code></span>
            <span className="cred-dot">&bull;</span>
            <span>Password: <code>admin123</code></span>
          </div>
          <small className="hint-footer-text">
            (You can update this password or add other administrators inside the admin board)
          </small>
        </div>

        {onCancel && (
          <div className="login-cancel-row">
            <button
              type="button"
              className="login-return-btn"
              onClick={onCancel}
            >
              ← Return to Student Verification Portal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   ADMIN DASHBOARD COMPONENT
   Exclusive management portal for authorized administrators
────────────────────────────────────────────────────────── */
function AdminDashboard({ adminAuth, onLogout, onOpenVerificationPortal }) {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("students"); // 'students', 'logs', or 'admin'
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Admin Management & Security states
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ username: "", name: "", password: "", role: "admin" });
  const [newAdminSaving, setNewAdminSaving] = useState(false);

  // Real-Time System Clock for Header
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Custom QR Host State (for different Wi-Fi / Hotspot / Cloud Tunnel)
  const [customQrHost, setCustomQrHost] = useState(() => {
    return localStorage.getItem("vignan_custom_qr_host") || "";
  });

  const { toasts, addToast, removeToast } = useToast();

  const getAuthHeaders = useCallback(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminAuth?.token}`,
    };
  }, [adminAuth?.token]);

  /* Load students */
  async function fetchStudents() {
    try {
      const response = await fetch(`${getApiBase()}/students`, {
        headers: getAuthHeaders(),
      });
      if (response.status === 401) {
        onLogout();
        return;
      }
      if (!response.ok) throw new Error("Unable to load students");
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      addToast("Backend error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  /* Load verification logs */
  async function fetchLogs() {
    setLogsLoading(true);
    try {
      const response = await fetch(`${getApiBase()}/students/verification/logs`, {
        headers: getAuthHeaders(),
      });
      if (response.status === 401) {
        onLogout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (e) {
      console.error("Failed to load logs:", e);
    } finally {
      setLogsLoading(false);
    }
  }

  /* Load admins list */
  async function fetchAdmins() {
    setAdminsLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/admin/list`, {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (e) {
      console.error("Failed to load admins:", e);
    } finally {
      setAdminsLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
    } else if (activeTab === "admin") {
      fetchAdmins();
    }
  }, [activeTab]);

  /* Photo upload with compression */
  function handlePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      addToast("Please select a valid image file.", "error");
      event.target.value = "";
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      addToast("Photo must be smaller than 20 MB.", "error");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        addToast("⏳ Compressing photo…", "info");
        const compressed = await compressImage(reader.result);
        setForm((prev) => ({ ...prev, photo: compressed }));
        addToast("✅ Photo optimized!", "success");
      } catch {
        addToast("Unable to process the photo.", "error");
      }
    };
    reader.onerror = () => addToast("Unable to read selected photo.", "error");
    reader.readAsDataURL(file);
  }

  /* Register / Update student */
  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      const isEditing = editing !== null;
      const response = await fetch(
        isEditing ? `${getApiBase()}/students/${editing}` : `${getApiBase()}/students`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(form),
        }
      );

      if (response.status === 401) {
        addToast("Session expired. Please log in again.", "error");
        onLogout();
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Operation failed.");

      addToast(
        isEditing ? "✏️ Student details updated successfully!" : "🎉 Student registered successfully!",
        "success"
      );

      const targetId = isEditing ? editing : data.student?._id;
      setForm(emptyForm);
      setEditing(null);
      await fetchStudents();

      if (targetId) {
        setSelected(targetId);
        setTimeout(() => {
          document.getElementById("id-card-section")?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    } catch (err) {
      addToast("❌ " + err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  /* Edit student */
  function editStudent(student) {
    setForm({
      name: student.name || "",
      regNo: student.regNo || "",
      phone: student.phone || "",
      email: student.email || `${student.regNo.toLowerCase()}@vignan.ac.in`,
      section: student.section || "A",
      dob: student.dob ? student.dob.substring(0, 10) : "",
      department: student.department || "CSE",
      course: student.course || "B.Tech",
      academicYear: student.academicYear || "2024-2028",
      validTill: student.validTill || "2028-06-30",
      photo: student.photo || "",
    });
    setEditing(student._id);
    setSelected(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* Delete student */
  async function deleteStudent(id) {
    if (!window.confirm("Are you sure you want to delete this student record?")) return;

    try {
      const response = await fetch(`${getApiBase()}/students/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        addToast("Session expired. Please log in again.", "error");
        onLogout();
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Delete failed.");

      addToast("🗑️ Student deleted successfully!", "success");
      if (selected === id) setSelected(null);
      if (editing === id) {
        setEditing(null);
        setForm(emptyForm);
      }
      await fetchStudents();
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  /* Change Admin Password */
  async function handlePasswordChange(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      addToast("New passwords do not match.", "error");
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch(`${getApiBase()}/admin/change-password`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });

      if (res.status === 401) {
        onLogout();
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Password change failed.");

      addToast("✅ Admin password updated successfully!", "success");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      addToast("❌ " + err.message, "error");
    } finally {
      setPwSaving(false);
    }
  }

  /* Create New Administrator */
  async function handleCreateAdmin(e) {
    e.preventDefault();
    setNewAdminSaving(true);
    try {
      const res = await fetch(`${getApiBase()}/admin/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newAdmin),
      });

      if (res.status === 401) {
        onLogout();
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create administrator.");

      addToast(`🎉 Administrator '${data.admin.username}' created successfully!`, "success");
      setNewAdmin({ username: "", name: "", password: "", role: "admin" });
      await fetchAdmins();
    } catch (err) {
      addToast("❌ " + err.message, "error");
    } finally {
      setNewAdminSaving(false);
    }
  }

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(q) ||
      (s.regNo || "").toLowerCase().includes(q) ||
      (s.department || "").toLowerCase().includes(q) ||
      (s.course || "").toLowerCase().includes(q)
    );
  });

  const selectedStudent = students.find((s) => s._id === selected);
  const departmentCount = new Set(students.map((s) => s.department).filter(Boolean)).size;

  const timeStr = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = currentTime.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="app">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <header className="header">
        <div>
          <h1>🎓 College ID Management</h1>
          <p>Vignan University — Student Administration &amp; ID Verification System</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="admin-user-pill">
            <span className="admin-user-dot" />
            👤 {adminAuth?.admin?.username || "Admin"} ({adminAuth?.admin?.role || "Staff"})
          </span>
          <button
            type="button"
            className="secondary"
            style={{ fontSize: 12, padding: "8px 14px", borderRadius: 30, background: "rgba(255,255,255,0.18)", color: "white", border: "1px solid rgba(255,255,255,0.35)" }}
            onClick={onOpenVerificationPortal}
          >
            🔍 Verification Portal
          </button>
          <button
            type="button"
            className="secondary"
            style={{ fontSize: 12, padding: "8px 14px", borderRadius: 30, background: "#ef4444", color: "white", border: "none" }}
            onClick={onLogout}
          >
            🚪 Log Out
          </button>
        </div>
      </header>

      <main className="container">
        {/* STATS WITH LOGOS & RESPECTED NAMES */}
        <section className="stats">
          <div className="stat stat-enrolled">
            <div className="stat-content">
              <div className="stat-header-row">
                <span className="stat-mini-logo">🎓</span>
                <span className="stat-name">Total Enrolled</span>
              </div>
              <h2 className="stat-number">{students.length}</h2>
              <div className="stat-sub-text">
                <span className="stat-pulse-dot dot-blue" />
                <span>Verified Student Records</span>
              </div>
            </div>
            <div className="stat-graphic-badge badge-blue">
              <span className="graphic-icon">👨‍🎓</span>
              <span className="badge-halo" />
            </div>
          </div>

          <div className="stat stat-departments">
            <div className="stat-content">
              <div className="stat-header-row">
                <span className="stat-mini-logo">🏛️</span>
                <span className="stat-name">Active Departments</span>
              </div>
              <h2 className="stat-number">{departmentCount}</h2>
              <div className="stat-sub-text">
                <span className="stat-pulse-dot dot-purple" />
                <span>Academic Faculties</span>
              </div>
            </div>
            <div className="stat-graphic-badge badge-purple">
              <span className="graphic-icon">🏢</span>
              <span className="badge-halo" />
            </div>
          </div>

          <div className="stat stat-verified">
            <div className="stat-content">
              <div className="stat-header-row">
                <span className="stat-mini-logo">🛡️</span>
                <span className="stat-name">Verified Status</span>
              </div>
              <h2 className="stat-number stat-green">100% 2FA</h2>
              <div className="stat-sub-text">
                <span className="stat-pulse-dot dot-green" />
                <span>OTP &amp; QR Authenticated</span>
              </div>
            </div>
            <div className="stat-graphic-badge badge-green">
              <span className="graphic-icon">🔐</span>
              <span className="badge-halo" />
            </div>
          </div>
        </section>

        {/* ADMIN SUB-TABS */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === "students" ? "active" : ""}`}
            onClick={() => setActiveTab("students")}
          >
            🎓 Student Directory & Registration
          </button>
          <button
            className={`admin-tab ${activeTab === "logs" ? "active" : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            📋 Verification Audit Logs ({logs.length})
          </button>
          <button
            className={`admin-tab ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            ⚙️ Admin Accounts & Security
          </button>
        </div>

        {activeTab === "students" && (
          <>
            {/* REGISTRATION & EDIT FORM */}
            <section className="panel">
              {editing && (
                <div className="editing-banner">
                  <div>
                    <span style={{ fontSize: 16 }}>✏️</span>&nbsp;
                    <strong>Editing Student:</strong> {form.name || "Student"} (<code>{form.regNo || "—"}</code>)
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      Modify student contact, academic year, department, section, or photograph. Click &quot;Update Student Details&quot; to apply.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => { setEditing(null); setForm(emptyForm); }}
                    style={{ fontSize: 12, padding: "6px 14px", borderRadius: 20 }}
                  >
                    ✕ Cancel Edit Mode
                  </button>
                </div>
              )}

              <h2>{editing !== null ? "✏️ Update Student Information" : "➕ Register New Student"}</h2>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label>
                    Full Name *
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </label>

                  <label>
                    Registration Number *
                    <input
                      type="text"
                      required
                      placeholder="e.g. 241FA04B53"
                      value={form.regNo}
                      onChange={(e) => setForm({ ...form, regNo: e.target.value.toUpperCase() })}
                      style={{ textTransform: "uppercase" }}
                    />
                  </label>

                  <label>
                    Mobile Number (For SMS OTP) *
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      maxLength="10"
                      placeholder="10-digit registered number"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </label>

                  <label>
                    Email Address (For Email OTP) *
                    <input
                      type="email"
                      required
                      placeholder="student@vignan.ac.in"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </label>

                  <label>
                    Course / Degree *
                    <input
                      type="text"
                      required
                      placeholder="e.g. B.Tech / M.Tech / MBA"
                      value={form.course}
                      onChange={(e) => setForm({ ...form, course: e.target.value })}
                    />
                  </label>

                  <label>
                    Department *
                    <input
                      type="text"
                      required
                      placeholder="e.g. Computer Science & Eng."
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                    />
                  </label>

                  <label>
                    Academic Year *
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2024-2028"
                      value={form.academicYear}
                      onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                    />
                  </label>

                  <label>
                    Section *
                    <input
                      type="text"
                      required
                      placeholder="e.g. A"
                      value={form.section}
                      onChange={(e) => setForm({ ...form, section: e.target.value })}
                    />
                  </label>

                  <label>
                    Date of Birth *
                    <input
                      type="date"
                      required
                      value={form.dob}
                      onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    />
                  </label>

                  <label>
                    ID Card Valid Till *
                    <input
                      type="date"
                      required
                      value={form.validTill}
                      onChange={(e) => setForm({ ...form, validTill: e.target.value })}
                    />
                  </label>
                </div>

                {/* Photo Upload Zone */}
                <div className="photo-zone">
                  <label htmlFor="student-photo" className="photo-zone-label">
                    📷 Student Photograph
                  </label>
                  <input
                    id="student-photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                  <p>Upload JPG/PNG photo up to 20 MB (automatically compressed before saving to MongoDB).</p>

                  {form.photo && (
                    <div className="photo-preview-wrap">
                      <img src={form.photo} alt="Preview" />
                      <div>
                        <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13 }}>
                          ✅ Photograph ready
                        </p>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => setForm({ ...form, photo: "" })}
                        >
                          Remove Photo
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="actions">
                  <button type="submit" className="primary" disabled={saving}>
                    {saving && <span className="spinner" />}
                    {saving ? "Saving…" : editing !== null ? "Update Student" : "Register Student"}
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => { setForm(emptyForm); setEditing(null); }}
                  >
                    Clear Form
                  </button>
                </div>
              </form>
            </section>

            {/* STUDENT RECORDS TABLE */}
            <section className="panel">
              <div className="table-heading">
                <h2>📋 Enrolled Student Records</h2>

                <div className="search-wrap">
                  <svg className="search-icon" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                  </svg>
                  <input
                    className="search"
                    type="text"
                    placeholder="Search by name, reg. no, course or dept…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Student Name</th>
                      <th>Reg. No.</th>
                      <th>Course & Dept</th>
                      <th>Contact (Mobile & Email)</th>
                      <th>Validity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <SkeletonRows />
                    ) : filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <tr key={student._id}>
                          <td>
                            <div className="student-photo-cell">
                              {student.photo ? (
                                <img src={student.photo} alt={student.name} />
                              ) : (
                                <div className="avatar-fallback">🎓</div>
                              )}
                            </div>
                          </td>
                          <td><strong>{student.name}</strong></td>
                          <td><code style={{ fontSize: 12 }}>{student.regNo}</code></td>
                          <td>
                            <div>{student.course || "B.Tech"} - {student.department}</div>
                            <small style={{ color: "#64748b" }}>Sec {student.section} • {student.academicYear || "2024-2028"}</small>
                          </td>
                          <td>
                            <div>📞 {student.phone}</div>
                            <small style={{ color: "#64748b" }}>✉️ {student.email || `${student.regNo.toLowerCase()}@vignan.ac.in`}</small>
                          </td>
                          <td>
                            <span className="card-field-badge">{student.validTill || "2028-06-30"}</span>
                          </td>
                          <td className="row-actions">
                            <button className="btn-idcard" onClick={() => setSelected(student._id)}>
                              🪪 ID Card
                            </button>
                            <button className="btn-edit" onClick={() => editStudent(student)}>
                              ✏️ Edit
                            </button>
                            <button className="btn-delete" onClick={() => deleteStudent(student._id)}>
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="empty">
                          <span className="empty-icon">🔍</span>
                          No student records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ID CARD PREVIEW PANEL */}
            {selectedStudent && (
              <section className="panel" id="id-card-section" style={{ textAlign: "center" }}>
                <div className="table-heading" style={{ justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 20 }}>
                  <h2 style={{ margin: 0 }}>🪪 Generated Student ID Card</h2>
                  <button className="secondary" onClick={() => setSelected(null)}>
                    ✕ Close
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", margin: "0 auto" }}>
                  <StudentIdCard student={selectedStudent} />
                </div>

                <div className="actions" style={{ justifyContent: "center", gap: 12, marginTop: 24 }}>
                  <button className="primary print-btn" onClick={() => window.print()}>
                    🖨️ Print Student ID Card
                  </button>
                  <button className="secondary" onClick={() => setSelected(null)}>
                    ✕ Close Preview
                  </button>
                </div>
              </section>
            )}
          </>
        )}

        {/* TAB 2: VERIFICATION AUDIT LOGS */}
        {activeTab === "logs" && (
          <section className="panel">
            <div className="table-heading">
              <h2>📋 Student ID Verification Audit Records</h2>
              <button className="secondary" onClick={fetchLogs} disabled={logsLoading}>
                🔄 Refresh Logs
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Student Reg. No</th>
                    <th>Student Name</th>
                    <th>Method</th>
                    <th>Contact Target</th>
                    <th>Result Status</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading ? (
                    <tr><td colSpan="7" className="empty">Loading audit logs…</td></tr>
                  ) : logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log._id}>
                        <td>{new Date(log.createdAt).toLocaleString()}</td>
                        <td><code>{log.regNo}</code></td>
                        <td>{log.studentName || "—"}</td>
                        <td>{log.method === "email" ? "✉️ Email" : "📱 SMS"}</td>
                        <td>{log.contactMasked || "—"}</td>
                        <td>
                          <span className={`log-status-pill ${log.status === "SUCCESS" ? "success" : "failed"}`}>
                            {log.status}
                          </span>
                        </td>
                        <td><small style={{ color: "#64748b" }}>{log.ipAddress}</small></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="empty">
                        <span className="empty-icon">📝</span>
                        No verification attempts logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 3: ADMIN ACCOUNTS & SECURITY */}
        {activeTab === "admin" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* CURRENT LOGGED-IN ADMIN PROFILE */}
            <section className="panel">
              <h2>👤 Administrator Session Details</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 12 }}>
                <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Signed In As</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginTop: 2 }}>
                    {adminAuth?.admin?.username}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Administrator Name</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginTop: 2 }}>
                    {adminAuth?.admin?.name || "System Administrator"}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Role / Privileges</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#059669", marginTop: 2 }}>
                    🛡️ {(adminAuth?.admin?.role || "admin").toUpperCase()}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Access Control</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#2563eb", marginTop: 2 }}>
                    Full Management & Editing
                  </div>
                </div>
              </div>
            </section>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
              {/* CHANGE ADMIN PASSWORD */}
              <section className="panel">
                <h2>🔐 Update Your Password</h2>
                <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
                  <label>
                    Current Password
                    <input
                      type="password"
                      required
                      placeholder="Enter existing password"
                      value={pwForm.currentPassword}
                      onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    />
                  </label>
                  <label>
                    New Password (min 6 chars)
                    <input
                      type="password"
                      required
                      placeholder="Enter new secure password"
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    />
                  </label>
                  <label>
                    Confirm New Password
                    <input
                      type="password"
                      required
                      placeholder="Confirm new password"
                      value={pwForm.confirmPassword}
                      onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    />
                  </label>
                  <button type="submit" className="primary" disabled={pwSaving} style={{ marginTop: 8 }}>
                    {pwSaving ? "Updating Password..." : "💾 Save New Password"}
                  </button>
                </form>
              </section>

              {/* CREATE NEW ADMIN ACCOUNT */}
              <section className="panel">
                <h2>➕ Add New Administrator</h2>
                <p style={{ fontSize: 13, color: "#64748b", margin: "-12px 0 16px" }}>
                  Add authorized university staff who can maintain the board and edit student details.
                </p>
                <form onSubmit={handleCreateAdmin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <label>
                    Admin Username *
                    <input
                      type="text"
                      required
                      placeholder="e.g. exams_officer"
                      value={newAdmin.username}
                      onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value.toLowerCase().trim() })}
                    />
                  </label>
                  <label>
                    Full Name *
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. K. Ramesh"
                      value={newAdmin.name}
                      onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    />
                  </label>
                  <label>
                    Initial Password *
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    />
                  </label>
                  <label>
                    Role / Clearance
                    <select
                      value={newAdmin.role}
                      onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                      style={{ padding: 12, borderRadius: 10, border: "1.5px solid #cbd5e1", fontSize: 14 }}
                    >
                      <option value="admin">Administrator (Add/Edit Students, Cards & Logs)</option>
                      <option value="superadmin">Superadmin (Full System Access)</option>
                    </select>
                  </label>
                  <button type="submit" className="primary" disabled={newAdminSaving} style={{ marginTop: 8 }}>
                    {newAdminSaving ? "Creating Admin..." : "➕ Create Administrator Account"}
                  </button>
                </form>
              </section>
            </div>

            {/* QR CODE NETWORK & DIFFERENT IP CONFIGURATION */}
            <section className="panel" style={{ borderLeft: "5px solid #2563eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: 20, color: "#1e3a8a", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>🌐</span> QR Code Target URL &amp; Multi-IP Network Setup
                  </h2>
                  <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                    Configure the exact IP address or domain embedded inside all student ID card QR codes so mobile cameras can scan and verify across any Wi-Fi, hotspot, or 4G/5G network.
                  </p>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: "#eff6ff", border: "1.5px solid #bfdbfe", fontSize: 12, fontWeight: 800, color: "#1d4ed8" }}>
                  <span>🎯 Active QR Target:</span>
                  <code>{getQrBaseUrl()}</code>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: 18, borderRadius: 14, border: "1px solid #e2e8f0" }}>
                <label style={{ display: "block", fontWeight: 800, fontSize: 13, color: "#1e293b", marginBottom: 8 }}>
                  Custom Target Host (Change if switching Wi-Fi, using mobile hotspot, or cloud tunnel)
                </label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <input
                    type="url"
                    placeholder="e.g. http://192.168.1.45:5173 or https://vignan-id.loca.lt"
                    value={customQrHost}
                    onChange={(e) => setCustomQrHost(e.target.value)}
                    style={{ flex: 1, minWidth: 260 }}
                  />
                  <button
                    type="button"
                    className="primary"
                    onClick={() => {
                      if (customQrHost.trim()) {
                        localStorage.setItem("vignan_custom_qr_host", customQrHost.trim());
                        addToast("QR Code target URL updated to " + customQrHost.trim() + "!", "success");
                      } else {
                        localStorage.removeItem("vignan_custom_qr_host");
                        addToast("Reset to automatic IP detection!", "info");
                      }
                    }}
                  >
                    💾 Save Target URL
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setCustomQrHost("");
                      localStorage.removeItem("vignan_custom_qr_host");
                      addToast("Reset to default Wi-Fi IP!", "info");
                    }}
                  >
                    🔄 Auto-Detect
                  </button>
                </div>

                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px dashed #cbd5e1", fontSize: 12.5, color: "#475569" }}>
                  <strong style={{ color: "#0f172a" }}>💡 One-Click Network Presets:</strong>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="primary"
                      style={{ fontSize: 11.5, padding: "6px 14px", borderRadius: 8, background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
                      onClick={() => {
                        const target = PUBLIC_TUNNEL_URL;
                        setCustomQrHost(target);
                        localStorage.setItem("vignan_custom_qr_host", target);
                        addToast("Active! QR Codes now work on ANY mobile phone (4G/5G / Any Network)!", "success");
                      }}
                    >
                      🌍 Global Cloudflare Tunnel (4G/5G Anywhere)
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      style={{ fontSize: 11.5, padding: "6px 12px", borderRadius: 8 }}
                      onClick={() => {
                        const target = "http://192.168.0.162:5173";
                        setCustomQrHost(target);
                        localStorage.setItem("vignan_custom_qr_host", target);
                        addToast("Target set to current Wi-Fi LAN IP!", "success");
                      }}
                    >
                      📡 Local Wi-Fi (192.168.0.162:5173)
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      style={{ fontSize: 11.5, padding: "6px 12px", borderRadius: 8 }}
                      onClick={() => {
                        const target = window.location.origin;
                        setCustomQrHost(target);
                        localStorage.setItem("vignan_custom_qr_host", target);
                        addToast("Target set to Browser Origin (" + target + ")!", "success");
                      }}
                    >
                      🖥️ Match Browser URL ({window.location.origin})
                    </button>
                  </div>
                  <small style={{ display: "block", marginTop: 8, color: "#64748b" }}>
                    ℹ️ <strong>For 4G/5G mobile phones on different networks:</strong> Use a free tunnel (like Ngrok, Localtunnel, or Cloudflare) or deploy to Vercel/Render, then paste the public URL above.
                  </small>
                </div>
              </div>
            </section>

            {/* REGISTERED ADMINISTRATORS LIST */}
            <section className="panel">
              <div className="table-heading">
                <h2>👥 Registered University Administrators</h2>
                <button className="secondary" onClick={fetchAdmins} disabled={adminsLoading}>
                  🔄 Refresh List
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Full Name</th>
                      <th>Role</th>
                      <th>Account Created</th>
                      <th>Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminsLoading ? (
                      <tr><td colSpan="5" className="empty">Loading admin accounts…</td></tr>
                    ) : admins.length > 0 ? (
                      admins.map((adm) => (
                        <tr key={adm._id}>
                          <td><strong><code>{adm.username}</code></strong></td>
                          <td>{adm.name}</td>
                          <td>
                            <span className="log-status-pill success">
                              {adm.role.toUpperCase()}
                            </span>
                          </td>
                          <td>{new Date(adm.createdAt).toLocaleDateString()}</td>
                          <td>{adm.lastLogin ? new Date(adm.lastLogin).toLocaleString() : "Never"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" className="empty">No admins found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer>
        <span>🏛️ Vignan&apos;s Foundation for Science, Technology & Research (Deemed to be University)</span>
      </footer>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   MAIN APP ROUTER (Switches between Verification Portal, Login & Admin Board)
────────────────────────────────────────────────────────── */
function App() {
  const getInitialState = () => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token") || "";
      const isVerify =
        path.includes("/verify") ||
        params.get("verify") !== null ||
        token.length > 0;
      const isAdminRoute = path.includes("/admin");

      return { isVerify, token, isAdminRoute };
    }
    return { isVerify: false, token: "", isAdminRoute: false };
  };

  const initial = getInitialState();

  // Admin session stored in localStorage
  const [adminAuth, setAdminAuth] = useState(() => {
    try {
      const saved = localStorage.getItem("vignan_admin_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [view, setView] = useState(() => {
    if (initial.isVerify) return "verify";
    if (initial.isAdminRoute) return adminAuth ? "admin" : "login";
    return adminAuth ? "admin" : "verify";
  });

  const [urlToken, setUrlToken] = useState(initial.token);

  // Validate admin session on mount
  useEffect(() => {
    if (adminAuth?.token) {
      fetch(`${getApiBase()}/admin/me`, {
        headers: { Authorization: `Bearer ${adminAuth.token}` },
      })
        .then((res) => {
          if (!res.ok) {
            handleLogout();
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const state = getInitialState();
      if (state.isVerify) {
        setView("verify");
        setUrlToken(state.token);
      } else if (state.isAdminRoute) {
        setView(adminAuth ? "admin" : "login");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [adminAuth]);

  const handleLoginSuccess = (token, admin) => {
    const session = { token, admin };
    localStorage.setItem("vignan_admin_session", JSON.stringify(session));
    setAdminAuth(session);
    setView("admin");
    window.history.pushState({}, "", "/admin");
  };

  const handleLogout = () => {
    if (adminAuth?.token) {
      fetch(`${getApiBase()}/admin/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminAuth.token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("vignan_admin_session");
    setAdminAuth(null);
    setView("login");
    window.history.pushState({}, "", "/admin");
  };

  const handleGoToAdmin = () => {
    if (adminAuth?.token) {
      setView("admin");
      window.history.pushState({}, "", "/admin");
    } else {
      setView("login");
      window.history.pushState({}, "", "/admin");
    }
  };

  const handleGoToVerify = () => {
    setView("verify");
    setUrlToken("");
    window.history.pushState({}, "", "/verify");
  };

  if (view === "login") {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        onCancel={handleGoToVerify}
      />
    );
  }

  if (view === "admin") {
    if (!adminAuth) {
      return (
        <AdminLogin
          onLoginSuccess={handleLoginSuccess}
          onCancel={handleGoToVerify}
        />
      );
    }
    return (
      <AdminDashboard
        adminAuth={adminAuth}
        onLogout={handleLogout}
        onOpenVerificationPortal={handleGoToVerify}
      />
    );
  }

  return (
    <VerificationPortal
      tokenFromUrl={urlToken}
      onGoToAdmin={handleGoToAdmin}
    />
  );
}

export default App;
