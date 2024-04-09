
/*
################################

THREE.JS Model Renderer

################################
 */

var camera, scene, renderer, controls, raycaster, mouse, massesView, interactionsView, canvas, pickableModules, container, pointer;
var pickedModule = [];

function initView() {
    container = document.getElementById('modelView');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe4f2d0);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0xc7e4a1);

    container.appendChild(renderer.domElement);


    camera = new THREE.PerspectiveCamera(50, $(container).width() / $(container).height(), 1., 1000);
    camera.position.set(0, 50, 50);

    controls = new THREE.OrbitControls(camera, renderer.domElement);

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



    window.addEventListener( 'resize', viewResize, false );

    /* Gérer les controls souris !! */
    container.addEventListener("mouseover", function (e) {
        e.preventDefault();
        controls.enabled = true;
    })
    container.addEventListener("mouseout", function () {
        controls.enabled = false;
    })

    container.addEventListener( 'mousemove', onMouseMove, false );
    container.addEventListener( 'mousedown', onMouseDown, false );
    container.addEventListener( 'mouseup', onMouseUp, false );

    controls.addEventListener('change', render);

    massesView = new THREE.Object3D();
    interactionsView = new THREE.Object3D();
    pickableModules = new THREE.Group();

    canvas = document.getElementById('modelView').firstChild;
}

var click ;
function onMouseMove( event ) {
    mouse.x = (event.offsetX / canvas.width*2) * 2 - 1;
    mouse.y = -(event.offsetY / canvas.height*2) * 2 + 1;
    render();
    click = false;
}

function onMouseDown(){
    click = true;
}

function onMouseUp( event ) {
    if(click){
        mouse.x = (event.offsetX / canvas.width) * 2 - 1;
        mouse.y = -(event.offsetY / canvas.height) * 2 + 1;
        let intersects = raycaster.intersectObjects(pickableModules.children, true);
        let moduleID;
        if (intersects.length > 0) {
            pickedObject = intersects[0].object;
            pickedObjectName = pickedObject.name;
            pickedModule = [pickedObjectName, mdl.massDict[pickedObjectName]];
            pickedModuleRefresh();
        } else {
            pickedModule = [];
            pickedModuleRefresh();
        }
    }
}

function buildModel() {

    for (var i = pickableModules.children.length - 1; i >= 0; i--) {
        pickableModules.remove(pickableModules.children[i]);
    }
    for (var i = massesView.children.length - 1; i >= 0; i--) {
        massesView.remove(massesView.children[i]);
    }
    for (var i = interactionsView.children.length - 1; i >= 0; i--) {
        interactionsView.remove(interactionsView.children[i]);
    }
    for (var i = scene.children.length - 1; i >= 0; i--) {
        scene.remove(scene.children[i]);
    }

    var material_MAS = new THREE.MeshBasicMaterial( {color: 0xc63f8c} );
    var material_GND = new THREE.MeshBasicMaterial( {color: 0x3f8cc6} );
    var material_REF = new THREE.LineBasicMaterial( { color: 0xc6793f} );

    const radius = 0.3;
    const widthSegments = 30;
    const heightSegments = 30;
    var geometry_MAS = new THREE.SphereBufferGeometry(radius-radius*0.4, widthSegments, heightSegments);
    var geometry_GND = new THREE.SphereBufferGeometry(radius+radius*0.2, widthSegments, heightSegments);

    let dict = {};
    let posXMax = 0., posXMin = 0.;
    let posYMax = 0., posYMin = 0.;

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
        if(type == "ground") {
            var sphere = new THREE.Mesh(geometry_GND, material_GND);
        } else {
            var sphere = new THREE.Mesh(geometry_MAS, material_MAS);
        }

        /* Plan Threejs : X et Z... et Y en vertical. Du coup on adapte. */
        sphere.position.copy(new THREE.Vector3(posX, posZ, posY));
        sphere.name = name;
        massesView.add(sphere);

        if (name == pickedModule[0]){
            var material_PickedMAT = new THREE.MeshBasicMaterial( {color: 0xffff00} );
            var geometry_pickedMAT = new THREE.SphereGeometry(1, 8, 8 );

            material_PickedMAT.wireframe = true;
            material_PickedMAT.transparent = true;
            material_PickedMAT.opacity = 0.4;

            if(type == "ground"){
                scale = geometry_GND.parameters.radius*1.3;
                geometry_pickedMAT.scale(scale, scale, scale);
            } else {
                scale = geometry_MAS.parameters.radius*1.3;
                geometry_pickedMAT.scale(scale, scale, scale);
            }

            var sphere = new THREE.Mesh( geometry_pickedMAT, material_PickedMAT );
            sphere.position.copy(new THREE.Vector3(posX, posZ, posY));
            scene.add(sphere);
        }
    }
    pickableModules.add( massesView );



    for (let name in mdl.interDict) {
        dict = mdl.interDict[name];
        var points = [];

        let mass1 = mdl.massDict[dict["m1"]];
        let mass2 = mdl.massDict[dict["m2"]];

        /* Plan Threejs : X et Z... et Y en vertical. Du coup on adapte. */
        var mass1_altPos = new THREE.Vector3(parseFloat(mass1["pos"]['x']), parseFloat(mass1["pos"]['z']), parseFloat(mass1["pos"]['y']));
        var mass2_altPos = new THREE.Vector3(parseFloat(mass2["pos"]['x']), parseFloat(mass2["pos"]['z']), parseFloat(mass2["pos"]['y']));

        points.push( mass1_altPos );
        points.push( mass2_altPos );

        var geometry_REF = new THREE.BufferGeometry().setFromPoints( points );
        //geometry_REF.vertices.push(new THREE.Vector3(mass2posX, mass2posY, mass2posZ) );
        var line = new THREE.Line( geometry_REF, material_REF );
        line.name = name;
        interactionsView.add( line );

        if (name == pickedModule[0]) {
            var material_PickedLIA = new THREE.MeshBasicMaterial( {color: 0xffff00} );
            material_PickedLIA.wireframe = true;
            material_PickedLIA.transparent = true;
            material_PickedLIA.opacity = 0.4;

            var vector = new THREE.Vector3();
            vector.subVectors(mass1_altPos,mass2_altPos);
            var middle = new THREE.Vector3();
            middle.subVectors(mass1_altPos,mass2_altPos);
            middle.divideScalar(2);

            var geometry = new THREE.CylinderGeometry(0.05, 0.05, vector.length(), 8, 8);
            var mesh = new THREE.Mesh(geometry, material_PickedLIA);
            var axis = new THREE.Vector3(0, 1., 0);
            mesh.quaternion.setFromUnitVectors(axis, vector.clone().normalize());
            mesh.position.copy(mass1_altPos.clone().addScaledVector(vector, -0.5));
            //mesh.position.copy(mass1_altPos.x, mass1_altPos.y, mass1_altPos.z);

            scene.add(mesh);

        }
    }
    //pickableModules.add( interactionsView );
    //scene.add(pickableModules);

    scene.add(pickableModules);
    scene.add(interactionsView);

    var geometry3 = new THREE.PlaneGeometry( 50, 50, 20, 20);
    geometry3.rotateX(-Math.PI / 2);
    geometry3.translate(0,-0.5,0);
    var material = new THREE.MeshBasicMaterial( {color: 0x8CC63F});
    var plane = new THREE.Mesh( geometry3, material );
    scene.add( plane );


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
    window.scene = scene;
}

function render() {


    raycaster.setFromCamera( mouse, camera );
    console.log(mouse);

    /* !!!!!!!! FONCTIONNE PARFAITEMENT avec le bon offset sur la souris : mouse.x = (event.offsetX / canvas.width) * 2 - 1; mouse.y = -(event.offsetY / canvas.height) * 2 + 1;
    /* Pour mémoire, les valeurs mouse.x et mouse.y acceptables par le raycaster supposent : 0.,0. au centre du canvas THREEjs, -1.-1. dans l'angle haut gauche.
*/
    var intersects = raycaster.intersectObjects(massesView.children);
    //count and look after all objects in the diamonds group
    if (intersects.length > 0) {
        console.log(intersects[0].object);
    } else {
        INTERSECTED = null;
    }
    /*
    !!!!!!!!!!!!!!! */

    renderer.render(scene, camera);
};

function viewRefresh(){
    mims2faust();
    if(mdl.isValid()){
        buildModel();
        camera.aspect = $(container).width()/$(container).height();
        renderer.setSize($(container).width(), $(container).height());
        camera.updateProjectionMatrix();
    }
    render();
};
window.viewRefresh = viewRefresh;

function viewResize (){
    camera.aspect = $(container).width()/$(container).height();
    renderer.setSize($(container).width(), $(container).height());
    camera.updateProjectionMatrix();
    render();
};

initView();
viewRefresh();
