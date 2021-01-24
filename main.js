let count;
let width;
let height;
let scene;
let camera;
let renderer;
let cube;
let sphereVertices;
let audioCtx;
let audioSrc;
let audioBufferSrc;
let audioAnalyser;
let waveArray;

window.addEventListener("load", () => {
  initThree();

  document.getElementById("text-button").onclick = function() {
    initAudio().then(data => {
      onClick(data);
    });
  };
});


const initThree = () => {
  width = window.innerWidth;
  height = window.innerHeight;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
              45,
              width / height,
              0.1,
              1000
  );
  camera.position.z = 45;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  // デバイスピクセル比に合わせる
  renderer.setPixelRatio(window.devicePixelRatio);

  renderer.setClearColor(0x000000, 0.0);
  renderer.setSize(width, height);
  // body直下にCanvasを配置
  document.body.appendChild(renderer.domElement);

  // create a cube
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

const initAudio = () =>
  new Promise(resolve => {
    // AudioContext の生成(Chorme, FireFox, Safari)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // サウンドデータ
    audioSrc = "https://dl.dropbox.com/s/au8wwx2h1hridta/Calvin%20Harris%20-%20josh%20pan.mp3?dl=0";

    audioBufferSrc = audioCtx.createBufferSource();
    audioAnalyser = audioCtx.createAnalyser();

    let request = new XMLHttpRequest();
    request.open("GET", audioSrc, true);
    request.responseType = "arraybuffer";
    // 取得した音声データをデコード、その後、音声データをこの後の処理に渡す
    request.onload = () => {
      audioCtx.decodeAudioData(request.response, buffer => resolve(buffer));
    };
    request.send();
  });

const setAudio = buffer => {
  audioAnalyser.smoothingTimeConstant = 1.0;

  // fftサイズを指定する
  audioAnalyser.fftSize = 2048;

  // 渡ってきた音声データを音源として設定する
  audioBufferSrc.buffer = buffer;

  // 音源がループするように設定する
  audioBufferSrc.loop = true;

  // 時間領域の波形データを格納する配列を生成
  waveArray = new Uint8Array(audioAnalyser.frequencyBinCount);

  // 音源を波形取得機能に接続
  audioBufferSrc.connect(audioAnalyser);

  // 波形取得機能を出力機能に接続
  audioAnalyser.connect(audioCtx.destination);

  // サウンド再生スタート
  audioBufferSrc.start(0);
};

const playAudio = () => {
  audioAnalyser.getByteTimeDomainData(waveArray);

  // この時点での波形データの最大値を取得する
  let number = waveArray.reduce((a, b) => Math.max(a, b));

  // 0 〜 255の値を正規化
  number = number / 255;

  // を2乗して 0.5 以上になるよう調整する
//  amplitude = Math.pow(number, 2) + 0.5;
  amplitude = Math.pow(number, 1) + 0.0;
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

const onClick = buffer => {
  setAudio(buffer);
  playAudio();
};
