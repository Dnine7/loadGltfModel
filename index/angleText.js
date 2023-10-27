import * as THREE from "three"
import {OrbitControls} from "three/addons/controls/OrbitControls.js"
// 1. 导入Three.js库并设置场景、相机、渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
//添加光源
const ambient = new THREE.AmbientLight(0xffffff, 1);//环境光
scene.add(ambient);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);//平行光
directionalLight.position.set(100, 200, 150);
scene.add(directionalLight);
// 2. 设置场景背景色为灰色
scene.background = new THREE.Color(0xCCCCCC);

// 3. 创建一个控制器以实现视角旋转
const controls = new OrbitControls(camera, renderer.domElement);

// 4. 创建3D模型并添加到场景中
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    depthTest: false, // 禁用深度测试
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
const vertices = cube.geometry.attributes.position.array;

// 5. 添加交互功能以选择两个点
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedPoints = [];
let isFirstPointSelected = false;

document.addEventListener('mousedown', onMouseDown, false);
const pointGeometry = new THREE.SphereGeometry(0.02, 32, 32);
const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
const point1Mesh = new THREE.Mesh(pointGeometry, pointMaterial);
const point2Mesh = new THREE.Mesh(pointGeometry, pointMaterial);
const point3Mesh = new THREE.Mesh(pointGeometry, pointMaterial);
let lineMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000,
});
let lineGeometry = new THREE.BufferGeometry();
let line = new THREE.Line(lineGeometry, lineMaterial);
point1Mesh.visible = false;
point2Mesh.visible = false;
point3Mesh.visible = false;
line.visible = false;
let pointMesh = [point1Mesh, point2Mesh, point3Mesh];

scene.add(point1Mesh);
scene.add(point2Mesh);
scene.add(point3Mesh);
// 3D模型的顶点数组
function onMouseDown(event) {
    // 获取鼠标点击位置
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // 设置射线的起点和方向
    raycaster.setFromCamera(mouse, camera);

    // 计算射线和模型的交点
    const intersects = raycaster.intersectObject(cube);

    if (intersects.length > 0) {
        const closestVertex = findClosestVertex(intersects[0].point, vertices);
        console.log(`最近的顶点坐标: (${closestVertex.x}, ${closestVertex.y}, ${closestVertex.z})`);
        const selectedPoint = closestVertex;
        selectedPoints.push(selectedPoint);
        const num = selectedPoints.length
        // 显示第一个点
        if (num < 3) {
            pointMesh[num - 1].position.copy(selectedPoint);
            pointMesh[num - 1].visible = true;
            for (let i = num; i < 3; i++) {
                console.log("隐藏", i);
                pointMesh[i].visible = false;
            }
            line.visible = false;
        } else {
            // 6. 计算所选点之间的距离
            if (num === 3) {
                // const distance = selectedPoints[0].distanceTo(selectedPoints[1]);
                point3Mesh.position.copy(selectedPoints[2]);
                point3Mesh.visible = true;
                const vectorAB = new THREE.Vector3().copy(selectedPoints[1]).sub(selectedPoints[0]).normalize();
                const vectorBC = new THREE.Vector3().copy(selectedPoints[1]).sub(selectedPoints[2]).normalize();
                console.log(vectorAB, vectorBC);
                const angleRadians = Math.acos(vectorAB.dot(vectorBC));
                const angleDegrees = THREE.MathUtils.radToDeg(angleRadians).toFixed(2);
                console.log(`弧度: ${angleRadians}`);
                console.log(`角度: ${angleDegrees}`);

                // 7. 创建连接线
                lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
                lineGeometry = new THREE.BufferGeometry().setFromPoints(selectedPoints);
                line = new THREE.Line(lineGeometry, lineMaterial);
                line.renderOrder = 1;
                scene.add(line);
                // 清空已选择的点
                selectedPoints = [];
                selectedPoints.length = 0;
            }
        }
    }
}

// 寻找最近的顶点
function findClosestVertex(point, vertices) {
    let closestVertex = new THREE.Vector3();
    let minDistance = Number.MAX_VALUE;
    for (let i = 0; i < vertices.length; i += 3) {
        const vertex = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
        const distance = point.distanceTo(vertex);

        if (distance < minDistance) {
            minDistance = distance;
            closestVertex = vertex.clone();
        }
    }
    return closestVertex;
}

// 8. 设置相机位置和渲染循环
camera.position.z = 5;

const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update(); // 更新控制器
};

animate();
