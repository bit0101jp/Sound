let count;
let scene;
let width;
let height;
let camera;
let renderer;
let isPlaying;
let audioCtx;
let audioSrc;
let audioBufferSrc;
let audioAnalyser;
let waveArray;

let sphere = [];
const sphereNum = 10;

window.addEventListener("load", () => {
  initScene();
  initCamera();
  initLight();
  initRenderer();
  initObject();

  count = 0;
  renderer.render(scene, camera);

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

function initScene(){
  width = window.innerWidth;
  height = window.innerHeight;

  scene = new THREE.Scene();
}

function initCamera(){
  camera = new THREE.PerspectiveCamera(
              60,
              width / height,
              0.1,
              2000
  );
  camera.position.z = 1200;
}

function initLight(){
  // AmbientLight
  const ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  // SpotLight
  const spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(-400, 1000, 200);
  spotLight.castShadow = true;
//  spotLight.angle = THREE.Math.degToRad(45);
//  spotLight.target = cubeCore;
  // spotLight.distance = 1400;
  // spotLight.penumbra = 0.01;
  scene.add(spotLight);
}

function initRenderer(){
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

  // レンダラーのサイズを調整する
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);

  // レンダラーの背景色を設定
  renderer.setClearColor(0x000000, 0.0);

  // bodyにレンダラーを配置
  document.body.appendChild(renderer.domElement);
}

function initObject(){
  // 半径、経度分割数、緯度分割数
  const sphereGeometry = new THREE.SphereGeometry(30, 24, 24);

  for (let i = 0; i < sphereNum; i++){
    // roughnessは光沢感有無の調整。0:光沢感、1:マット感
    const sphererMaterial = new THREE.MeshStandardMaterial({color: 0x6699FF, roughness:0.1});
    sphere[i] = new THREE.Mesh(sphereGeometry, sphererMaterial);
    sphere[i].position.x = i * 60;
    sphere[i].position.y = 3;
    sphere[i].position.z = 0;

    scene.add(sphere[i]);
  }
}

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
  amplitude = Math.pow(maxValue, 2) + 0.0;
  console.log("maxValue: " + maxValue + "  amplitude: " + amplitude);

  count++;
//  if (count % 10 == 0){
//  cube.rotation.z += (0.0010 + amplitude);
//    for (let i = 0; i < sphereNum; i++){
      let index = parseInt(Math.random() * sphereNum);
      sphere[index].scale.x = amplitude * 10;
      sphere[index].scale.y = amplitude * 10;
//        sphere[i].position.x += amplitude * 10;
//    }
//    console.log(cube.position.x);
    renderer.render(scene, camera);
//  }

  requestAnimationFrame(playAudio);
};

function onClick(buffer){
  setAudio(buffer);
  playAudio();
};
