import * as THREE from "three"

import {OrbitControls} from "three/addons/controls/OrbitControls.js"

//引入性能监视器stats.js,显示帧率
import Stats from 'three/addons/libs/stats.module.js';
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {DRACOLoader} from "three/addons/loaders/DRACOLoader.js";
import {OBJLoader} from "three/addons/loaders/OBJLoader.js";
import {MTLLoader} from "three/addons/loaders/MTLLoader.js";
import {FBXLoader} from "three/addons/loaders/FBXLoader.js";

//创建stats对象
const stats = new Stats();
//Stats.domElement:web页面上输出计算结果,一个div元素
document.body.appendChild(stats.domElement);

//创建场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff)

// 创建网格模型对象
const geometry = new THREE.BoxGeometry(50, 50, 50);

const gltfPash = '../three.js-master/examples/models/gltf/';
const objPash = '../three.js-master/examples/models/obj/';
const gltfName = 'ferrari.glb';
const objName = 'male02/male02.obj';
const mtllName = 'male02/male02.mtl';
const fbx = "./111.fbx"

let size;

const fbxLoader = new FBXLoader();
fbxLoader.load(fbx,function (o){
    console.log("fbx", o);
    o.rotation.x = -1.6;
    // o.position.x = -500
    // o.position.z = -300
    o.position.y = -18.5
    scene.add(o);
    size = o.getSize();
    console.log("size:" + size);
})



//导入模型
/*const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('../three.js-master/node_modules/three/examples/jsm/libs/draco/');
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.setPath(gltfPash)
    .load(gltfName, function (gltf) {
        console.log("gltf",gltf)
        gltf.scene.rotation.y = Math.PI;
        gltf.scene.scale.set(100, 100, 100)
        gltf.scene.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true; //阴影
                child.receiveShadow = true; //接受别人投的阴影
            }
        });
        scene.add(gltf.scene);
    }, function(res){
        console.log(res.total, res.loaded)
    });



const mtllLoader = new MTLLoader();
mtllLoader.load(objPash + mtllName,function (material){
    material.preload()
    const objLoader = new OBJLoader();
    objLoader.setMaterials(material);
    objLoader.setPath(objPash).load(objName, (obj) => {
        obj.position.x = 200
        obj.scale.set(1, 1, 1)
        console.log("obj",obj)
        scene.add(obj);
    })

})*/

//添加一个白色点光源
// const light = new THREE.PointLight(0xffffff, 1, 100, 1);
// light.position.set(0, 10, 10);
// scene.add(light);

// 漫反射网格材质；MeshLambertMaterial
const material = new THREE.MeshLambertMaterial({
    color: 0x00ffff, //设置材质颜色
    transparent: true, //开启透明
    opacity: 0.8, //设置透明度
});

const mesh = new THREE.Mesh(geometry, material); //网格模型对象Mesh
// scene.add(mesh); //网格模型添加到场景中

//添加辅助观察的坐标系
const axesHelper = new THREE.AxesHelper(100);
scene.add(axesHelper);

//添加光源
const ambient = new THREE.AmbientLight(0xffffff, 0.4);//环境光
scene.add(ambient);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);//平行光
directionalLight.position.set(100, 200, 150);
scene.add(directionalLight);


//创建相机
const height = window.innerHeight;//相机切面 高
const width = window.innerWidth;//宽
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 5000);//透明相机 模拟人眼或相机 一个四棱的视椎体 椎体内的物体为可渲染展示的内容 (切面角度,宽高比,近端视角切面距离,远端视角切面距离)
camera.position.set(350, 200, 300);//相机在场景的位置
// camera.position.z = 5;//相机在场景的位置
camera.lookAt(0, 0, 0);//相机在场景中朝向的坐标位置

//创建渲染器 相当于照片
const renderer = new THREE.WebGLRenderer({
    antialias: true,//抗锯齿
});
//渲染画布的宽与高
renderer.setSize(width, height);
//渲染3d场景图
renderer.render(scene, camera);
//存入网页节点
document.body.appendChild(renderer.domElement);

//渲染器编译方式
renderer.outputEncoding = THREE.sRGBEncoding;
// renderer.outputColorSpace = THREE.outputColorSpace;
//相机轨道控制器 添加后可以移动相机视角
const controls = new OrbitControls(camera, renderer.domElement);

//渲染循环
function render() {
    stats.update();//刷新帧率展示
    renderer.render(scene, camera);//重新渲染
    // mesh.rotateY(0.01);//绕y轴旋转
    // mesh.rotateX(0.01);//绕x轴旋转
    requestAnimationFrame(render);//反复执行
    // console.log(camera.position);
}

//启动渲染循环
render();

//监控窗口变化 重新设定视角长宽比及渲染画布长宽比 避免场景变形
window.onresize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);//重新渲染画布大小
    camera.aspect = window.innerWidth / window.innerHeight; //重设相机长宽比
    camera.updateProjectionMatrix();//更新相机属性
}
