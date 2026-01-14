/* ===============================
   AUDIO WAVEFORM VISUALIZER
   =============================== */

export function startWave(audio, canvas) {
  const ctx = canvas.getContext("2d");
  const ac = new AudioContext();
  const src = ac.createMediaElementSource(audio);
  const analyser = ac.createAnalyser();

  src.connect(analyser);
  analyser.connect(ac.destination);

  analyser.fftSize = 64;
  const data = new Uint8Array(analyser.frequencyBinCount);

  function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(data);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    data.forEach((v, i) => {
      ctx.fillStyle = "#00c6ff";
      ctx.fillRect(i * 5, canvas.height - v / 4, 3, v / 4);
    });
  }
  draw();
}
