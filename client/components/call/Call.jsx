import React, { useEffect, useRef } from "react";
import socket from "../../socket";

const Call = ({ roomId }) => {
  const localVideo = useRef();
  const remoteVideo = useRef();
  const peerConnections = useRef({});

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      localVideo.current.srcObject = stream;

      socket.emit("join-call", roomId);

      socket.on("user-joined", async (id) => {
        const pc = new RTCPeerConnection();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          remoteVideo.current.srcObject = event.streams[0];
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("signal", { roomId, data: event.candidate });
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("signal", { roomId, data: offer });

        peerConnections.current[id] = pc;
      });

      socket.on("signal", async ({ id, data }) => {
        let pc = peerConnections.current[id];
        if (!pc) {
          pc = new RTCPeerConnection();
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));

          pc.ontrack = (event) => {
            remoteVideo.current.srcObject = event.streams[0];
          };

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit("signal", { roomId, data: event.candidate });
            }
          };

          peerConnections.current[id] = pc;
        }

        if (data.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("signal", { roomId, data: answer });
        } else if (data.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
        } else if (data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });

    return () => {
      socket.off("user-joined");
      socket.off("signal");
    };
  }, [roomId]);

  return (
    <div>
      <video ref={localVideo} autoPlay muted style={{ width: "300px" }} />
      <video ref={remoteVideo} autoPlay style={{ width: "300px" }} />
    </div>
  );
};

export default Call;
