export function drawWave(canvas, audio) {
  const ctx = canvas.getContext("2d");
  const actx = new AudioContext();
  const src = actx.createMediaElementSource(audio);
  const analyser = actx.createAnalyser();
  src.connect(analyser);
  analyser.connect(actx.destination);

  analyser.fftSize = 256;
  const data = new Uint8Array(analyser.frequencyBinCount);

  function render() {
    requestAnimationFrame(render);
    analyser.getByteFrequencyData(data);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    data.forEach((v,i)=>{
      ctx.fillRect(i*3,canvas.height-v/2,2,v/2);
    });
  }
  render();
}
