import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import GUI from 'lil-gui';
import smokeVertexShader from './shaders/smoke/vertex.glsl';
import smokeFragmentShader from './shaders/smoke/fragment.glsl';

import { CCapture } from 'ccapture.js-npmfixed';

/**
 * Base
 */
// Debug
const gui = new GUI();

// Video Capture
let isCapturing = false;
let captureStartTime;
let strDownloadMime = 'image/octet-stream';

// GUI controller
const controller = {
	name: 'pattern_',
	startCapture: function () {
		if (!isCapturing) {
			capturer.start();
			isCapturing = true;
			captureStartTime = Date.now(); // reset the capture start time when starting capture
		}
	},
	stopCapture: function () {
		if (isCapturing) {
			capturer.stop();
			capturer.save();
			isCapturing = false;
		}
	},
	saveAsImage: function () {
		let imgData;

		try {
			var strMime = 'image/jpeg';
			imgData = renderer.domElement.toDataURL(strMime);

			saveFile(imgData.replace(strMime, strDownloadMime), `${this.name}.jpg`);
		} catch (e) {
			console.log(e);
			return;
		}
	}
};

const saveFile = function (strData, filename) {
	var link = document.createElement('a');
	if (typeof link.download === 'string') {
		document.body.appendChild(link); //Firefox requires the link to be in the body
		link.download = filename;
		link.href = strData;
		link.click();
		document.body.removeChild(link); //remove the link when done
	} else {
		location.replace(uri);
	}
};

gui.add(controller, 'startCapture').name('Start Capture');
gui.add(controller, 'stopCapture').name('Stop Capture');
gui.add(controller, 'saveAsImage').name('Save As Image');
gui.add(controller, 'name');

// New instance of CCapture with option
const capturer = new CCapture({
	format: 'webm',
	framerate: 60,
	verbose: true,
	name: controller.name
});

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Loaders
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();

// Scene
const scene = new THREE.Scene();

/**
 * Smoke
 */
// Geometry
const smokeGeometry = new THREE.PlaneGeometry(1, 1, 16, 64);
smokeGeometry.scale(2, 2, 0);

const perlinTexture = textureLoader.load('/textures/perlin.png');
perlinTexture.wrapS = THREE.RepeatWrapping;
perlinTexture.wrapT = THREE.RepeatWrapping;

// Material
const smokeMaterial = new THREE.ShaderMaterial({
	vertexShader: smokeVertexShader,
	fragmentShader: smokeFragmentShader,
	side: THREE.DoubleSide,
	// wireframe: true,
	transparent: true,
	depthWrite: false,
	uniforms: {
		uPerlinTexture: new THREE.Uniform(perlinTexture),
		uTime: new THREE.Uniform(0)
	}
});

// Mesh
const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
scene.add(smoke);

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight
};

window.addEventListener('resize', () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 0, 1);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enableZoom = false;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	antialias: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
	const elapsedTime = clock.getElapsedTime();

	// Update smoke
	smokeMaterial.uniforms.uTime.value = elapsedTime;

	// Update controls
	controls.update();

	// Render
	renderer.render(scene, camera);

	// Capture frame
	if (isCapturing) {
		capturer.capture(renderer.domElement);
	}

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();
