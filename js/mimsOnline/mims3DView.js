
/*
################################

THREE.JS MI_Models Renderer

################################
 */
import * as THREE from './three.module.js';
import {OrbitControls} from './OrbitControls.js';
//import {_GLTFExporter} from './GLTFExporter.js';

var camera, scene, renderer, controls, raycaster, mouse, massesView, interactionsView, inOutView, pickedModuleView, benchView, canvas, pickableModules, container, pointer;
var pickedModule = [];
var colorMaterial_Background, colorMaterial_Bench, colorMaterial_MAS, colorMaterial_GND, colorMaterial_PosIN, colorMaterial_PosOUT, colorMaterial_FrcIN, colorMaterial_FrcOUT, colorMaterial_REF, colorMaterial_NLBOW, colorMaterial_NLPLUCK, colorMaterial_NLCONTACT;
var material_MAS, material_GND, material_PosIN, material_PosOUT, material_FrcIN, material_FrcOUT, material_REF, material_NLBOW, material_NLPLUCK, material_NLCONTACT, material_Bench;
var geometry_MAS, geometry_GND, geometry_PosIN, geometry_PosOUT, geometry_FrcIN, geometry_FrcOUT;
var style;
var sphereWidthSegments, sphereHeightSegments;

var simulationState = [];
var ongoingSimulation = false;
var var_mouseOverButtonsInView = false;

var framesPerSecond = 30;
var animationPaused = true;
var view_displayMAT = true;
var view_displayLIA = true;
var view_displayShadows = true;
var view_displayWireBench = false;
var zFactor = 1;
var sphereSizeFactor = 1;

function initColors(){
    // get all color values stored in local style
    style = getComputedStyle(document.body);
    colorMaterial_Background = style.getPropertyValue("--color-bg-sec");

    colorMaterial_Bench = style.getPropertyValue("--color-bg-main");
    colorMaterial_MAS = style.getPropertyValue("--color-material_MAS");
    colorMaterial_GND = style.getPropertyValue("--color-material_GND");
    colorMaterial_PosIN = style.getPropertyValue("--color-material_PosIN");
    colorMaterial_PosOUT = style.getPropertyValue("--color-material_PosOUT");
    colorMaterial_FrcIN = style.getPropertyValue("--color-material_FrcIN");
    colorMaterial_FrcOUT = style.getPropertyValue("--color-material_FrcOUT");

    colorMaterial_REF = style.getPropertyValue("--color-material_REF");
    colorMaterial_NLBOW = style.getPropertyValue("--color-material_NLBOW");
    colorMaterial_NLPLUCK = style.getPropertyValue("--color-material_NLPLUCK");
    colorMaterial_NLCONTACT = style.getPropertyValue("--color-material_NLCONTACT");

    // generating materials
    material_Bench = new THREE.MeshLambertMaterial( {color: formatColorString(colorMaterial_Bench), opacity: 1});

    material_MAS = new THREE.MeshBasicMaterial( {color : formatColorString(colorMaterial_MAS)});
    material_GND = new THREE.MeshBasicMaterial( {color : formatColorString(colorMaterial_GND)});
    material_PosIN = new THREE.MeshBasicMaterial( {color: formatColorString(colorMaterial_PosIN)} );
    material_PosOUT = new THREE.MeshBasicMaterial( {color: formatColorString(colorMaterial_PosOUT)} );
    material_FrcIN = new THREE.MeshBasicMaterial( {color: formatColorString(colorMaterial_FrcIN)} );
    material_FrcOUT = new THREE.MeshBasicMaterial( {color: formatColorString(colorMaterial_FrcOUT)} );

    material_REF = new THREE.LineBasicMaterial( { color: formatColorString(colorMaterial_REF)} );
    material_NLBOW = new THREE.LineDashedMaterial( {color: formatColorString(colorMaterial_NLBOW), scale: 1, dashSize: 0.2, gapSize: 0.2} );
    material_NLPLUCK = new THREE.LineDashedMaterial( {color: formatColorString(colorMaterial_NLPLUCK), scale: 1, dashSize: 0.2, gapSize: 0.2} );
    material_NLCONTACT = new THREE.LineDashedMaterial( {color: formatColorString(colorMaterial_NLCONTACT), scale: 1, dashSize: 0.2, gapSize: 0.2} );
}

function initGeometries(){
    const radius = 0.3*sphereSizeFactor;
    geometry_MAS = new THREE.SphereBufferGeometry(radius-radius*0.4, sphereWidthSegments, sphereHeightSegments);
    geometry_GND = new THREE.SphereBufferGeometry(radius+radius*0.2, sphereWidthSegments, sphereHeightSegments);
    geometry_PosIN = new THREE.SphereBufferGeometry(radius-radius*0.4, sphereWidthSegments, sphereHeightSegments);
    geometry_PosOUT = new THREE.ConeGeometry( 0.1*sphereSizeFactor, 0.3*sphereSizeFactor, 10 );
    geometry_FrcIN = new THREE.ConeGeometry( 0.1*sphereSizeFactor, 0.3*sphereSizeFactor, 10 );
    geometry_FrcOUT = new THREE.ConeGeometry( 0.1*sphereSizeFactor, 0.3*sphereSizeFactor, 10 );
}

function initView() {
    initColors();
    initGeometries();

    container = document.getElementById('modelView');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(formatColorString(colorMaterial_Background));

    camera = new THREE.PerspectiveCamera(50, $(container).width() / $(container).height(), 1., 1000);
    camera.position.set(40, 40, 40);

    /* Lights */
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.1);
    directionalLight.position.set(0.6, 2, 0.6);
    scene.add(directionalLight);

    var d = 25;
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;

    directionalLight.shadow.camera.near = -d;
    directionalLight.shadow.camera.far = d;

    directionalLight.shadow.mapSize.x = 2056;
    directionalLight.shadow.mapSize.y = 2056;
    /* End Lights */

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.domElement.id = 'threejsCanvas';
    //renderer.setClearColor(0xc7e4a1);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    controls.update();
    controls.enabled = false;

    controls.screenSpacePanning = false;

    controls.minDistance = 2;
    controls.maxDistance = 100;
    controls.panSpeed = 0.3;
    controls.maxPolarAngle = Math.PI / 2;

    raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 20;
    mouse = new THREE.Vector2();

    window.addEventListener('resize', viewResize, false);

    /* Gérer les controls souris !! */
    container.addEventListener("mouseover", function (e) {
        e.preventDefault();
        controls.enabled = true;
    });
    container.addEventListener("mouseout", function () {
        controls.enabled = false;
    });

    container.addEventListener('pointermove', onMouseMove, false);
    container.addEventListener('pointerdown', onMouseDown, false);
    container.addEventListener('pointerup', onMouseUp, false);

    controls.addEventListener('change', render);

    massesView = new THREE.Object3D();
    interactionsView = new THREE.Object3D();
    inOutView = new THREE.Object3D();
    pickedModuleView = new THREE.Object3D();
    pickableModules = new THREE.Group();
    benchView = new THREE.Object3D();

    canvas = document.getElementById('threejsCanvas');

    sphereWidthSegments = 30;
    sphereHeightSegments = 30;

    initBench();
}

function initBench(){
    /* Vue du Bench */
    var geometry3 = new THREE.PlaneGeometry( 50, 50, 20, 20);
    geometry3.rotateX(-Math.PI / 2);
    geometry3.translate(0,-0.5,0);
    var plane = new THREE.Mesh( geometry3, material_Bench );
    plane.receiveShadow = true;
    plane.name = "bench";
    benchView.add(plane);
    scene.add( benchView );
}

var click ;
function onMouseMove( event ) {
    if(animationPaused){
    mouse.x = (event.offsetX / canvas.width*2) * 2 - 1;
    mouse.y = -(event.offsetY / canvas.height*2) * 2 + 1;
    render();
    click = false;
    }
}

function onMouseDown( ){
    click = true;
}

function onMouseUp( event ) {
    if(click){
        mouse.x = (event.offsetX / canvas.width) * 2 - 1;
        mouse.y = -(event.offsetY / canvas.height) * 2 + 1;
        let intersects = raycaster.intersectObjects(pickableModules.children, true);
        if (intersects.length > 0) {
            let pickedObject = intersects[0].object;
            let pickedObjectName = pickedObject.name;
            if (isPresentInDict(pickedObjectName, mdl.inOutDict)) {
                pickedModule = [pickedObjectName, mdl.inOutDict[pickedObjectName]];
            } else {
                pickedModule = [pickedObjectName, mdl.massDict[pickedObjectName]];
            }
            pickedModuleRefresh();
        } else {
            console.log("passe");
            pickedModule = [];
            pickedModuleRefresh();
            if(mouseOverButtonsInView){
            } else {
                pickedModule = [];
                pickedModuleRefresh();
            }
        }
    }
}

function mouseOverButtonsInView(boolean){
    var_mouseOverButtonsInView = boolean;
    console.log(var_mouseOverButtonsInView);
}




var tmpMassVec = [];


/* Function called when user is creating, editing the model from MIMS Script section */
/* Not suitable/efficient in the simulation context */
function build_modelView() {

    clear_modelView();

    let dict = {};
    let posXMax = 0., posXMin = 0.;
    let posYMax = 0., posYMin = 0.;
    simulationState = getSimPositions();

    if(view_displayMAT){
        /* Generating 3D View of all MASS modules present in massDict */
        for (let name in mdl.massDict) {
            dict = mdl.massDict[name];
            let posX = dict["pos"]["x"];
            let posY = dict["pos"]["y"];
            let posZ = dict["pos"]["z"];
            let type = dict["type"];
            if(posX > posXMax)
                posXMax = posX;
            if(posX < posXMin)
                posXMin = posX;
            if(posY > posYMax)
                posYMax = posY;
            if(posY < posYMin)
                posYMin = posY;
            if(type === "ground") {
                var sphere = new THREE.Mesh(geometry_GND, material_GND);
            } else {
                var sphere = new THREE.Mesh(geometry_MAS, material_MAS);
            }

            /* Plan Threejs : X et Z... et Y en vertical. Du coup on adapte. */
            sphere.position.copy(new THREE.Vector3(posX, posZ*zFactor, posY));
            sphere.name = name;
            if(view_displayShadows){
                sphere.castShadow = true;
            }

            massesView.add(sphere);

        }
        pickableModules.add( massesView );

        /* Generating 3D View of all In an Out modules present in inOutDict */
        for (let name in mdl.inOutDict) {
            dict = mdl.inOutDict[name];
            let type = dict["type"];
            var ioShape = new THREE.Object3D();

            switch (type) {
                case "frcInput":
                case "frcOutput":
                case "posInput":
                case "posOutput":
                    if (type === "frcInput") {
                        let m = dict["m"];
                        dict = mdl.massDict[m];
                        var cone1 = new THREE.Mesh(geometry_FrcIN, material_FrcIN);
                        cone1.rotateX(-Math.PI / 2);
                        cone1.translateY(-.5*sphereSizeFactor);
                        var cone2 = new THREE.Mesh(geometry_FrcIN, material_FrcIN);
                        cone2.rotateX(Math.PI / 2);
                        cone2.translateY(-.5*sphereSizeFactor);
                        var cone3 = new THREE.Mesh(geometry_FrcIN, material_FrcIN);
                        cone3.rotateY(-Math.PI / 2);
                        cone3.translateY(-.5*sphereSizeFactor);
                        var cone4 = new THREE.Mesh(geometry_FrcIN, material_FrcIN);
                        cone4.rotateZ(Math.PI);
                        cone4.translateY(-.5*sphereSizeFactor);
                        var cone5 = new THREE.Mesh(geometry_FrcIN, material_FrcIN);
                        cone5.rotateZ(-Math.PI / 2);
                        cone5.translateY(-.5*sphereSizeFactor);
                        var cone6 = new THREE.Mesh(geometry_FrcIN, material_FrcIN);
                        cone6.rotateZ(Math.PI / 2);
                        cone6.translateY(-.5*sphereSizeFactor);
                    }
                    if (type === "frcOutput") {
                        let m = dict["m"];
                        dict = mdl.massDict[m];
                        var cone1 = new THREE.Mesh(geometry_FrcOUT, material_FrcOUT);
                        cone1.rotateX(-Math.PI / 2);
                        cone1.translateY(.5);
                        var cone2 = new THREE.Mesh(geometry_FrcOUT, material_FrcOUT);
                        cone2.rotateX(Math.PI / 2);
                        cone2.translateY(.5);
                        var cone3 = new THREE.Mesh(geometry_FrcOUT, material_FrcOUT);
                        cone3.rotateY(-Math.PI / 2);
                        cone3.translateY(.5);
                        var cone4 = new THREE.Mesh(geometry_FrcOUT, material_FrcOUT);
                        cone4.rotateZ(Math.PI);
                        cone4.translateY(.5);
                        var cone5 = new THREE.Mesh(geometry_FrcOUT, material_FrcOUT);
                        cone5.rotateZ(-Math.PI / 2);
                        cone5.translateY(.5);
                        var cone6 = new THREE.Mesh(geometry_FrcOUT, material_FrcOUT);
                        cone6.rotateZ(Math.PI / 2);
                        cone6.translateY(.5);
                    }
                    if (type === "posInput") {
                        sphere = new THREE.Mesh(geometry_PosIN, material_PosIN);
                        sphere.name = name;
                        if(view_displayShadows){
                            sphere.castShadow = true;
                        }
                        ioShape.add(sphere);
                        var cone1 = new THREE.Mesh(geometry_FrcIN, material_PosIN);
                        cone1.rotateX(-Math.PI / 2);
                        cone1.translateY(-.5);
                        var cone2 = new THREE.Mesh(geometry_FrcIN, material_PosIN);
                        cone2.rotateX(Math.PI / 2);
                        cone2.translateY(-.5);
                        var cone3 = new THREE.Mesh(geometry_FrcIN, material_PosIN);
                        cone3.rotateY(-Math.PI / 2);
                        cone3.translateY(-.5);
                        var cone4 = new THREE.Mesh(geometry_FrcIN, material_PosIN);
                        cone4.rotateZ(Math.PI);
                        cone4.translateY(-.5);
                        var cone5 = new THREE.Mesh(geometry_FrcIN, material_PosIN);
                        cone5.rotateZ(-Math.PI / 2);
                        cone5.translateY(-.5);
                        var cone6 = new THREE.Mesh(geometry_FrcIN, material_PosIN);
                        cone6.rotateZ(Math.PI / 2);
                        cone6.translateY(-.5);
                    }
                    if (type === "posOutput") {
                        let m = dict["m"];
                        dict = mdl.massDict[m];
                        var cone1 = new THREE.Mesh(geometry_PosOUT, material_PosOUT);
                        cone1.rotateX(-Math.PI / 2);
                        cone1.translateY(.5);
                        var cone2 = new THREE.Mesh(geometry_PosOUT, material_PosOUT);
                        cone2.rotateX(Math.PI / 2);
                        cone2.translateY(.5);
                        var cone3 = new THREE.Mesh(geometry_PosOUT, material_PosOUT);
                        cone3.rotateY(-Math.PI / 2);
                        cone3.translateY(.5);
                        var cone4 = new THREE.Mesh(geometry_PosOUT, material_PosOUT);
                        cone4.rotateZ(Math.PI);
                        cone4.translateY(.5);
                        var cone5 = new THREE.Mesh(geometry_PosOUT, material_PosOUT);
                        cone5.rotateZ(-Math.PI / 2);
                        cone5.translateY(.5);
                        var cone6 = new THREE.Mesh(geometry_PosOUT, material_PosOUT);
                        cone6.rotateZ(Math.PI / 2);
                        cone6.translateY(.5);
                    }

                    ioShape.add(cone1, cone2, cone3, cone4, cone5, cone6);
                    ioShape.rotateX(Math.PI / 4);
                    ioShape.rotateY(Math.PI / 4);
                    ioShape.rotateZ(Math.PI / 4);

                    let posZ = dict["pos"]["z"];
                    let posX = dict["pos"]["x"];
                    let posY = dict["pos"]["y"];

                    if (posX > posXMax)
                        posXMax = posX;
                    if (posX < posXMin)
                        posXMin = posX;
                    if (posY > posYMax)
                        posYMax = posY;
                    if (posY < posYMin)
                        posYMin = posY;

                    /* Plan Threejs : X et Z... et Y en vertical. Du coup on adapte. */
                    ioShape.position.copy(new THREE.Vector3(posX, posZ*zFactor, posY));
                    inOutView.add(ioShape);
                    break;
            }
        }
        pickableModules.add( inOutView );
    }

    /* Generating 3D View of all Interaction modules present in interDict */

    if(view_displayLIA){
        let points;
        let mass1, mass2, mass1_altPos,mass2_altPos;
        let geometry_REF, line;
        var allSegments = [];
        var lines;

        for (let name in mdl.interDict) {
            dict = mdl.interDict[name];
            points = [];

            if (isPresentInDict(dict["m1"], mdl.inOutDict)) {
                mass1 = mdl.inOutDict[dict["m1"]];
                tmpMassVec.push("p_"+dict["m1"][0].substring(1));
            } else {
                mass1 = mdl.massDict[dict["m1"]];
                tmpMassVec.push(dict["m1"].toString().substring(1));
            }
            mass1_altPos = new THREE.Vector3(parseFloat(mass1["pos"]['x']), parseFloat(mass1["pos"]["z"])*zFactor, parseFloat(mass1["pos"]['y']));
            points.push(mass1_altPos);

            if (isPresentInDict(dict["m2"], mdl.inOutDict)) {
                mass2 = mdl.inOutDict[dict["m2"]];
                tmpMassVec.push("p_"+dict["m2"][0].substring(1));
            } else {
                mass2 = mdl.massDict[dict["m2"]];
                tmpMassVec.push(dict["m2"].toString().substring(1));
            }
            mass2_altPos = new THREE.Vector3(parseFloat(mass2["pos"]['x']), parseFloat(mass2["pos"]["z"])*zFactor, parseFloat(mass2["pos"]['y']));
            points.push(mass2_altPos);

            geometry_REF = new THREE.BufferGeometry().setFromPoints(points);
            //geometry_REF.vertices.push(new THREE.Vector3(mass2posX, mass2posY, mass2posZ) );

            switch (dict["type"]) {
                case "nlPluck":
                    line = new THREE.Line(geometry_REF, material_NLPLUCK);
                    line.computeLineDistances();
                    break;
                case "nlBow":
                    line = new THREE.Line(geometry_REF, material_NLBOW);
                    line.computeLineDistances();
                    break;
                case "contact":
                case "nlContact":
                    line = new THREE.Line(geometry_REF, material_NLCONTACT);
                    line.computeLineDistances();
                    break;
                default :
                    //line = new THREE.Line(geometry_REF, material_REF);
            }

            allSegments.push(parseFloat(mass1["pos"]['x']), parseFloat(mass1["pos"]["z"])*zFactor, parseFloat(mass1["pos"]['y']), parseFloat(mass2["pos"]['x']), parseFloat(mass2["pos"]["z"])*zFactor, parseFloat(mass2["pos"]['y']));

            //line.name = name;
            //interactionsView.add(line);
            //geometries.push(geometry_REF);

        }
        var verticesLines = new Float32Array(allSegments);
        var geometryLines = new THREE.BufferGeometry();
        geometryLines.setAttribute( 'position', new THREE.BufferAttribute( verticesLines, 3) );
        lines =  new THREE.LineSegments( geometryLines, material_REF );
        interactionsView.add( lines );

    }

    pickableModules.name = "pickableModules";
    scene.add(pickableModules);

    interactionsView.name = "interactionsView";
    scene.add(interactionsView);
    //window.scene = scene;
}

/* Function called when user is simulating the model */
/* Optimized for simulation - Forbids any topological modification or module deletion while running */
function update_modelView(){
    simulationState = getSimPositions();
    var i = 0;
    if(view_displayMAT){
        i = 0;
        for (let name in mdl.massDict) {
            massesView.children[i].position.y = simulationState[name.substring(1)]*zFactor;
            i += 1;
        }
        i = 0;
        for (let name in mdl.inOutDict) {
            inOutView.children[i].position.y = simulationState["p_"+name.substring(1)]*zFactor;
            i += 1;
        }
    }
    if(view_displayLIA){
        for (var i = 0; i < tmpMassVec.length; i++) {
            interactionsView.children[0].geometry.attributes.position.array[1+i*3] = parseFloat(simulationState[tmpMassVec[i]]*zFactor);
            interactionsView.children[0].geometry.attributes.position.needsUpdate = true;
        }
    }

    build_pickedModuleView();
    render();
}
window.update_modelView = update_modelView;


function clear_modelView() {
    for (var i = pickableModules.children.length - 1; i >= 0; i--) {
        pickableModules.remove(pickableModules.children[i]);
    }
    for (var i = massesView.children.length - 1; i >= 0; i--) {
        massesView.remove(massesView.children[i]);
    }
    for (var i = interactionsView.children.length - 1; i >= 0; i--) {
        interactionsView.remove(interactionsView.children[i]);
    }
    for (var i = inOutView.children.length - 1; i >= 0; i--) {
        inOutView.remove(inOutView.children[i]);
    }

    /*
    for (var i = scene.children.length - 1; i >= 0; i--) {
        scene.remove(scene.children[i]);
    }
    */
}


function build_pickedModuleView() {
    clear_pickedModuleView ();
    /* Generating 3D View of picked module */
    if (!Array.isArray(pickedModule) || !pickedModule.length) {
        /* no module picked */
    } else {
        let module = pickedModule[1];
        let name = pickedModule[0];
        let type = module["type"];
        let m1posZ, m2posZ;

        switch (type) {
            case "mass":
            case "osc":
            case "posInput":
            case "ground":
                var material_PickedMAS = new THREE.MeshBasicMaterial( {color: 0xffff00} );
                var geometry_pickedMAS = new THREE.SphereGeometry(1, 8, 8 );
                material_PickedMAS.wireframe = true;
                material_PickedMAS.transparent = true;
                material_PickedMAS.opacity = 0.4;

                if(type === "ground"){
                    let scale = geometry_GND.parameters.radius*1.3;
                    geometry_pickedMAS.scale(scale, scale, scale);
                } else {
                    let scale = geometry_MAS.parameters.radius*1.3;
                    geometry_pickedMAS.scale(scale, scale, scale);
                }

                let posZ;
                if (ongoingSimulation){
                    posZ = simulationState[name.substring(1)];
                } else {
                    posZ = module["pos"]["z"];
                }

                var sphere = new THREE.Mesh( geometry_pickedMAS, material_PickedMAS );
                sphere.position.copy(new THREE.Vector3(module["pos"]["x"], posZ*zFactor, module["pos"]["y"]));
                pickedModuleView.add(sphere);

                break;

            case "springDamper":
            case "nlPluck":
            case "nlBow":

                let mass1, mass2;

                if (isPresentInDict(module["m1"], mdl.inOutDict)) {
                    mass1 = mdl.inOutDict[module["m1"]];
                } else {
                    mass1 = mdl.massDict[module["m1"]];
                }

                if (isPresentInDict(module["m2"], mdl.inOutDict)) {
                    mass2 = mdl.inOutDict[module["m2"]];
                } else {
                    mass2 = mdl.massDict[module["m2"]];
                }

                if (ongoingSimulation){
                    m1posZ = simulationState[module["m1"].toString().substring(1)];
                    m2posZ = simulationState[module["m2"].toString().substring(1)];
                } else {
                    m1posZ = mass1["pos"]["z"];
                    m2posZ = mass2["pos"]["z"];
                }

                /* Plan Threejs : X et Z... et Y en vertical. Du coup on adapte. */
                var mass1_altPos = new THREE.Vector3(parseFloat(mass1["pos"]['x']), parseFloat(m1posZ)*zFactor, parseFloat(mass1["pos"]['y']));
                var mass2_altPos = new THREE.Vector3(parseFloat(mass2["pos"]['x']), parseFloat(m2posZ)*zFactor, parseFloat(mass2["pos"]['y']));

                var material_PickedINT = new THREE.MeshBasicMaterial({color: 0xffff00});
                material_PickedINT.wireframe = true;
                material_PickedINT.transparent = true;
                material_PickedINT.opacity = 0.4;

                var vector = new THREE.Vector3();
                vector.subVectors(mass1_altPos, mass2_altPos);
                var middle = new THREE.Vector3();
                middle.subVectors(mass1_altPos, mass2_altPos);
                middle.divideScalar(2);

                var geometry = new THREE.CylinderGeometry(0.05, 0.05, vector.length(), 8, 8);
                var mesh = new THREE.Mesh(geometry, material_PickedINT);
                var axis = new THREE.Vector3(0, 1., 0);
                mesh.quaternion.setFromUnitVectors(axis, vector.clone().normalize());
                mesh.position.copy(mass1_altPos.clone().addScaledVector(vector, -0.5));
                mesh.name = "pickedModuleMesh";
                pickedModuleView.add(mesh);

                break;
            default :
        }
        scene.add(pickedModuleView);
    }

    render();

    /* WORKING but inutile - Forme geometrique conique en guise de pointeur du module picked */
    /*
    var geometryPointer = new THREE.ConeGeometry( 0.5, 1, 6 );
    geometryPointer.rotateX(3.14);
    var materialPointer = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    pointer = new THREE.Mesh( geometryPointer, materialPointer );
    if (typeof pickedModule !== 'undefined' && pickedModule.length > 0) {
        if( pickedModule[1].type == "springDamper"){
            let mass1 = mdl.massDict[pickedModule[1]["m1"]];
            let mass2 = mdl.massDict[pickedModule[1]["m2"]];
            */
    /* Plan Threejs : X et Z... et Y en vertical. Du coup on adapte. */
    /*
                pointer.visible = true;
                pointer.position.x = (parseFloat(mass1["pos"]["x"])+parseFloat(mass2["pos"]["x"]))/2;
                pointer.position.y = (parseFloat(mass1["pos"]["y"])+parseFloat(mass2["pos"]["y"]))/2 + 0.5;
                pointer.position.z = (parseFloat(mass1["pos"]["z"])+parseFloat(mass2["pos"]["z"]))/2;
            } else {
                pointer.visible = true;
                pointer.position.x = parseFloat(pickedModule[1]["pos"]["x"]);
                pointer.position.y = parseFloat(pickedModule[1]["pos"]["z"]) + 1.0;
                pointer.position.z = parseFloat(pickedModule[1]["pos"]["y"]);
            }
        } else {
            pointer.visible = false;
        }
        scene.add( pointer );
    */
}
window.build_pickedModuleView = build_pickedModuleView;
/* TODO */
function update_pickedModuleView() {

}

function clear_pickedModuleView(){
    for (var i = pickedModuleView.children.length - 1; i >= 0; i--) {
        pickedModuleView.remove(pickedModuleView.children[i]);
    }
}

function updateView(){
    build_modelView();
    build_pickedModuleView();
    camera.aspect = $(container).width()/$(container).height();
    renderer.setSize($(container).width(), $(container).height());
    camera.updateProjectionMatrix();
    render();
}
window.updateView = updateView;

function viewResize (){
    camera.aspect = $(container).width()/$(container).height();
    renderer.setSize($(container).width(), $(container).height());
    camera.updateProjectionMatrix();
    render();
}

function render() {
    if(animationPaused){
        raycaster.setFromCamera( mouse, camera );
        //console.log(mouse);
        /* !!!!!!!! FONCTIONNE PARFAITEMENT avec le bon offset sur la souris : mouse.x = (event.offsetX / canvas.width) * 2 - 1; mouse.y = -(event.offsetY / canvas.height) * 2 + 1;
        /* Pour mémoire, les valeurs mouse.x et mouse.y acceptables par le raycaster supposent : 0.,0. au centre du canvas THREEjs, -1.-1. dans l'angle haut gauche.
    */
        var intersects = raycaster.intersectObjects(massesView.children);
        //count and look after all objects in the diamonds group
        if (intersects.length > 0) {
            //console.log(intersects[0].object);
        } else {
            //INTERSECTED = null;
        }
    }
    renderer.render(scene, camera);
}



// LISTENER FOR VIEW SETTINGS (not where it belongs yet... //


document.getElementById("interface_main").addEventListener("change", benchStyleUpdate, false);
document.getElementById("interface_sec").addEventListener("change", modelColorUpdate, false);
document.getElementById("model_mas").addEventListener("change", modelColorUpdate, false);
document.getElementById("model_gnd").addEventListener("change", modelColorUpdate, false);
document.getElementById("model_posIN").addEventListener("change", modelColorUpdate, false);
document.getElementById("model_posOUT").addEventListener("change", modelColorUpdate, false);
document.getElementById("model_frcIN").addEventListener("change", modelColorUpdate, false);
document.getElementById("model_frcOUT").addEventListener("change", modelColorUpdate, false);

function modelColorUpdate (){
    initColors();
    scene.background = new THREE.Color(formatColorString(colorMaterial_Background));
    updateView();
}

function benchStyleUpdate (){
    initColors();
    benchView.getObjectByName("bench").material.color.setHex(formatColorString(colorMaterial_Bench));
    if(view_displayWireBench){
        benchView.getObjectByName("bench").material.wireframe = true;
    } else {
        benchView.getObjectByName("bench").material.wireframe = false;
    }
    updateView();
}

function benchStyleAlpha(alpha){
    benchView.getObjectByName("bench").material.transparent = true;
    benchView.getObjectByName("bench").material.opacity = alpha;
    updateView();
}

function sphereDefinition(value) {
    sphereHeightSegments = value;
    sphereWidthSegments = value;
    initGeometries();
    updateView();
}

function sphereSize(value) {
    sphereSizeFactor = value;
    initGeometries();
    updateView();
}

function formatColorString(string){
    let color = "0x" + string.slice(-6);
    return parseInt(color);
}

function updatePickedModule(pickedObjectName, mdl_module){
    pickedModule = [pickedObjectName, mdl_module];
}

function clearPickedModule(pickedObjectName, mdl_module){
    pickedModule = [];
}

function resetSimulationState(){
    simulationState = [];
}

function pauseAnimation(boolean){
    animationPaused = boolean;
}

function stopSimulation(boolean){
    ongoingSimulation = boolean;
}

function displayMAT(boolean){
    view_displayMAT = boolean;
}

function displayLIA(boolean){
    view_displayLIA = boolean;
}

function displayShadows(boolean){
    view_displayShadows = boolean;
}

function displayWireBench(boolean){
    view_displayWireBench = boolean;
}

function zFactorUpdate(factor){
    zFactor = factor;
    console.log(zFactor);
    //updateView();
}

initView();

/***************************************
/* TENTATIVE EXPORT COMPATIBLE BLENDER */

function exportGLTF(){
    const exporter = new GLTFExporter();

// Parse the input and generate the glTF output
    exporter.parse( scene, function ( gltf ) {
        console.log( gltf );
        downloadJSON( gltf );
    } );
};

function downloadJSON( json, filename ) {

    saveString( JSON.stringify( json ), filename );

}

var link = document.createElement( 'a' );
link.style.display = 'none';
document.body.appendChild( link ); // Firefox workaround, see #6594

function save( blob, filename ) {

    link.href = URL.createObjectURL( blob );
    link.download = filename;
    link.click();

    // URL.revokeObjectURL( url ); breaks Firefox...

}

function saveString( text, filename ) {

    save( new Blob( [ text ], { type: 'text/plain' } ), filename );

}




export { viewResize, updatePickedModule, resetSimulationState, pauseAnimation, displayMAT, displayLIA, displayShadows, displayWireBench, benchStyleUpdate, benchStyleAlpha, sphereDefinition, sphereSize, zFactorUpdate, exportGLTF, clearPickedModule, stopSimulation, mouseOverButtonsInView };
export { framesPerSecond, pickedModule, animationPaused, simulationState, ongoingSimulation }
