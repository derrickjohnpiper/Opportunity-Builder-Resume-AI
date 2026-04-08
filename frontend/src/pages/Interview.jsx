import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Loader2, Mic, MicOff, VideoOff, Check, X } from 'lucide-react';
import { toast, Toaster } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Interview() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [jobTitle, setJobTitle] = useState('Software Engineer');
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(prev => prev + ' ' + currentTranscript);
      };
    }

    return () => stopMedia();
  }, []);

  const stopMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const startInterview = async () => {
    setLoading(true);
    try {
      // Start camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      const res = await axios.post(`${API}/interview/start`, { job_title: jobTitle });
      setSession({ id: res.data.session_id, question: res.data.first_question, qNum: 1 });
    } catch (err) {
      toast.error('Failed to start camera or interview session.');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Speech Recognition not supported in this browser. Try Chrome.");
      return;
    }
    setTranscript('');
    setFeedback(null);
    recognitionRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current.stop();
    setIsRecording(false);
  };

  const submitAnswer = async () => {
    if (!transcript.trim()) {
      toast.error('Please record your answer first.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/interview/${session.id}/answer`, { answer: transcript });
      setFeedback({ score: res.data.score, text: res.data.feedback });
      
      if (!res.data.is_complete) {
        setSession(prev => ({ ...prev, question: res.data.next_question, qNum: prev.qNum + 1 }));
        setTranscript('');
      } else {
        toast.success("Interview Completed!");
        setSession(null);
        stopMedia();
      }
    } catch (err) {
      toast.error('Failed to submit answer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col">
      <Toaster position="top-right" />
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Mock Interview</h1>
          <p className="text-muted-foreground mt-1">Simulate a video call with our AI Career Coach.</p>
        </div>
      </div>

      {!session && !feedback && (
        <div className="bg-white border border-border p-8 rounded-md shadow-sm max-w-xl mx-auto mt-12 text-center">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <VideoOff size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-4">Start Your Mock Interview</h2>
          <p className="text-muted-foreground mb-6">You will need to allow camera and microphone access. The AI agent will analyze your tone and answer quality.</p>
          
          <input 
            type="text" 
            value={jobTitle} 
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-4 py-2 mb-6 text-center focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="Role (e.g. Software Engineer)"
          />
          
          <button 
            onClick={startInterview}
            disabled={loading}
            className="bg-primary text-white px-8 py-3 rounded-md font-medium hover:bg-primary-hover transition-colors flex items-center justify-center mx-auto gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <VideoOff />}
            Connect to Interview Room
          </button>
        </div>
      )}

      {(session || feedback) && (
        <div className="relative w-full max-w-5xl mx-auto rounded-lg overflow-hidden bg-black/90 aspect-video shadow-2xl flex-1 max-h-[70vh]">
          {/* Camera Feed */}
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          
          {/* Agent Question Panel */}
          {session && (
            <div className="absolute top-6 left-6 max-w-md backdrop-blur-xl bg-black/60 border border-white/20 rounded-md p-6 text-white shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1770233621425-5d9ee7a0a700?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwxfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwYnJhaW4lMjBhYnN0cmFjdHxlbnwwfHx8fDE3NzU2NDU0MTB8MA&ixlib=rb-4.1.0&q=85" 
                  className="w-12 h-12 rounded-full border-2 border-primary object-cover" 
                  alt="AI Agent"
                />
                <div>
                  <p className="font-bold text-lg leading-none text-white">AI Coach</p>
                  <p className="text-xs text-white/70">Question {session.qNum} of 5</p>
                </div>
              </div>
              <p className="text-sm font-medium leading-relaxed">{session.question}</p>
            </div>
          )}

          {/* Feedback Panel */}
          {feedback && (
            <div className="absolute top-6 right-6 backdrop-blur-xl bg-white/95 border border-black/10 rounded-md p-6 w-80 shadow-2xl animate-in slide-in-from-right-8 duration-500">
              <h3 className="font-bold text-lg mb-2 text-foreground">Immediate Feedback</h3>
              <div className="flex items-end gap-2 mb-4">
                <span className={`text-3xl font-bold leading-none ${feedback.score >= 8 ? 'text-accent-success' : feedback.score >= 5 ? 'text-accent-warning' : 'text-destructive'}`}>
                  {feedback.score}
                </span>
                <span className="text-muted-foreground font-medium mb-1">/ 10</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{feedback.text}</p>
              
              <button 
                onClick={() => setFeedback(null)}
                className="w-full mt-6 bg-primary text-white py-2 rounded-md font-medium text-sm hover:bg-primary-hover transition-colors"
              >
                Continue Interview
              </button>
            </div>
          )}

          {/* Controls Dock */}
          {!feedback && session && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 backdrop-blur-xl bg-black/60 border border-white/20 rounded-full px-8 py-4 flex items-center gap-6 shadow-2xl">
              
              {isRecording ? (
                <button onClick={stopRecording} className="flex flex-col items-center group">
                  <div className="w-14 h-14 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <MicOff size={24} />
                  </div>
                  <span className="text-xs text-white mt-2 font-medium">Stop</span>
                </button>
              ) : (
                <button onClick={startRecording} className="flex flex-col items-center group">
                  <div className="w-14 h-14 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors shadow-lg group-hover:scale-105">
                    <Mic size={24} />
                  </div>
                  <span className="text-xs text-white mt-2 font-medium">Answer</span>
                </button>
              )}

              <div className="w-px h-12 bg-white/20"></div>

              <button 
                onClick={submitAnswer}
                disabled={loading || isRecording || !transcript}
                className="flex flex-col items-center group disabled:opacity-50"
              >
                <div className="w-14 h-14 bg-accent-success text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  {loading ? <Loader2 className="animate-spin" size={24} /> : <Check size={24} />}
                </div>
                <span className="text-xs text-white mt-2 font-medium">Submit</span>
              </button>

              <button 
                onClick={() => { setSession(null); stopMedia(); }}
                className="flex flex-col items-center group ml-4"
              >
                <div className="w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <X size={18} />
                </div>
                <span className="text-[10px] text-white/70 mt-2">End Call</span>
              </button>

            </div>
          )}

          {/* Subtitles Overlay */}
          {transcript && !feedback && (
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 max-w-2xl w-full px-8 text-center pointer-events-none">
              <p className="bg-black/60 text-white px-4 py-2 rounded text-lg font-medium inline-block shadow-lg">
                {transcript}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}