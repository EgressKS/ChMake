import { create } from 'zustand';

export interface WebRTCState {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isConnected: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  error: string | null;
  activeSpeaker: string | null;
  setMuted: (muted: boolean) => void;

  // Actions
  initializeLocalStream: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  addRemoteStream: (userId: string, stream: MediaStream) => void;
  removeRemoteStream: (userId: string) => void;
  cleanup: () => void;
}

export const useWebRTCStore = create<WebRTCState>((set, get) => ({
  localStream: null,
  remoteStreams: new Map(),
  isConnected: false,
  isMuted: false,
  isVideoEnabled: true,
  error: null,
  activeSpeaker: null,
  setMuted: (muted: boolean) => set({ isMuted: muted }),

  initializeLocalStream: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      set({
        localStream: stream,
        isConnected: true,
        error: null
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to access media devices'
      });
    }
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      set({ isMuted: !isMuted });
    }
  },

  toggleVideo: () => {
    const { localStream, isVideoEnabled } = get();
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isVideoEnabled;
      });
      set({ isVideoEnabled: !isVideoEnabled });
    }
  },

  addRemoteStream: (userId: string, stream: MediaStream) => {
    const { remoteStreams } = get();
    const newStreams = new Map(remoteStreams);
    newStreams.set(userId, stream);
    set({ remoteStreams: newStreams });
  },

  removeRemoteStream: (userId: string) => {
    const { remoteStreams } = get();
    const newStreams = new Map(remoteStreams);
    newStreams.delete(userId);
    set({ remoteStreams: newStreams });
  },

  cleanup: () => {
    const { localStream, remoteStreams } = get();

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    // Stop all remote streams
    remoteStreams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });

    set({
      localStream: null,
      remoteStreams: new Map(),
      isConnected: false,
      isMuted: false,
      isVideoEnabled: true,
      error: null
    });
  },
}));
