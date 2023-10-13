# loadGltfModel

gltf文件包含功能：

1. 导入gltf模型

   * 首先引入threeJs核心文件以及加载器路径

     ```html
     <script type="importmap">
         {
             "imports" : {
                 "three" : "../three.js-master/build/three.module.js",
                 "three/addons/" : "../three.js-master/examples/jsm/"
             }
         }
     </script>
     ```

   * 引入gltf模型加载器和DRACO加载器
     ```js
      import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
      import {DRACOLoader} from "three/addons/loaders/DRACOLoader.js";
     ```

   * 创建场景、相机、渲染器并初始化
     ```js
     let camera, renderer;
     //创建场景
     const scene = new THREE.Scene();
     scene.background = new THREE.Color(0x083055)
     initCamera();
     initRenderer();
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
     
     ```

   * 调用GLTFLodaer加载gltf模型并读取模型原始材质和原始位置信息存储起来方便后续功能使用
     ```js
     function loadGltf() {
         gltfArray.forEach(gltfName => {
             gltfLoader.setPath(gltfPash)
                 .load(gltfName, function (gltf) {
                     console.log("gltf", gltf.scene)
                     model[i] = gltf.scene
                     //重新设置位置
                     model[i].rotation.x = -Math.PI / 2;
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
                 }, function (res) {
                     console.log('res.total, res.loaded', [res.total, res.loaded])
                 });
         })
     }
     ```

2.  切换模型材质

   * 遍历模型每个子元素，获取其元素的主要颜色，依据此颜色创建边框材质
     ```js
     // 遍历模型中的每个子网格
         model.forEach(m => {
             m.traverse((child) => {
                 if (child instanceof THREE.Mesh) {
                     const wireframeMaterial = new THREE.MeshStandardMaterial({wireframe: true});
                     if (child instanceof THREE.Mesh) {
                         if (wireframeFlag) {
                             //获取子网格素材颜色
                             wireframeMaterial.color.copy(child.material.color);
                             // 应用线框材质到子网格
                             child.material = wireframeMaterial;
                         } else {
                             // 恢复原始材质
                             child.material = child.userData.originalMaterial;
                         }
                     }
                 }
             });
         })
     ```

3. 点击选中、计算面积(面积计算不准确，待优化)

   * 计算鼠标归一化坐标
     ```js
     // 计算鼠标的归一化坐标
     const mouse = new THREE.Vector2();
     mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
     mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
     ```

   * 使用射线检测所点击的模块
     ```js
     const raycaster = new THREE.Raycaster();
     // 更新射线的起点和方向
     raycaster.setFromCamera(mouse, camera);
     // 执行射线检测
     const intersects = raycaster.intersectObjects(scene.children, true);
     ```

   * 将选中的模块替换红色材质并计算其面积
     ```js
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
             const highlightMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
             highlightMaterial.depthFunc = THREE.AlwaysDepth;
     
             // 将选中的物体材质修改为红色高亮材质
             selectedObject.material = highlightMaterial;
     
             // 判断选中的对象是否具有几何体
             if (selectedObject.geometry) {
                 // 获取几何体
                 let geometry = selectedObject.geometry;
                 console.log("geometry", geometry);
                 const vertices = geometry.attributes.position.array;
                 const indices = geometry.index.array;
                 // 计算表面积
                 const area = calculateSurfaceArea(vertices, indices);
                 console.log("font", font);
                 textMesh.geometry = new TextGeometry(area.toFixed(2), {
                     font: font,
                     size: 2,
                     height: 0.1,
                 });
                 textMesh.renderOrder = 1;
                 // 让新的Mesh正面朝向摄像机方向
                 const cameraDirection = new THREE.Vector3();
                 cameraDirection.copy(camera.position);
                 cameraDirection.y = textMesh.position.y;
                 textMesh.lookAt(cameraDirection);
                 // 计算模型中心
                 const explodeBox = new THREE.Box3();
                 explodeBox.setFromObject(selectedObject);
                 const explodeCenter = new THREE.Vector3();
                 explodeBox.getCenter(explodeCenter);
     
                 const worldPosition = new THREE.Vector3();
                 selectedObject.getWorldPosition(worldPosition);
                 console.log(explodeCenter, worldPosition);
     
                 const textBox = new THREE.Box3();
                 textBox.setFromObject(textMesh);
                 const textCenter = new THREE.Vector3();
                 textBox.getCenter(textCenter);
                 textMesh.position.sub(textCenter);
                 textMesh.position.add(explodeCenter);
     
                 textMesh.visible = true;
                 console.log('选中的对象表面积为:', area);
             }
         } else {
             // 如果点击了空白处，取消之前选中的物体高亮显示
             if (selectedObject && originalMaterial) {
                 selectedObject.material = originalMaterial;
                 selectedObject = null;
                 originalMaterial = null;
                 textMesh.visible = false;
             }
         }
     ```

4. 模型爆炸

   * 遍历模型每个mesh，计算爆炸方向、距离
     ```js
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
     ```

   * 执行爆炸：将模型每个子元素向爆炸方向移动
     ```js
     // 模型爆炸函数
     function explodeModel(model, scalar) {//scalar为爆炸进度
         model.forEach(m => {
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
     ```

5. 模型刨切

   * 在加载模型时获取已加载的模型的最大顶点和最小顶点
     ```js
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
     }
     ```

   * 创建基于X、Y、Z三轴的平面并初始化,设置render的切割属性

     ```js
     let clipPlanes = [];
     function initClippingPlans() {
         clipPlanes = [
             new THREE.Plane(new THREE.Vector3(1, 0, 0), box.max.x + 0.01),
             new THREE.Plane(new THREE.Vector3(0, -1, 0), box.max.y + 0.01),
             new THREE.Plane(new THREE.Vector3(0, 0, -1), box.max.z + 0.01)
         ];
         renderer.clippingPlanes = clipPlanes;
     }
     ```

   * 移动切割平面实现切割效果

     ```js
     clipPlanes[0].translate(new THREE.Vector3(0.1 * clipDirection[0], 0, 0));
             if (clipPlanes[0].constant > box.max.x + 0.1 || clipPlanes[0].constant < box.min.x - 0.1) {
                 clipDirection[0] *= -1;
             }
     ```

     

lineText文件包含功能： 

​	1.鼠标点击自动吸附被点击对象距离点击点最近的顶点 

​	2.连接两点计算距离