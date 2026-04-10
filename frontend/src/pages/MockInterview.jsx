import React, { useRef, useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Camera, Mic, PhoneOff, CheckCircle } from 'lucide-react';

export default function MockInterview() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  const startInterview = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setInCall(true);
      setTranscript("Tell me about a time you handled a difficult situation."); // Mock initial Grok question
    } catch (err) {
      console.error("Failed to access media devices", err);
      alert("Please allow camera and microphone permissions to start the mock interview.");
    }
  };

  const endInterview = async () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    setInCall(false);
    
    setFeedback({
      score: 8,
      text: "You maintained good eye contact. Your answer was structured well using the STAR method, but could be slightly more concise. Overall, highly professional."
    });
  };

  return (
    <Layout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Mock Interview Theater
        </h1>
        <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>Simulate a video call interview. Grok will analyze your answers and professional demeanor.</p>

        <div className="glass-panel" style={{ position: 'relative', height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {!inCall && !feedback ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
                <Camera size={48} color="#94a3b8" />
                <Mic size={48} color="#94a3b8" />
              </div>
              <button className="btn-primary" onClick={startInterview} style={{ fontSize: '1.25rem', padding: '1rem 2rem' }}>
                Start Interview
              </button>
            </div>
          ) : inCall ? (
            <>
              <video autoPlay playsInline muted ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
              
              <div style={{ position: 'absolute', top: '2rem', left: '2rem', right: '2rem', background: 'rgba(15, 23, 42, 0.8)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <span style={{ color: '#818cf8', fontWeight: 'bold' }}>Grok: </span>
                {transcript}
              </div>

              <button 
                onClick={endInterview}
                style={{ position: 'absolute', bottom: '2rem', background: '#ef4444', color: 'white', border: 'none', padding: '1rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <PhoneOff size={24} />
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle size={64} color="#10b981" style={{ marginBottom: '1rem' }} />
              <h2>Interview Complete</h2>
              <div style={{ marginTop: '2rem', background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '8px', textAlign: 'left' }}>
                <h3 style={{ color: '#818cf8', marginBottom: '0.5rem' }}>Evaluation Score: {feedback.score}/10</h3>
                <p style={{ color: '#e2e8f0', lineHeight: '1.6' }}>{feedback.text}</p>
              </div>
              <button className="btn-primary" onClick={() => setFeedback(null)} style={{ marginTop: '2rem' }}>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
