import * as THREE from "three"
import {TextGeometry} from "three/addons/geometries/TextGeometry.js";

// 创建场景
var scene = new THREE.Scene();

// 创建相机
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// 创建渲染器
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 创建文字材质
var textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

// 创建文字几何体
var textGeometry = new THREE.TextGeometry('Hello, Three.js!', {
    font: 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', // 字体文件路径
    size: 0.5,  // 文字大小
    height: 0.1, // 文字高度
});

// 创建文字Mesh
var textMesh = new THREE.Mesh(textGeometry, textMaterial);

// 添加文字Mesh到场景
scene.add(textMesh);

// 渲染循环
var animate = function () {
    requestAnimationFrame(animate);

    // 旋转文字Mesh
    textMesh.rotation.x += 0.01;
    textMesh.rotation.y += 0.01;

    renderer.render(scene, camera);
};

animate();
