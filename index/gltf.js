import * as THREE from "three"
import {OrbitControls} from "three/addons/controls/OrbitControls.js"
//引入性能监视器stats.js,显示帧率
import Stats from 'three/addons/libs/stats.module.js';
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {DRACOLoader} from "three/addons/loaders/DRACOLoader.js";
import {FontLoader} from "three/addons/loaders/FontLoader.js";
import {TextGeometry} from "three/addons/geometries/TextGeometry.js";
// 获取按钮元素和渲染容器
const toggleWireframeButton = document.getElementById('toggleWireframeButton');
const canvasContainer = document.getElementById('canvasContainer');
const toggleClickButton = document.getElementById('toggleClickButton');
const animationSlider = document.getElementById('animationSlider');
const playExplosionAnimation = document.getElementById('playExplosionAnimation');
const clipX = document.getElementById('clipX');
const clipY = document.getElementById('clipY');
const clipZ = document.getElementById('clipZ');
const resetClip = document.getElementById('resetClip');
let clipDirection = [1,1,1];

const height = window.innerHeight;//相机切面 高
const width = window.innerWidth;//宽
let camera,renderer;
//创建stats对象
const stats = new Stats();
//Stats.domElement:web页面上输出计算结果,一个div元素
stats.domElement.style.top = '30px'
canvasContainer.appendChild(stats.domElement);
//是否使用边框材质
let wireframeFlag = false;
let model = [];
let isClick = false;
let isClipX = false;
let isClipY = false;
let isClipZ = false;

// 存储每个物体的原始位置
const originalPositions = {};

//创建场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x083055)

// 创建网格模型对象
const geometry = new THREE.BoxGeometry(50, 50, 50);

// const gltfPash = '../three.js-master/examples/models/gltf/';
const fontPath = '../three.js-master/examples/fonts/helvetiker_regular.typeface.json';
// const gltfPash = '../rvt2gltf/';
const gltfPash = '../2gltf/';
// const gltfName = 'ferrari.glb';
// const gltfName = '洋房-建筑.gltf';
const gltfName = 'NewProject.gltf';
const gltfArray = [ 'NewProject.gltf','洋房-硬装.gltf'];
//导入模型
const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
const fontLoader = new FontLoader();
let font;
initFont();

let textGeometry, textMeshMaterial, textMesh;


function initFont() {
    fontLoader.load(fontPath, function (f) {
        font = f;
        textGeometry = new TextGeometry('area', {
            font: font,
            size: 80,
            height: 1
        });
        textMeshMaterial = new THREE.MeshStandardMaterial({
            color: 0xeeffff
        })
        textMesh = new THREE.Mesh(textGeometry, textMeshMaterial)
        textMesh.visible = false;
        scene.add(textMesh);
        console.log("font", font);
    });

}

dracoLoader.setDecoderPath('../three.js-master/node_modules/three/examples/jsm/libs/draco/');
gltfLoader.setDRACOLoader(dracoLoader);
let i = 0;
let box;
let clipPlanes = [];
loadGltf();
initLight();
initCamera();
initRenderer();
//启动渲染循环
render();
function loadGltf(){
    gltfArray.forEach(gltfName =>{
        gltfLoader.setPath(gltfPash)
            .load(gltfName, function (gltf) {
                console.log("gltf",gltf.scene)
                model[i] = gltf.scene
                //重新设置位置
                // model[i].position.set(-25, -25, -25);
                model[i].rotation.x = -Math.PI / 2;
                // model.rotation.y = -Math.PI / 2;
                // 计算模型的包围盒
                let boundingBox = new THREE.Box3().setFromObject(model[i]);
                // 将模型中心点移到世界坐标原点
                if (i === 0) {
                    // 创建一个包围盒辅助对象
                    const center = boundingBox.getCenter(new THREE.Vector3());
                    model[i].position.sub(center);
                    boundingBox = boundingBox.setFromObject(model[i]);
                    box = boundingBox;
                }
                // 不能将所有模型都移动至原点 会导致模型相对位置失控
                // 将后续模型根据第一个模型的位置相对移动
                model[i].position.copy(model[0].position)
                //重新获取包围盒位置
                boundingBox = boundingBox.setFromObject(model[i]);
                getMaxBoundingBox(boundingBox);
                model[i].traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true; //阴影
                        child.receiveShadow = true; //接受阴影
                        // child.material.transparent = true; // 开启透明
                        // child.material.opacity = 1; //设置透明度
                        child.userData.originalMaterial = child.material;// 存储原始素材
                        // 使用物体的UUID作为键来存储原始位置
                        originalPositions[child.uuid] = child.position.clone();
                    }
                });
                initExplodeModel(model[i]);
                scene.add(model[i]);
                i++;
            }, function(res){
                console.log('res.total, res.loaded',[res.total, res.loaded])
            });
    })
}

// 添加按钮的点击事件处理程序
toggleWireframeButton.addEventListener('click', () => {
    switchWireframe();
});

function switchWireframe() {
    // 切换线框渲染的状态
    wireframeFlag = !wireframeFlag;

    // 遍历模型中的每个子网格
    model.forEach(m => {
        m.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const wireframeMaterial = new THREE.MeshStandardMaterial({ wireframe: true });
                if (child instanceof THREE.Mesh) {
                    if (wireframeFlag) {
                        //获取子网格素材颜色
                        wireframeMaterial.color.copy(child.material.color);
                        // 应用线框材质到子网格
                        child.material = wireframeMaterial;
                    }else {
                        // 恢复原始材质
                        child.material = child.userData.originalMaterial;
                    }
                }
            }
        });
    })
}

//添加一个白色点光源
// const light = new THREE.PointLight(0xffffff, 1, 100, 1);
// light.position.set(0, 10, 10);
// scene.add(light);

// 漫反射网格材质；MeshLambertMaterial


// scene.add(mesh); //网格模型添加到场景中

//添加辅助观察的坐标系
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

function initLight() {
    //添加光源
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);//环境光
    scene.add(ambient);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);//平行光
    directionalLight.position.set(100, 200, 150);
    scene.add(directionalLight);
}


function initCamera() {
    //创建相机
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);//透明相机 模拟人眼或相机 一个四棱的视椎体 椎体内的物体为可渲染展示的内容 (切面角度,宽高比,近端视角切面距离,远端视角切面距离)
    camera.position.set(-30, 40, 30);//相机在场景的位置
// camera.position.z = 5;//相机在场景的位置
    camera.lookAt(0, 0, 0);//相机在场景中朝向的坐标位置
}

function initRenderer() {
    //创建渲染器 相当于照片
    renderer = new THREE.WebGLRenderer({
        antialias: true,//抗锯齿
        clippingEnabled: true,
        localClippingEnabled: true //开启切割
    });
    canvasContainer.appendChild(renderer.domElement);
//渲染画布的宽与高
    renderer.setSize(width, height);
//渲染3d场景图
    renderer.render(scene, camera);
//渲染器编译方式
    renderer.outputEncoding = THREE.sRGBEncoding;
// renderer.outputColorSpace = THREE.outputColorSpace;
}

//相机轨道控制器 添加后可以移动相机视角
const controls = new OrbitControls(camera, renderer.domElement);

//渲染循环
function render() {
    stats.update();//刷新帧率展示
    //切割
    if (clipPlanes.length > 0 && isClipX === true) {
        clipPlanes[0].translate(new THREE.Vector3(0.1 * clipDirection[0], 0, 0));
        if (clipPlanes[0].constant > box.max.x + 0.1 || clipPlanes[0].constant < box.min.x - 0.1) {
            clipDirection[0] *= -1;
        }
    }
    if (clipPlanes.length > 0 && isClipY === true) {
        clipPlanes[1].translate(new THREE.Vector3(0, -0.1 * clipDirection[1], 0));
        if (clipPlanes[1].constant > box.max.y + 0.1 || clipPlanes[1].constant < box.min.y - 0.1) {
            clipDirection[1] *= -1;
        }
    }
    if (clipPlanes.length > 0 && isClipZ === true) {
        clipPlanes[2].translate(new THREE.Vector3(0, 0, -0.1 * clipDirection[2]));
        if (clipPlanes[2].constant > box.max.z + 0.1 || clipPlanes[2].constant < box.min.z - 0.1) {
            clipDirection[2] *= -1;
        }
    }
    // console.log(clipPlanes);
    renderer.render(scene, camera);//重新渲染
    // mesh.rotateY(0.01);//绕y轴旋转
    // mesh.rotateX(0.01);//绕x轴旋转
    requestAnimationFrame(render);//反复执行
    // console.log(camera.position);
}



//监控窗口变化 重新设定视角长宽比及渲染画布长宽比 避免场景变形
window.onresize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);//重新渲染画布大小
    camera.aspect = window.innerWidth / window.innerHeight; //重设相机长宽比
    camera.updateProjectionMatrix();//更新相机属性
}

//鼠标点击选中功能
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// 控制是否启用
toggleClickButton.addEventListener('click', () => {
    isClick = !isClick;
    let text = '启用点击选中';
    if (isClick) {
        text = '禁用点击选中';
    }
    //清除红色渲染
    if (selectedObject && originalMaterial) {
        selectedObject.material = originalMaterial;
        selectedObject = null;
        originalMaterial = null;
    }
    toggleClickButton.innerHTML = text;
});

document.addEventListener('mousemove', (event) => {
    // 计算鼠标的归一化坐标
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

document.addEventListener('click', onClick);

let selectedObject = null; // 跟踪当前选中的物体
let originalMaterial = null; // 跟踪选中物体的原始材质
function onClick() {
    if (!isClick) {
        return;
    }
    // 更新射线的起点和方向
    raycaster.setFromCamera(mouse, camera);

    // 执行射线检测
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        // 获取第一个被点击的物体
        const newSelectedObject = intersects[0].object;

        // 如果之前已经有选中的物体，则取消其高亮显示
        if (selectedObject && originalMaterial) {
            selectedObject.material = originalMaterial;
        }

        // 保存新选中的物体和其原始材质
        selectedObject = newSelectedObject;
        console.log('Selected Object:', selectedObject);

        originalMaterial = selectedObject.material.clone();

        // 创建一个红色高亮材质
        const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        // 将选中的物体材质修改为红色高亮材质
        selectedObject.material = highlightMaterial;

        // 判断选中的对象是否具有几何体
        if (selectedObject.geometry) {
            // 获取几何体
            let geometry = selectedObject.geometry;
            console.log("geometry", geometry);
            // 如果几何体是BufferGeometry，需要先将其转换为Geometry
            if (geometry.isBufferGeometry) {
                console.log("BufferGeometry");
            }
            const vertices = geometry.attributes.position.array;
            const indices = geometry.index.array;
            console.log("geometry toNonIndexed", geometry);
            // 计算表面积
            const area = calculateSurfaceArea(vertices,indices);
            console.log("font",font);
            textMesh.geometry = new TextGeometry(area.toFixed(2), {
                font: font,
                size: 3,
                height: 1,
            });
            /*const mesh1Center = new THREE.Vector3();
            selectedObject.geometry.computeBoundingBox();
            selectedObject.geometry.boundingBox.getCenter(mesh1Center);
            selectedObject.localToWorld(mesh1Center);
            const mesh2Center = new THREE.Vector3();
            textMesh.geometry.computeBoundingBox();
            textMesh.geometry.boundingBox.getCenter(mesh2Center);
            textMesh.localToWorld(mesh2Center);
            const centerOffset = new THREE.Vector3();
            centerOffset.subVectors(mesh1Center, mesh2Center);
            // 将mesh2移动以使其中心点与mesh1的中心点重合
            textMesh.position.add(centerOffset);*/


            console.log('textGeometry:', textGeometry);
            textMesh.position.copy(selectedObject.userData.worldDistance);
            // 让新的Mesh正面朝向摄像机方向
            const cameraDirection = new THREE.Vector3();
            cameraDirection.copy(camera.position);
            cameraDirection.y = textMesh.position.y;
            // camera.getWorldDirection(cameraDirection);
            console.log("cameraDirection", cameraDirection);
            textMesh.lookAt(cameraDirection);
            console.log([textMesh.position,selectedObject.userData.worldDistance])
            textMesh.visible = true;
            console.log(scene)
            console.log('选中的对象表面积为:', area);
        }
    } else {
        // 如果点击了空白处，取消之前选中的物体高亮显示
        if (selectedObject && originalMaterial) {
            selectedObject.material = originalMaterial;
            selectedObject = null;
            originalMaterial = null;
        }
    }
}

// 初始化爆炸数据保存到每个mesh的userdata上
function initExplodeModel(modelObject) {
    if (!modelObject) return;

    // 计算模型中心
    const explodeBox = new THREE.Box3();
    explodeBox.setFromObject(modelObject);
    const explodeCenter = getWorldCenterPosition(explodeBox);

    const meshBox = new THREE.Box3();

    // 遍历整个模型，保存数据到userData上，以便爆炸函数使用
    modelObject.traverse(function (value) {
        if (value.isLine || value.isSprite) return;
        if (value.isMesh) {
            meshBox.setFromObject(value);

            const meshCenter = getWorldCenterPosition(meshBox);
            // 爆炸方向
            value.userData.worldDir = new THREE.Vector3()
                .subVectors(meshCenter, explodeCenter)
                .normalize();
            // 爆炸距离 mesh中心点到爆炸中心点的距离
            value.userData.worldDistance = new THREE.Vector3().subVectors(meshCenter, explodeCenter);
            // 原始坐标
            value.userData.originPosition = value.getWorldPosition(new THREE.Vector3());
            // mesh中心点
            value.userData.meshCenter = meshCenter.clone();
            value.userData.explodeCenter = explodeCenter.clone();
        }
    });
}

function getWorldCenterPosition(box, scalar = 0.5) {
    return new THREE.Vector3().addVectors(box.max, box.min).multiplyScalar(scalar);
}

// 模型爆炸函数
function explodeModel(model, scalar){
    model.forEach( m => {
        m.traverse(function (value) {
            if (!value.isMesh || !value.userData.originPosition) return;
            const distance = value.userData.worldDir
                .clone()
                .multiplyScalar(value.userData.worldDistance.length() * scalar);
            const offset = new THREE.Vector3().subVectors(
                value.userData.meshCenter,
                value.userData.originPosition
            );
            const center = value.userData.explodeCenter;
            const newPos = new THREE.Vector3().copy(center).add(distance).sub(offset);
            const localPosition = value.parent?.worldToLocal(newPos.clone());
            localPosition && value.position.copy(localPosition);
        });
    })

}
clipX.addEventListener('click', () => {
    isClipX = !isClipX;
    if (renderer.clippingPlanes.length === 0) {
        initClippingPlans();
    }
});
clipY.addEventListener('click', () => {
    isClipY = !isClipY;
    if (renderer.clippingPlanes.length === 0) {
        initClippingPlans();
    }
});
clipZ.addEventListener('click', () => {
    isClipZ = !isClipZ;
    if (renderer.clippingPlanes.length === 0) {
        initClippingPlans();
    }
});
resetClip.addEventListener('click', () => {
    initClippingPlans();
});

// 监听进度条的input事件，更新动画进度
animationSlider.addEventListener('input', () => {
    if (renderer.clippingPlanes.length > 0) {
        renderer.clippingPlanes = [];
    }
    explodeModel(model, parseFloat(animationSlider.value));
});
playExplosionAnimation.addEventListener('click', () => {
    if (renderer.clippingPlanes.length > 0) {
        renderer.clippingPlanes = [];
    }
    const progressBarInterval = setInterval(increaseProgressBar, 50);
    setTimeout(() => {
        clearInterval(progressBarInterval);
    }, 9050);
});
let increment = 0.1; // 每次增加的宽度
function increaseProgressBar() {
    const currentWidth = parseFloat(animationSlider.value);
    const targetWidth = 10; // 目标宽度
    const minWidth = 1; // 最小宽度
    if (currentWidth < minWidth && increment < 0) {
        return;
    }
    if (currentWidth >= targetWidth || currentWidth <= minWidth) {
        increment *= -1;
    }
    console.log(currentWidth);
    animationSlider.value = currentWidth + increment
    explodeModel(model, parseFloat(animationSlider.value));
}

function getMaxBoundingBox(newBox) {
    const size = ["max", "min"];
    const coordinate = ["x", "y", "z"];
    size.forEach(s => {
        coordinate.forEach(c => {
            if (newBox[s][c] > box[s][c] && s === "max") {
                console.log("box changed" + s + c);
                box[s][c] = newBox[s][c];
            }
            if (newBox[s][c] < box[s][c] && s === "min") {
                console.log("box changed" + s + c);
                box[s][c] = newBox[s][c];
            }
        })
    })
    console.log('box', box);
}

function initClippingPlans() {
    clipPlanes = [
        new THREE.Plane(new THREE.Vector3(1, 0, 0), box.max.x + 0.01),
        new THREE.Plane(new THREE.Vector3(0, -1, 0), box.max.y + 0.01),
        new THREE.Plane(new THREE.Vector3(0, 0, -1), box.max.z + 0.01)
    ];
    renderer.clippingPlanes = clipPlanes;
    // var helpers = new THREE.Group();
    // helpers.add( new THREE.PlaneHelper( clipPlanes[ 0 ], 20, 0xff0000 ) );
    // helpers.add( new THREE.PlaneHelper(clipPlanes[ 1 ], 20, 0xFFFF00 ) );
    // helpers.add( new THREE.PlaneHelper(clipPlanes[ 2 ], 20, 0x0000ff ) );
    // helpers.visible = true;
    // scene.add( helpers );
}


// 计算几何体的表面积
function calculateSurfaceArea(vertices, indices) {
    let surfaceArea = 0;

    // 遍历索引数据，每3个索引构成一个三角形
    for (let i = 0; i < indices.length; i += 3) {
        const i1 = indices[i];
        const i2 = indices[i + 1];
        const i3 = indices[i + 2];

        // 获取三角形的顶点坐标
        const v1 = new THREE.Vector3().fromArray(vertices, i1 * 3);
        const v2 = new THREE.Vector3().fromArray(vertices, i2 * 3);
        const v3 = new THREE.Vector3().fromArray(vertices, i3 * 3);

        // 计算三角形的面积
        surfaceArea += calculateTriangleArea(v1, v2, v3);
    }

    return surfaceArea;
}

// 计算三角形的面积
function calculateTriangleArea(vertex1, vertex2, vertex3) {
    const v1 = new THREE.Vector3().copy(vertex1);
    const v2 = new THREE.Vector3().copy(vertex2);
    const v3 = new THREE.Vector3().copy(vertex3);

    // 使用Heron's公式计算三角形的面积
    const a = v1.distanceTo(v2);
    const b = v2.distanceTo(v3);
    const c = v3.distanceTo(v1);

    const s = (a + b + c) / 2;
    const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));

    return area;
}

