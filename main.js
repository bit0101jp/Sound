let count;
let scene;
let camera;
let renderer;
let cube;
let isPlaying;
let audioCtx;
let audioSrc;
let audioBufferSrc;
let audioAnalyser;
let waveArray;

window.addEventListener("load", () => {

  // カメラ、レンダラー、オブジェクトの生成
  initThree();

  // 再生OFFにセット
  isPlaying = false;

  document.getElementById("text-button").onclick = function() {
    // サウンド再生中なら多重再生しない
    if (isPlaying) return;

    initAudio().then(buffer => {
      onClick(buffer);
    });
  };
});

function initThree(){
  let width = window.innerWidth;
  let height = window.innerHeight;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
              60,
              width / height,
              0.1,
              1000
  );
  camera.position.z = 200;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

  // レンダラーのサイズを調整する
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);

  // レンダラーの背景色を設定
  renderer.setClearColor(0x000000, 1.0);

  // bodyにレンダラーを配置
  document.body.appendChild(renderer.domElement);

  let cubeGeometry= new THREE.BoxGeometry(4, 4, 4);
  let cubeMaterial = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: false});
  cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

  cube.position.x = -4;
  cube.position.y = 3;
  cube.position.z = 0;

  scene.add(cube);

  count = 0;
  renderer.render(scene, camera);
};

function initAudio(){
  return new Promise(resolve => {
    // AudioContextの作成(Chorme, FireFox, Safari)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // サウンドデータURL
    audioSrc = "https://dl.dropbox.com/s/au8wwx2h1hridta/Calvin%20Harris%20-%20josh%20pan.mp3?dl=0";

    // AudioBufferSourceNodeの作成
    audioBufferSrc = audioCtx.createBufferSource();

    // 高速フーリエ変換を行うためAnalyserNodeの作成
    audioAnalyser = audioCtx.createAnalyser();

    // Ajaxを利用してサウンドデータを取得
    let request = new XMLHttpRequest();
    request.open("GET", audioSrc, true);
    request.responseType = "arraybuffer";

    // サウンドデータ取得後、デコードしてbufferに渡す
    request.onload = function() {
      audioCtx.decodeAudioData(request.response, buffer => resolve(buffer));
    };
    request.send();
  });
}

function setAudio(buffer){
  // 0に近いほど描画の更新がスムーズになる(最大値1.0)
  audioAnalyser.smoothingTimeConstant = 0.0;

  // 取得するデータのサイズを決める(デフォルト2048)
  audioAnalyser.fftSize = 2048;

  // 取得したサウンドデータを入力点となるAudioBufferSourceNodeに設定
  audioBufferSrc.buffer = buffer;

  // サウンドがループするように設定
  audioBufferSrc.loop = true;

  // 時間領域の波形データを格納する配列を作成
  let bufferLength =  audioAnalyser.frequencyBinCount;
  waveArray = new Uint8Array(bufferLength);

  // AudioBufferSourceNodeをAnalyserNodeに接続
  audioBufferSrc.connect(audioAnalyser);

  // AnalyserNodeを出力点となるAudioDestinationNodeに接続
  audioAnalyser.connect(audioCtx.destination);

  // サウンド再生開始
  audioBufferSrc.start();
};

function playAudio(){
  // サウンド再生中ON
  isPlaying = true;

  // 時間領域の波形データを取得して配列に格納
  // (analyserNode.fftSize / 2の要素がwaveArrayに格納される)
  audioAnalyser.getByteTimeDomainData(waveArray);

  // この実行時点での波形データの最大値を取得する
  let maxValue = waveArray.reduce((a, b) => Math.max(a, b));

  // 最大値が255なので、0 - 255 の値を正規化
  maxValue = maxValue / 255;

  // を2乗して 0.5 以上になるよう調整する
//  amplitude = Math.pow(maxValue, 2) + 0.5;
  amplitude = Math.pow(maxValue, 1) + 0.0;
  console.log("amplitude: " + amplitude);

  count++;
//  if (count % 10 == 0){
//  cube.rotation.z += (0.0010 + amplitude);
    cube.scale.x = (0.0000 + amplitude * 10);
    cube.scale.y = (0.0000 + amplitude * 10);
//    console.log(cube.position.x);
    renderer.render(scene, camera);
//  }

  requestAnimationFrame(playAudio);
};

function onClick(buffer){
  setAudio(buffer);
  playAudio();
};
