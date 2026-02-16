import * as BABYLON from "@babylonjs/core";

export const createBaseScene = (engine, canvas) => {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.05, 0.05, 0.1);

    // --- CAMÉRA ---
    const CAM_OFFSET = new BABYLON.Vector3(0, 40, -40);
    const camera = new BABYLON.TargetCamera("IsoCam", CAM_OFFSET.clone(), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;

    const orthoSize = 20;
    const updateRatio = () => {
        const ratio = canvas.width / canvas.height;
        camera.orthoTop = orthoSize;
        camera.orthoBottom = -orthoSize;
        camera.orthoLeft = -orthoSize * ratio;
        camera.orthoRight = orthoSize * ratio;
    };
    updateRatio();
    window.addEventListener("resize", updateRatio);

    // --- LUMIÈRES & OMBRES ---
    const hemiLight = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.6;

    const dirLight = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight.position = new BABYLON.Vector3(20, 40, 20);
    dirLight.intensity = 0.8;

    const shadowGenerator = new BABYLON.ShadowGenerator(1024, dirLight);
    shadowGenerator.useBlurExponentialShadowMap = true;

    // --- FX ---
    const gl = new BABYLON.GlowLayer("glow", scene);
    gl.intensity = 0.5;

    // --- SOL ---
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 100, height: 100}, scene);
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.12, 0.12, 0.18);
    groundMat.wireframe = true; // Style rétro
    ground.material = groundMat;
    ground.receiveShadows = true;

    return { scene, camera, shadowGenerator, ground, CAM_OFFSET };
};