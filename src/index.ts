/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
import * as BABYLON from 'babylonjs';
import * as ZapparBabylon from '@zappar/zappar-babylonjs';
import model from '../assets/ghost.glb';
import 'babylonjs-loaders';
import './index.sass';
import particle from '../assets/particle.png';
// Model from https://sketchfab.com/3d-models/wizardy-ghost-91f9df6880f8492cb222d91b9fbd1434

// The SDK is supported on many different browsers, but there are some that
// don't provide camera access. This function detects if the browser is supported
// For more information on support, check out the readme over at
// https://www.npmjs.com/package/@zappar/zappar-babylonjs
if (ZapparBabylon.browserIncompatible()) {
  // The browserIncompatibleUI() function shows a full-page dialog that informs the user
  // they're using an unsupported browser, and provides a button to 'copy' the current page
  // URL so they can 'paste' it into the address bar of a compatible alternative.
  ZapparBabylon.browserIncompatibleUI();

  // If the browser is not compatible, we can avoid setting up the rest of the page
  // so we throw an exception here.
  throw new Error('Unsupported browser');
}

// Setup BabylonJS in the usual way
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const engine = new BABYLON.Engine(canvas, true);

const scene = new BABYLON.Scene(engine);
// eslint-disable-next-line no-unused-vars
const light = new BABYLON.DirectionalLight('dir02', new BABYLON.Vector3(0, 0, -1), scene);
light.position = new BABYLON.Vector3(0, 1, -10);

const light1 = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(1, -1, 0), scene);
// Setup a Zappar camera instead of one of Babylon's cameras
const camera = new ZapparBabylon.Camera('zapparCamera', scene);

// Request the necessary permission from the user
ZapparBabylon.permissionRequestUI().then((granted) => {
  if (granted) camera.start();
  else ZapparBabylon.permissionDeniedUI();
});

const instantTracker = new ZapparBabylon.InstantWorldTracker();
// eslint-disable-next-line max-len
const trackerTransformNode = new ZapparBabylon.InstantWorldAnchorTransformNode('tracker', camera, instantTracker, scene);

let mesh : BABYLON.AbstractMesh | undefined;

BABYLON.SceneLoader.ImportMesh(null, '', model, scene, (meshes) => {
  [mesh] = meshes;
  // Create a particle system
  const particleSystem = new BABYLON.ParticleSystem('particles', 100, scene);
  particleSystem.particleTexture = new BABYLON.Texture(particle, scene);
  particleSystem.emitter = mesh;
  particleSystem.isLocal = true;
  // Colors of all particles
  particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
  particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
  particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);

  // Size of each particle (random between...
  particleSystem.minSize = 0.1;
  particleSystem.maxSize = 0.5;

  // Life time of each particle (random between...
  particleSystem.minLifeTime = 1;
  particleSystem.maxLifeTime = 3;

  // Emission rate
  particleSystem.emitRate = 1000;

  particleSystem.minInitialRotation = 0;
  particleSystem.maxInitialRotation = Math.PI;
  /** ***** Emission Space ******* */
  particleSystem.createSphereEmitter(2);

  // Speed
  particleSystem.minEmitPower = 1;
  particleSystem.maxEmitPower = 20;
  particleSystem.updateSpeed = 0.005;
  particleSystem.worldOffset = new BABYLON.Vector3(0, 1.2, 0);
  particleSystem.start();

  mesh.rotationQuaternion = null;
  mesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);

  mesh.parent = trackerTransformNode;
  light.setDirectionToTarget(mesh.absolutePosition);
});

window.addEventListener('resize', () => {
  engine.resize();
});

let hasPlaced = false;
const placeButton = document.getElementById('tap-to-place') || document.createElement('div');
placeButton.addEventListener('click', () => {
  hasPlaced = true;
  placeButton.remove();
});
let alpha = 0;
engine.runRenderLoop(() => {
  if (scene.isReady()) {
    placeButton.innerHTML = 'Tap to place';
  }
  if (!hasPlaced) {
    instantTracker.setAnchorPoseFromCameraOffset(0, 0, -10);
  }

  if (mesh && hasPlaced) {
    alpha += 0.01;
    mesh.position = new BABYLON.Vector3(Math.cos(alpha) * 0.4, Math.sin(alpha), 0);
  }
  camera.updateFrame();
  scene.render();
});
