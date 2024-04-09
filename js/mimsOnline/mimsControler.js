

import * as mims3DView from './mims3DView.js';
import {viewResize, updatePickedModule, resetSimulationState, pauseAnimation, displayLIA, displayMAT, displayShadows, displayWireBench, benchStyleUpdate, benchStyleAlpha, sphereDefinition, sphereSize, zFactorUpdate, exportGLTF, clearPickedModule, stopSimulation, mouseOverButtonsInView} from './mims3DView.js';
import {framesPerSecond, pickedModule, animationPaused, simulationState } from './mims3DView.js';


/* Instances de CodeMirror : MIMS, Faust/Gen, ScriptJSGenerator */

var mims = CodeMirror.fromTextArea(document.getElementById("mimscode"), {
    mode:  "javascript",
    lineNumbers: true,
    lineWrapping:true,
    extraKeys: {"Cmd-Enter": "compile"},
    styleActiveLine: true,
    styleActiveSelected: true,
    //highlightSelectionMatches: {showToken: /\w/, annotateScrollbar: true}
});



var converter = CodeMirror.fromTextArea(document.getElementById("faustcode"), {
    lineNumbers: true,
    autoCloseBrackets: true,
    lineWrapping:true,

    //highlightSelectionMatches: {showToken: /\w/, annotateScrollbar: true}
});

var jscode = CodeMirror.fromTextArea(document.getElementById("jscode"), {
    mode:  "javascript",
    lineNumbers: true,
    lineWrapping:true,
    extraKeys: {"Cmd-Enter": "compile"},
});
jscode.setSize(null, 300);

var genCodeArray = [];
var modelHasChanged = false;


var sceneOn = false;

(function main($) {

    $(document).ready(function(){
        $("#mimsExport").click(function(){
            var modelName = document.getElementById("modelName").value;
            var fileName;
            if (modelName == null || modelName == "")
                fileName = "Default.mdl";
            else if (modelName.endsWith('.mdl'))
                fileName = modelName;
            else fileName = modelName.concat(".mdl");
            download(fileName,mims.getValue());
        });

        $("#mimsImport").click(function() {
            $("#mimsFile").click();
        });

        $("#mimsFile").on('change', function () {
            var fichiersInput = document.querySelector("#mimsFile");
            var fichiers = fichiersInput.files;
            var fichier = fichiers[0];

            $("#modelName").val(fichier.name);

            readFile(this.files[0], function(e) {
                // use result in callback...
                mims.setValue(e.target.result);
            });
        });
    });


    $(document).ready(function(){

        var example;
        var elemOverlay = document.getElementById("viewOverlay-examples");
        elemOverlay.style.visibility = "hidden";
        $("#mimsExamples").click(function(){
            if(elemOverlay.style.visibility === "hidden"){
                $("#clickHelp").click();
                elemOverlay.style.visibility = "visible";
            } else {
                elemOverlay.style.visibility = "hidden";
            }
        });

        var elemSelector = document.getElementById("model-select");
        elemSelector.addEventListener('change', function() {
            example = elemSelector.options[elemSelector.selectedIndex].value;

            var url = "./js/mimsOnline/examples/".concat(example, ".html");
            var xhr= new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onreadystatechange= function() {
                if (this.readyState!==4) return;
                if (this.status!==200) return;
                document.getElementById('help-content').innerHTML= this.responseText;
            };
            xhr.send();
        });

        $('#model-load').on('click',function(e){
            if (example === undefined){

            } else {
                var url = "./js/mimsOnline/examples/".concat(example, ".mdl");
                var xhr= new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.onreadystatechange= function() {
                    if (this.readyState!==4) return;
                    if (this.status!==200) return;
                    mims.setValue(this.responseText);
                };
                xhr.send();

                $("#clickView").click();

                document.getElementById("viewOverlay-examples").style.visibility ='hidden';
            }
        });

    });






    function readFile(file, onLoadCallback){
        var reader = new FileReader();
        reader.onload = onLoadCallback;
        reader.readAsText(file);
    }

    /* Connection des functions aux boutons du header du converter */
    $(document).ready(function(){
        $("#faustRefresh").click(function(){
            mims2faust();
        });
    });

    $(document).ready(function(){
        $("#genRefresh").click(function(){
            mims2gen();
        });
    });

    $(document).ready(function(){
        $("#faustRun").click(function(){
            window.open("https://faustide.grame.fr/","_blank")
        });
    });

    $(document).ready(function(){
        $("#faustExport").click(function(){
            var modelName = document.getElementById("modelName").value;
            var fileName;
            if (modelName == null || modelName == "")
                fileName = "Default.dsp";
            else fileName = modelName.concat(".dsp");
            download(fileName,converter.getValue());
        });
    });

    $(document).ready(function(){
        $("#genExport").click(function(){
            var modelName = document.getElementById("modelName").value;
            var fileName;
            if (modelName == null || modelName == "")
                fileName = "Default.gendsp";
            else fileName = modelName.concat(".gendsp");
            download(fileName,buildGendspPatch(genCodeArray));

        });
    });

    $(document).ready(function(){
        $("#updateModelinView").click(function(){
            updateModelinView();
        });
    });

    $(document).ready(function(){
        $("#viewSimulate").click(function(){

            if($('#viewSimulate').hasClass('active')) {
                stopSimulation(false);
                pauseAnimation(true);
                resetParametersControls();
                updateView();

                $('#simulateRun').removeClass('active');
                $('#simulatePause').removeClass('active');
                $('#viewSimulate').removeClass('active');
                $( "#viewOverlay-simulate" ).fadeOut( 100, function() {});
                $( "#viewOverlay-simulationControls" ).fadeOut( 100, function() {});

            } else {
                $('#viewSimulate').addClass('active');
                stopSimulation(true);
                createSimulationJS();
                updateView();
                generateParametersControls();
                generateInputsControls();

                $( "#viewOverlay-simulate" ).fadeIn( 100, function() {});
                $( "#viewOverlay-simulationControls" ).fadeIn( 100, function() {});
            }
        });
    });

    $(document).ready(function(){
        $("#simulateInit").click(function(){

            resetSimulationState();
            createSimulationJS();
            updateView();

            if($('#simulateRun').hasClass('active')) {
                $('#simulateRun').removeClass('active');
            }
            if($('#simulatePause').hasClass('active')) {
                $('#simulatePause').removeClass('active');
            }
            if($('#simulateRec').hasClass('active')) {
                $('#simulateRec').removeClass('active');
            }
            $('#simulateInit').addClass('active');
            setTimeout(function(){ $('#simulateInit').removeClass('active');}, 100)
        });
        
        $("#simulateRun").click(function(){

            pauseAnimation(false);
            animate();

            if($('#simulateRun').hasClass('active')) {
            } else {
                $('#simulateRun').addClass('active');
            }
            if($('#simulatePause').hasClass('active')) {
                $('#simulatePause').removeClass('active');
            }
        });

        $("#simulateOneStep").click(function(){

            pauseAnimation(true);
            animateOneStep();

            if($('#simulateRun').hasClass('active')) {
                $('#simulateRun').removeClass('active');
            }
            if($('#simulatePause').hasClass('active')) {
            } else {
                $('#simulatePause').addClass('active');
            }
            $('#simulateOneStep').addClass('active');
            setTimeout(function(){ $('#simulateOneStep').removeClass('active');}, 100) ;
        });

        $("#simulatePause").click(function(){
            pauseAnimation(true);
            if($('#simulateRun').hasClass('active')) {
                $('#simulateRun').removeClass('active');
            }
            $('#simulatePause').addClass('active');
        });

        $("#simulateRec").click(function(){
            saveImage(1);
            //exportGLTF();
        });

        $("#simulateRec10").click(function(){
            saveImage(10);
            //exportGLTF();
        });


        $("#simulateInit, #simulateRun, #simulateOneStep, #simulatePause, #simulateRec, #simulateRec10 ").mouseenter(function() {
            mouseOverButtonsInView(true);
        })

        $("#simulateInit, #simulateRun, #simulateOneStep, #simulatePause, #simulateRec, #simulateRec10 ").mouseleave(function() {
            mouseOverButtonsInView(false);
        })



    });

    $(document).ready(function(){
        $("#viewSettings").click(function(){
            if ($("#viewOverlay-simulationVisualParameters").is(":hidden")){
                $( "#viewOverlay-simulationVisualParameters" ).fadeIn( 100, function() {});
            } else {
                $( "#viewOverlay-simulationVisualParameters" ).fadeOut( 100, function() {});
            }
        });
    });

    $(document).ready(function(){
        $("#viewFullscreen").click(function(){
            openFullscreen();
        });
    });

    document.addEventListener("visibilitychange", function() {
        if (document.visibilityState === 'visible') {
        } else {
            pauseAnimation(true);
            if($('#simulateRun').hasClass('active')) {
                $('#simulateRun').removeClass('active');
            }
            $('#simulatePause').addClass('active');
        }
    });



    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }
})(jQuery);


var redMark = function () {
    $('.sidebar').find('.CodeMirror').css({"background-color" : "rgba(198, 63, 140, 0.4)"});
    $('.footerDrawer .content').show("fast");
    $('#viewOverlay-locker').addClass("locked");
    document.getElementById('viewOverlay-locker').innerHTML = '<p class="error"> '+ "faulty MIMS script<br> no render available" + ' </p>';
};

var redUnmark = function () {
    $('.sidebar').find('.CodeMirror').css({"background-color" : "white"});
    $('#viewOverlay-locker').removeClass("locked");
    document.getElementById('viewOverlay-locker').innerHTML = '';
};


function mims2faust(){
    redUnmark();
    mimsConsole();
    try {
        parseMIMSFile(mims.getValue());
    } catch (e) {
        mimsConsole("Errors detected during the model script parsing.", e);
        redMark();
    }

    if(mdl.isValid()){
        try {
            converter.setValue(generateFaustDSP());
        } catch (e) {
            mimsConsole("Errors detected during Faust DSP code generation.", e);
            redMark();
            throw "Error in code conversion";
        }
    }

    modelHasChanged = true;
}
window.mims2faust = mims2faust;


function mims2gen(){
    redUnmark();
    mimsConsole();

    try {
        parseMIMSFile(mims.getValue());
    } catch (e) {
        mimsConsole("Errors detected during the model script parsing.", e);
        redMark();
    }

    if(mdl.isValid()){
        try {
            genCodeArray = generateGenDSP();
            converter.setValue(genCodeArray[0].replace());
        } catch (e) {
            mimsConsole("Errors detected during Gen DSP code generation.", e);
            redMark();
        }
    }
    modelHasChanged = true;

}
window.mims2gen = mims2gen;


(function ($) {
    $(document).ready(function(){
        var toto = Split(['#split1', '#split2'], {
            sizes: [65, 35],
            gutter: function (index, direction) {
                var gutter = document.createElement('div')
                gutter.className = 'gutter gutter-' + direction
                return gutter
            },
            gutterSize: 12,
            minSize: [400, 400],
            onDrag: function(sizes) {
                viewResize();
            },
        });

        function throttle (callback, limit) {
            var wait = false;
            return function () {
                if (!wait) {
                    callback.apply(null, arguments);
                    wait = true;
                    setTimeout(function () {
                        wait = false;
                    }, limit);
                }
            }
        }

    });



    /* MIMS Console ui and log */
    $(document).ready(function() {
        $('.footerDrawer #mimsTerminal').on('click', function() {
            $('.footerDrawer .content').slideToggle();
        });
    });

    /* old version - pushing all console message in a specific div */
    /*
    $(document).ready(function() {
        var realConsoleLog = console.log;
        console.log = function () {
            var message = [].join.call(arguments, " ");
            realConsoleLog.apply(console, arguments);
            var p = document.createElement("p"); //create the paragraph tag
            p.classList += 'log'; // give it a class by adding to the list
            p.innerHTML = message; // add html text or make another element if needed.
            $(".consoleOutput").append(p);
        };
    });
    */

    function mimsConsole(s = "All good so far !", e) {
        e = typeof e !== 'undefined' ?  e : "";
        $(".feedback-state-content").text(s);
        $(".feedback-error-content").text(e);
    }
    window.mimsConsole = mimsConsole;

})(jQuery);


(function ($) {
    $(document).ready(function(){
        $('.accordion-toggle').on('click',function(e){
            if($(this).parents('.panel').children('.accordion-body').hasClass('in')){
                e.stopPropagation();
            }
        });

        window.onresize = resize;
        resize();
    });

    function resize(){
        var tabsHeight = $('.panel-heading').outerHeight() * $('.panel-heading').length;
        var height = $('#accordion').innerHeight() - tabsHeight;

        $('.accordion-inner').height(height);
    }

    $(document).ready(function(){
        $(".collapse-converter").on('shown.bs.collapse', function(){
            if($("#toggle-converter").is(":checked")){
                mims2gen();
            } else {
                mims2faust();
            }
        });
    });

    $(document).ready(function(){
        $(".collapse-view").on('shown.bs.collapse', function(){
            if(!sceneOn){
                updateModelinView();
            }
            viewResize();
        });
    });

    $( "#faustExport" ).hide();
    $( "#faustRefresh" ).hide();
    $( "#faustRun" ).hide();

    $( "#genExport" ).hide();
    $( "#genRefresh" ).hide();

    $( "#updateModelinView" ).hide();
    $( "#viewSimulate" ).hide();
    $( "#viewSettings" ).hide();
    $( "#viewFullscreen" ).hide();


    $("#collapse3").on('shown.bs.collapse', function() {
        $( "#updateModelinView" ).show( 100, function() {
            $( "#viewSimulate" ).show( 100, function() {
                $( "#viewSettings" ).show( 100, function() {
                    $("#viewFullscreen").show(100, function () {
                    });
                });
            });
        });
    });

    $("#collapse3").on('hidden.bs.collapse', function() {

        if($('#viewSimulate').hasClass('active')) {
            $("#viewSimulate").click();
        }

        if ($("#viewOverlay-simulationVisualParameters").is(":hidden")){
        } else {
            $( "#viewOverlay-simulationVisualParameters" ).fadeOut( 100, function() {});
        }

        $('#simulatePause').addClass('active');
        $( "#updateModelinView" ).hide( 100, function() {
            $( "#viewSimulate" ).hide( 100, function() {
                $( "#viewSettings" ).hide( 100, function() {
                    $( "#viewFullscreen" ).hide( 100, function() {
                    });
                });
            });
        });
    });

    $("#collapse4").on('shown.bs.collapse', function() {
        if($(".toggle-converter").is(":checked")) {
            $("#genRefresh").show(100, function () {
                $("#genExport").show(100)
            });
        } else {
            $("#faustRefresh").show(100, function () {
                $("#faustRun").show(100, function () {
                    $("#faustExport").show(100)
                });
            });
        }
        document.getElementById("toggle-converter").disabled = false;
    });

    $("#collapse4").on('hidden.bs.collapse', function() {
        $( "#faustRefresh" ).hide( 100, function() {
            $("#faustRun").hide( 100, function () {
                $("#faustExport").hide( 100)
            });
        });
        $( "#genRefresh" ).hide( 100, function() {
            $("#genExport").hide( 100)
        });

        document.getElementById("toggle-converter").disabled = true;

    });

    $(document).ready(function() {
        document.getElementById("toggle-converter").disabled = true;
    });

    function toggleConverter(){
        if($(".toggle-converter").is(":checked")){
            setTimeout(function() {
                $('#gen').addClass('on');
                $('#faust').removeClass('on');
                $( "#faustRefresh" ).hide( 100, function() {
                    $("#faustRun").hide( 100, function () {
                        $("#faustExport").hide( 100)
                    });
                });
                $("#genRefresh").show(100, function () {
                    $("#genExport").show(100)
                });
            }, 500);
            mims2gen();
        } else {
            setTimeout(function() {
                $('#faust').addClass('on');
                $('#gen').removeClass('on');

                $("#faustRefresh").show(100, function () {
                    $("#faustRun").show(100, function () {
                        $("#faustExport").show(100)
                    });
                });

                $( "#genRefresh" ).hide( 100, function() {
                    $("#genExport").hide( 100)
                });
            }, 500);
            mims2faust();
        };
    }
    window.toggleConverter = toggleConverter;

    function toggleMATView(){
        if($(".toggle-MATView").is(":checked")){
            displayMAT(true);
            updateView();
        } else {
            displayMAT(false);
            updateView();
        }
    }
    window.toggleMATView = toggleMATView;

    function toggleLIAView(){
        if($(".toggle-LIAView").is(":checked")){
            displayLIA(true);
            updateView();
        } else {
            displayLIA(false);
            updateView();
        }
    }
    window.toggleLIAView = toggleLIAView;

    function toggleShadows(){
        if($(".toggle-Shadows").is(":checked")){
            displayShadows(true);
            updateView();
        } else {
            displayShadows(false);
            updateView();
        }
    }
    window.toggleShadows = toggleShadows;

    function toggleWireBench(){
        if($(".toggle-WireBench").is(":checked")){
            displayWireBench(true);
            benchStyleUpdate();
        } else {
            displayWireBench(false);
            benchStyleUpdate();
        }
    }
    window.toggleWireBench = toggleWireBench;


    window.onresize = resize;
    resize();

    var userInMIMSEditor = false;
    mims.on("focus", function () {
        userInMIMSEditor = true;
        pickedLineRefresh();
    });
    mims.on("blur", function () {
        userInMIMSEditor = false;
    });
    mims.on("cursorActivity", function () {
        if(userInMIMSEditor){
            pickedLineRefresh();
        }
    });

    /* Usefull block ?*/
    /* Refresh faust and view when keydown in codemirror mims element (for the view, only when keypress for enter and delete keys */

    $( ".mims" ).keydown(function( event ) {
        //indexIDsLines();
        //checkDuplicateIDs();
        localStorage.setItem("mimsCode", mims.getValue());

        if ($('#toggle-autoCompile').is(":checked")) {
            if (event.which == 13 || event.which == 8 || event.which == 46){
                if($('#collapse3').hasClass('in')) {
                    updateModelinView();
                }
            }
            if($('#collapse4').hasClass('in')) {
                if($("#toggle-converter").is(":checked")){
                    mims2gen();
                } else {
                    mims2faust();
                }
            }
        }
    });

    $( ".mims" ).keyup(function( event ) {
        //indexIDsLines();
        //checkDuplicateIDs();
        if (event.which == 91 || event.which == 93 || event.which == 46){
            if($('#collapse3').hasClass('in')) {
                updateModelinView();
            }
            if($('#collapse4').hasClass('in')) {
                if($("#toggle-converter").is(":checked")){
                    mims2gen();
                } else {
                    mims2faust();
                }
            }
        }
    });


})(jQuery);




function initHelpDisplay() {
    var xhr= new XMLHttpRequest();

    xhr.open('GET', "./js/mimsOnline/mims-doc/welcome.html", true);
    xhr.onreadystatechange= function() {
        if (this.readyState!==4) return;
        if (this.status!==200) return;
        document.getElementById('help-content').innerHTML= this.responseText;
    };
    xhr.send();
}


// A placer dans un bloc sequence de Demarage - Global Init quand tout les element de la page html sont charges
initHelpDisplay();


function initParamDisplay() {
    document.getElementById("param_M").disabled = true;
    document.getElementById("param_K").disabled = true;
    document.getElementById("param_Z").disabled = true;
    document.getElementById("mass_X").disabled = true;
    document.getElementById("mass_Y").disabled = true;
    document.getElementById("mass_Z").disabled = true;
}

// A placer dans un bloc sequence de Demarage - Global Init quand tout les element de la page html sont charges
initParamDisplay();


function pickedModuleRefresh(){
    if (pickedModule.length > 0) {
        if(lineFromModuleID(pickedModule[0]) !== mims.getCursor().line){
            //console.log('lignedepuismodule '+lineFromModuleID(pickedModule[0]));
            //console.log('autre '+mims.getCursor().line);
            mims.setCursor(lineFromModuleID(pickedModule[0]), 0);
        }

        document.getElementById('viewOverlay-moduleID').innerHTML = '<p> '+ pickedModule[0] + ' </p>';
        document.getElementById('viewOverlay-log').style.display = 'flex';

        const module = pickedModule[1]
        const moduleType = module.type;
        let possibleParamM, possibleParamK, possibleParamZ;

        switch (moduleType) {
            case 'mass':
                /* IF MASS MODULE */
                build_pickedModuleView();

                ['param_M', 'mass_X', 'mass_Y', 'mass_Z'].forEach(function(e){
                    let element = document.getElementById(e);
                    element.disabled = false;
                    element.parentNode.classList.add('active');
                });
                ['param_K', 'param_Z'].forEach(function(e){
                    let element = document.getElementById(e);
                    element.disabled = true;
                    element.value = null;
                    element.parentNode.classList.remove('active');
                });

                /* Dealing with global model parameters */
                possibleParamM = "@" + module["args"][0];
                if (mdl.paramDict[possibleParamM] !== undefined){
                    document.getElementById("param_M").value = parseFloat(mdl.paramDict[possibleParamM]["args"]);
                } else {
                    document.getElementById("param_M").value = parseFloat(module["args"][0]);
                }

                document.getElementById("mass_X").value = module["pos"]["x"];
                document.getElementById("mass_Y").value = module["pos"]["y"];
                document.getElementById("mass_Z").value = module["pos"]["z"];

                break;

            case 'ground':
            case 'posInput':

                build_pickedModuleView();

                ['mass_X', 'mass_Y', 'mass_Z'].forEach(function(e){
                    let element = document.getElementById(e);
                    element.disabled = false;
                    element.parentNode.classList.add('active');
                });
                ['param_M', 'param_K', 'param_Z'].forEach(function(e){
                    let element = document.getElementById(e);
                    element.disabled = true;
                    element.value = null;
                    element.parentNode.classList.remove('active');
                });

                document.getElementById("mass_X").value = parseFloat(module["pos"]["x"]);
                document.getElementById("mass_Y").value = parseFloat(module["pos"]["y"]);
                document.getElementById("mass_Z").value = parseFloat(module["pos"]["z"]);

                break;

            case 'springDamper':

                build_pickedModuleView();

                ['param_K', 'param_Z'].forEach(function(e){
                    let element = document.getElementById(e);
                    element.disabled = false;
                    element.parentNode.classList.add('active');
                });
                ['mass_X', 'mass_Y', 'mass_Z', 'param_M'].forEach(function(e){
                    let element = document.getElementById(e);
                    element.disabled = true;
                    element.value = null;
                    element.parentNode.classList.remove('active');
                });

                /* Dealing with global model parameters */
                possibleParamK = "@" + module["args"][0];
                possibleParamZ = "@" + module["args"][1];

                if (mdl.paramDict[possibleParamK] !== undefined){
                    document.getElementById("param_K").value = parseFloat(mdl.paramDict[possibleParamK]["args"]);
                } else {
                    document.getElementById("param_K").value = parseFloat(module["args"][0]);
                }

                if (mdl.paramDict[possibleParamZ] !== undefined){
                    document.getElementById("param_Z").value = parseFloat(mdl.paramDict[possibleParamZ]["args"]);
                } else {
                    document.getElementById("param_Z").value = parseFloat(module["args"][1]);
                }

                break;

            case 'osc':
                /* IF OSC MODULE */
                build_pickedModuleView();

                ['param_M', 'mass_X', 'mass_Y', 'mass_Z', 'param_K', 'param_Z'].forEach(function(e){
                    let element = document.getElementById(e);
                    element.disabled = false;
                    element.parentNode.classList.add('active');
                });

                /* Dealing with global model parameters */
                possibleParamM = "@" + module["args"][0];
                possibleParamK = "@" + module["args"][1];
                possibleParamZ = "@" + module["args"][2];

                if (mdl.paramDict[possibleParamM] !== undefined){
                    document.getElementById("param_M").value = parseFloat(mdl.paramDict[possibleParamM]["args"]);
                } else {
                    document.getElementById("param_M").value = parseFloat(module["args"][0]);
                }

                if (mdl.paramDict[possibleParamK] !== undefined){
                    document.getElementById("param_K").value = parseFloat(mdl.paramDict[possibleParamK]["args"]);
                } else {
                    document.getElementById("param_K").value = parseFloat(module["args"][1]);
                }

                if (mdl.paramDict[possibleParamZ] !== undefined){
                    document.getElementById("param_Z").value = parseFloat(mdl.paramDict[possibleParamZ]["args"]);
                } else {
                    document.getElementById("param_Z").value = parseFloat(module["args"][2]);
                }

                document.getElementById("mass_X").value = module["pos"]["x"];
                document.getElementById("mass_Y").value = module["pos"]["y"];
                document.getElementById("mass_Z").value = module["pos"]["z"];

                break;


            default:
                console.log(moduleType + " modules are not yet implemented");
                build_pickedModuleView();
                ['param_M', 'param_K', 'param_Z','mass_X', 'mass_Y', 'mass_Z'].forEach(function(e){
                    let element = document.getElementById(e);
                    element.disabled = true;
                    element.value = null;
                    element.parentNode.classList.remove('active');
                });
        }

        pushModuleToStrike();

    } else {
        document.getElementById('viewOverlay-moduleID').innerHTML = '';
        document.getElementById('viewOverlay-log').style.display = 'none';
        build_pickedModuleView();
    }
}
window.pickedModuleRefresh = pickedModuleRefresh;

/* Dealing with model alteration and codeMirror + View update when new input in param fields from 3D View (on picked module)*/
$('#param_M').on('input', function () {
    updateModuleParam('M', $(this).val());
});
$('#param_K').on('input', function () {
    updateModuleParam('K', $(this).val());
});
$('#param_Z').on('input', function () {
    updateModuleParam('Z', $(this).val());
});
$('#mass_X').on('input', function () {
    updateModuleParam("x", $(this).val());
    updateView();
});
$('#mass_Y').on('input', function () {
    updateModuleParam("y", $(this).val());
    updateView();
});
$('#mass_Z').on('input', function () {
    updateModuleParam("z", $(this).val());
    updateView();
});

function updateModuleParam(paramType, newVal){
    const moduleType = pickedModule[1].type ;
    switch (paramType) {
        case 'M':
            pickedModule[1]["args"][0] = newVal;
            break;
        case 'K':
            switch (moduleType) {
                case 'springDamper': pickedModule[1]["args"][0] = newVal; break;
                default : pickedModule[1]["args"][1] = newVal; break;
            }
            break;
        case 'Z':
            switch (moduleType) {
                case 'springDamper': pickedModule[1]["args"][1] = newVal; break;
                default : pickedModule[1]["args"][2] = newVal; break;
            }
            break;
        case 'x':
            pickedModule[1]["pos"]["x"] = newVal;
            break;
        case 'y':
            pickedModule[1]["pos"]["y"] = newVal;
            break;
        case 'z':
            pickedModule[1]["pos"]["z"] = newVal;
            break;
        default:
            console.log(`updateModuleParam : not in any case`);
    }
    updateModuleLine();
}

function updateModuleLine(){
    var codeLine_content;
    var codeLine_index;

    const moduleType = pickedModule[1].type ;
    switch (moduleType) {
        case 'mass':
            codeLine_content = pickedModule[0]+" "+pickedModule[1].type+" "+pickedModule[1]["args"][0]+" ["+pickedModule[1]["pos"]["x"]+" "+pickedModule[1]["pos"]["y"]+" "+pickedModule[1]["pos"]["z"]+"] "+pickedModule[1]["vel"]["z"];
            codeLine_index = lineFromModuleID(pickedModule[0]);
            mims.replaceRange(codeLine_content, {line: codeLine_index, ch: 0}, {line: codeLine_index});
            break;
        case 'ground':
        case 'posInput':
            codeLine_content = pickedModule[0]+" "+pickedModule[1].type+" ["+pickedModule[1]["pos"]["x"]+" "+pickedModule[1]["pos"]["y"]+" "+pickedModule[1]["pos"]["z"]+"]";
            codeLine_index = lineFromModuleID(pickedModule[0]);
            mims.replaceRange(codeLine_content, {line: codeLine_index, ch: 0}, {line: codeLine_index});
            break;
        case 'osc':
            codeLine_content = pickedModule[0]+" "+pickedModule[1].type+" "+pickedModule[1]["args"][0]+" "+pickedModule[1]["args"][1]+" "+pickedModule[1]["args"][2]+" ["+pickedModule[1]["pos"]["x"]+" "+pickedModule[1]["pos"]["y"]+" "+pickedModule[1]["pos"]["z"]+"] "+pickedModule[1]["vel"]["z"];
            codeLine_index = lineFromModuleID(pickedModule[0]);
            mims.replaceRange(codeLine_content, {line: codeLine_index, ch: 0}, {line: codeLine_index});
            break;
        case 'springDamper':
            codeLine_content = pickedModule[0]+" "+pickedModule[1].type+" "+pickedModule[1].m1+" "+pickedModule[1].m2+" "+pickedModule[1]["args"][0]+" "+pickedModule[1]["args"][1];
            codeLine_index = lineFromModuleID(pickedModule[0]);
            mims.replaceRange(codeLine_content, {line: codeLine_index, ch: 0}, {line: codeLine_index});
            break;

        default:
            console.log("updateModuleLine : not in any case");
    }



}








(function paramEditor(){

})(jQuery);






(function codemirrorHandler() {

    function pickedLineRefresh() {

        var xhr= new XMLHttpRequest();

        xhr.open('GET', "./js/mimsOnline/mims-doc/welcome.html", true);
        xhr.onreadystatechange= function() {
            if (this.readyState!==4) return;
            if (this.status!==200) return;
            document.getElementById('help-content').innerHTML= this.responseText;
        };
        xhr.send();

        /* Not used but might be usefull at some point */
        var wordBoudaries = mims.findWordAt(mims.getCursor()); /* get the word the cursor is at as a string - step one : seeking for first and last car of the word*/
        var word = mims.getRange(wordBoudaries.anchor, wordBoudaries.head); /* step two : getting the word given data of previous step */

        /* Function for pushing html content relative to a WORD cursor is at in mims editor */
        /*
        if (['mass', 'springDamper', 'ground', 'frcInput', 'posOutput'].indexOf(word) >= 0) {
            console.log("identified");
            //document.getElementById('help').innerHTML = '<ol><li>html data</li></ol>';

            var root = "./js/mimsOnline/mims-doc/";
            var extension = "-doc.html";
            var url = root.concat(word, extension);

            var xhr= new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onreadystatechange= function() {
                if (this.readyState!==4) return;
                if (this.status!==200) return; // or whatever error handling you want
                //document.getElementById('help').innerHTML= this.responseText;
            };
            xhr.send();
        }
        */

        /* Function for pushing html content relative to a WORD spoted on the line the cursor is at in mims editor */
        var lineContent = mims.getLine(mims.getCursor().line); /* get the content of the line the cursor is at as a string */
        var lineWords = lineContent.split(" ");
        lineWords.forEach(function (item, index) {
            /* crossing each word of the line with the available mims functions documentation - respecting the following format : given "nameOfTheFunction" -> nameOfTheFunction-doc.html */
            if (['audioParam', 'chain', 'contact', 'damper', 'frcInput', 'frcOutput', 'ground', 'mass', 'massG', 'nlBow', 'nlPluck', 'nlContact', 'nlSpringDamper', 'osc', 'param', 'posInput', 'posOutput', 'spring', 'springDamper'].indexOf(item) >= 0) {
                var root = "./js/mimsOnline/mims-doc/";
                var extension = "-doc.html";
                var url = root.concat(item, extension);

                xhr.open('GET', url, true);
                xhr.onreadystatechange= function() {
                    if (this.readyState!==4) return;
                    if (this.status!==200) return;
                    document.getElementById('help-content').innerHTML= this.responseText;
                };
                xhr.send();

                if(['mass', 'ground', 'springDamper', 'osc', 'nlPluck', 'nlBow', 'nlContact', 'contact', 'posInput', 'frcInput', 'posOutput', 'frcOutput'].indexOf(item) >= 0){
                    var pickedModuleName = moduleNameAtLine(mims.getLine(mims.getCursor().line));
                    if (isPresentInDict(pickedModuleName, mdl.massDict)) {
                        updatePickedModule(pickedModuleName, mdl.massDict[pickedModuleName]);
                        pickedModuleRefresh();
                    } else if (isPresentInDict(pickedModuleName, mdl.interDict)) {
                        updatePickedModule(pickedModuleName, mdl.interDict[pickedModuleName]);
                        pickedModuleRefresh();
                    } else if (isPresentInDict(pickedModuleName, mdl.inOutDict)){
                        updatePickedModule(pickedModuleName, mdl.inOutDict[pickedModuleName]);
                        pickedModuleRefresh();
                    } else {
                        console.log("Not a module !?");
                    }
                }
            }
        });
    }
    window.pickedLineRefresh = pickedLineRefresh;


    /* Function to identify mims modules ID duplication */
    /* V1 */ /* V2 : parser en arbre convergent ? */
    function checkDuplicateIDs(){
        var IDs_values = [];
        var IDs_index = [];
        mims.eachLine(function (line) {
            var c = line.text;
            var c0 = c.charAt(0);
            if (c0 == '@'){
                var n = c.indexOf(" ");
                var id = '@';
                for (let i = 1; i < n; i++) {
                    id = id.concat(c.charAt(i));
                }
                IDs_values.push(id);
                var lineNb = mims.getLineNumber(line);
                IDs_index.push(lineNb);
                mims.removeLineClass(lineNb, 'wrap','duplicate')
            }
        })

        let findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) != index)
        var DuplicateIDs_values = findDuplicates(IDs_values);

        function getAllIndexes(arr, val) {
            var indexes = [], i;
            for(i = 0; i < arr.length; i++)
                if (arr[i] === val)
                    indexes.push(i);
            return indexes;
        }

        if (typeof DuplicateIDs_values !== 'undefined' && DuplicateIDs_values.length > 0) {
            var DuplicateIDs_index = [];
            DuplicateIDs_values.forEach(element => DuplicateIDs_index.push(getAllIndexes(IDs_values, element)));
            DuplicateIDs_index = DuplicateIDs_index.flat();

            DuplicateIDs_index.forEach(element => mims.addLineClass(IDs_index[element], 'wrap','duplicate'));
        }
    }
    window.checkDuplicateIDs = checkDuplicateIDs;



    var IDs_values, IDs_index = [];

    function moduleNameAtLine(line){
        var firstNonWhiteChar = line.search(/\S|$/);
        if (line.charAt(firstNonWhiteChar) == '@') {
            var n = line.indexOf(" ", firstNonWhiteChar);
            var id = '@';
            for (let i = firstNonWhiteChar+1; i < n; i++) {
                id = id.concat(line.charAt(i));
            }
        }
        return id
    }

/* Obsolete - a adapter en faisant appel a la function moduleNameAtLine() */
    function indexIDsLines(){
        IDs_values = [];
        IDs_index = [];
        mims.eachLine(function (line) {
            var c = line.text;
            var c0 = c.charAt(0);
            if (c0 == '@'){
                var n = c.indexOf(" ");
                var id = '@';
                for (let i = 1; i < n; i++) {
                    id = id.concat(c.charAt(i));
                }
                IDs_values.push(id);
                var lineNb = mims.getLineNumber(line);
                IDs_index.push(lineNb);
            }
        })
    }
    window.indexIDsLines = indexIDsLines;

    function lineFromModuleID(label){
        if (IDs_values === undefined || IDs_values.length == 0. || modelHasChanged)
            indexIDsLines();
        return IDs_index[IDs_values.indexOf(label)];
    }
    window.lineFromModuleID = lineFromModuleID;


    /* Autocompletion intgration */
    mims.setOption('extraKeys', {
        'Cmd-E': function() {
            snippet()
        },
        'Ctrl-E': function() {
            snippet()
        }
    })

    const snippets = [
        { text: 'const', displayText: 'const declarations' },
        { text: 'let', displayText: 'let declarations' },
        { text: 'var', displayText: 'var declarations' },
    ];

    function snippet() {
        CodeMirror.showHint(mims, function () {
            const cursor = mims.getCursor();
            const token = mims.getTokenAt(cursor);
            const start = token.start;
            const end = cursor.ch;
            const line = cursor.line;
            const currentWord = token.string;

            // 入力した文字列をスニペット配列から探す
            const list = snippets.filter(function (item) {
                return item.text.indexOf(currentWord) >= 0
            })

            return {
                list: list.length ? list : snippets,
                from: CodeMirror.Pos(line, start),
                to: CodeMirror.Pos(line, end)
            }
        }, { completeSingle: false })
    }
})(jQuery);


/* Listener en URL Pusher for Help Browsing */
var elements = document.getElementsByClassName('dropdown-item');

Array.from(elements).forEach((element) => {
    element.addEventListener('click', (event) => {
        helpBrowser(event.target.innerText);
    });
});

function helpBrowser(object){
    var xhr= new XMLHttpRequest();

    var root = "./js/mimsOnline/mims-doc/";
    var extension = "-doc.html";
    var url = root.concat(object, extension);

    xhr.open('GET', url, true);
    xhr.onreadystatechange= function() {
        if (this.readyState!==4) return;
        if (this.status!==200) return;
        document.getElementById('help-content').innerHTML= this.responseText;
    };
    xhr.send();
}

/* Dealing with Dragging and Dropping Mims Code generated by mimsGenerators functions */

var draggedMimsCode = "base";
document.addEventListener("dragstart", function( event ) {
    let draggedObject = event.target;
    if(draggedObject.classList[1]=="generateJs"){
        if(jscode.getSelection()){
            generateFromJS(jscode.getSelection());
        } else {
            generateFromJS(jscode.getValue());
        }
    } else if (draggedObject.classList[1]=="generateFromXYList") {
        let val = getGeneratorParam("generateFromXYList");
        val.push(document.getElementById('textToGenerate').value);
        event.dataTransfer.setData("text", generateFromXYList(val));
    } else if(draggedObject.classList[0]=="generator"){
        var generatorName = draggedObject.classList[1];

        // find object
        var fn = window[generatorName];
        if (typeof fn === "function") {
            draggedMimsCode = fn.apply(null, getGeneratorParam(generatorName));
            var header = "\n\n# MIMS code generated by " + generatorName +"\n"
            var footer = "# end of MIMS code generated by " + generatorName + "\n\n";
            draggedMimsCode = header.concat(draggedMimsCode).concat(footer);
            event.dataTransfer.setData("text", draggedMimsCode);
        }
        localStorage.setItem("mimsCode", mims.getValue());
    }


}, false);

/*
document.addEventListener("drop", function( event ) {
    console.log("data : ", event.dataTransfer.getData( "text" ));
}, false);
*/

function getGeneratorParam(generatorName){

    var inputs = document.getElementById(generatorName).getElementsByTagName('input');
    var param = [];

    for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        param.push(input.value);
    }

    if(document.querySelector("#"+generatorName).querySelector(".boundaries-select")){
        const selectElmt = document.querySelector("#"+generatorName).querySelector(".boundaries-select");
        var selectValue = selectElmt.options[selectElmt.selectedIndex].value;
        param.push(selectValue);
    }
    return(param);
};

/* Dealing with collapsible generators param section */
var coll = document.getElementsByClassName("generator");
var i;

for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.maxHeight){
            content.style.maxHeight = null;
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });
}

/* Smart Inputs for generators and view param sections */
const FloatLabel = (() => {

    // add active class and placeholder
    const handleFocus = e => {
        const target = e.target;
        target.parentNode.classList.add('active');
        target.setAttribute('placeholder', target.getAttribute('data-placeholder'));
    };

    // remove active class and placeholder
    const handleBlur = e => {
        const target = e.target;
        if (!target.value) {
            target.parentNode.classList.remove('active');
        }
        target.removeAttribute('placeholder');
    };

    // register events
    const bindEvents = element => {
        const floatField = element.querySelector('input');
        floatField.addEventListener('focus', handleFocus);
        floatField.addEventListener('blur', handleBlur);
    };

    // get DOM elements
    const init = () => {
        const floatContainers = document.querySelectorAll('.float-container');
        floatContainers.forEach(element => {
            if (element.querySelector('input').value) {
                element.classList.add('active');
            }
            bindEvents(element);
        });
    };
    return {
        init: init };
})();

FloatLabel.init();




/* View : Full Screen */
function openFullscreen() {
    var elem = document.getElementById("modelView");
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
        document.getElementById("viewOverlay-simulate").requestFullscreen();
    } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
    }
    elem.style.width = '100%';
    elem.style.height = '100%';
}


/* View Overlay Settings : Listeners */

function retrieveLocalColors(){
    document.documentElement.style.setProperty("--color-bg-main", localStorage.getItem("user--color-bg-main"));
    document.documentElement.style.setProperty("--color-bg-sec", localStorage.getItem("user--color-bg-sec"));

    document.documentElement.style.setProperty("--color-material_MAS", localStorage.getItem("user--color-material_MAS"));
    document.documentElement.style.setProperty("--color-material_GND", localStorage.getItem("user--color-material_GND"));
    document.documentElement.style.setProperty("--color-material_PosIN", localStorage.getItem("user--color-material_PosIN"));
    document.documentElement.style.setProperty("--color-material_PosOUT", localStorage.getItem("user--color-material_PosOUT"));
    document.documentElement.style.setProperty("--color-material_FrcIN", localStorage.getItem("user--color-material_FrcIN"));
    document.documentElement.style.setProperty("--color-material_FrcOUT", localStorage.getItem("user--color-material_FrcOUT"));

    document.documentElement.style.setProperty("--color-material_REF", localStorage.getItem("user--color-material_REF"));
    document.documentElement.style.setProperty("--color-material_NLBOW", localStorage.getItem("user--color-material_NLBOW"));
    document.documentElement.style.setProperty("--color-material_NLPLUCK", localStorage.getItem("user--color-material_NLPLUCK"));
    document.documentElement.style.setProperty("--color-material_NLCONTACT", localStorage.getItem("user--color-material_NLCONTACT"));
}

retrieveLocalColors();

document.getElementById("interface_main").addEventListener("input", function (event) {
    document.documentElement.style.setProperty("--color-bg-main", this.value);
    localStorage.setItem("user--color-bg-main", this.value);
}, false);
document.getElementById("interface_sec").addEventListener("input", function (event) {
    document.documentElement.style.setProperty("--color-bg-sec", this.value);
    localStorage.setItem("user--color-bg-sec", this.value);
}, false);
document.getElementById("model_mas").addEventListener("input", function (event) {
    document.documentElement.style.setProperty("--color-material_MAS", this.value);
    localStorage.setItem("user--color-material_MAS", this.value);
}, false);
document.getElementById("model_gnd").addEventListener("input", function (event) {
    document.documentElement.style.setProperty("--color-material_GND", this.value);
    localStorage.setItem("user--color-material_GND", this.value);
}, false);
document.getElementById("model_posIN").addEventListener("input", function (event) {
    style.setProperty("--color-material_PosIN", this.value);
    localStorage.setItem("user--color-material_PosIN", this.value);
}, false);
document.getElementById("model_posOUT").addEventListener("input", function (event) {
    style.setProperty("--color-material_PosOUT", this.value);
    localStorage.setItem("user--color-material_PosOUT", this.value);
}, false);
document.getElementById("model_frcIN").addEventListener("input", function (event) {
    style.setProperty("--color-material_FrcIN", this.value);
    localStorage.setItem("user--color-material_FrcIN", this.value);
}, false);
document.getElementById("model_frcOUT").addEventListener("input", function (event) {
    style.setProperty("--color-material_FrcOUT", this.value);
    localStorage.setItem("user--color-material_FrcOUT", this.value);
}, false);

document.getElementById("slide-BenchAlpha").addEventListener("change", function() {
    benchStyleAlpha(this.value);
}, false);
document.getElementById("slide-SphereDefinition").addEventListener("change", function() {
    sphereDefinition(this.value);
}, false);
document.getElementById("slide-SphereSize").addEventListener("change", function() {
    sphereSize(this.value);
}, false);






var simulationFrameCount = 0;
var stepsToCompute = 1;


document.getElementById("stepsByFrame").addEventListener("change", function() {
    stepsToCompute = this.value;
}, false);

function animate() {
    if (!animationPaused){
        setTimeout(function() {
            window.requestAnimationFrame(animate);
            for (var i = 0; i < stepsToCompute; i++) {
                simulationStep();
                simulationFrameCount += 1;
            }
            update_modelView();
        }, 1000/framesPerSecond);
    }
}
window.requestAnimationFrame(animate);

function animateOneStep() {
    simulationStep();
    simulationFrameCount += 1;
    update_modelView();
}

function updateModelinView(){
    redUnmark();
    mimsConsole();
    try {
        parseMIMSFile(mims.getValue());
        generateGenDSP();
    } catch (e) {
        mimsConsole("Errors detected during the model script parsing.", e);
        redMark();
    }
    if(mdl.isValid()){
        resetSimulationState();
        updateView();
    }
    modelHasChanged = true;
}


/******************************
/* Model Parameters Controls */

function pushModuleToStrike(){
    var element = document.getElementById("moduleToStrike");
    if(element!==null){
        element.innerHTML = "";
        var tag = document.createElement("span");
        var text = document.createTextNode(pickedModule[0]);
        tag.appendChild(text);
        element.appendChild(tag);
    }
}

document.getElementById("genericFrcInput_btn").addEventListener('click', function() {
    apply_frcAny(document.getElementById("moduleToStrike").firstChild.innerHTML.substr(1),document.getElementById("genericFrcInput_val").value);
    if(animationPaused){
        $("#simulateRun").click();
    }
}, false);




var rangeSlider = function(){
    var slider = $('.continuousSlider'),
        range = $('.continuousSlider_range'),
        value = $('.continuousSlider_value');

    var minp, maxp, minv, maxv, scale;
    minp = 1 ;
    maxp = 100 ;

    range.each(function(){
        // position will be between 0 and 100
        minp = $(this).attr('min');
        maxp = $(this).attr('max');
        // The result should be between 100 an 10000000
        minv = Math.log($(this).attr('value')/100) ;
        maxv = Math.log($(this).attr('value')*100) ;
        // calculate adjustment factor
        scale = (maxv-minv) / (maxp-minp);
        $(this).val((Math.log($(this).attr('value'))-Math.log(minv) / scale + minp));
    });

    range.on('input', function(){
        minp = $(this).attr('min');
        maxp = $(this).attr('max');
        // position will be between 0 and 100
        // The result should be between 100 an 10000000
        minv = Math.log($(this).attr('value')/100);
        maxv = Math.log($(this).attr('value')*100);
        // calculate adjustment factor
        scale = (maxv-minv) / (maxp-minp);
        $(this).next(value).html(Math.exp(minv + scale*(this.value-minp)).toFixed(10));
        //$(this).next(value).html(this.value);
    });

    slider.each(function(){

        value.each(function(){
            var value = $(this).prev().attr('value');
            $(this).html(value);
        });
    });
};




function generateParametersControls() {

   resetParametersControls();

    let params = get_param_dict();
    console.log(params);

    var inputs = document.createElement("div");
    inputs.className = "inputs";

    // Generating HTML controllers
    for (let param in params) {
        var div = document.createElement("div");
        div.className = "continuousSlider";

        var input = document.createElement("input");
        input.type = "range";
        input.className = "continuousSlider_range"; // set the CSS class
        input.id = param;

        let defaultValue = params[param];
        input.defaultValue = defaultValue;
        input.min = defaultValue/100 ;
        input.max = defaultValue*100 ;
        input.step = defaultValue/1000 ;

        var tag = document.createElement("p");
        tag.className = "header";
        var text = document.createTextNode("Global Parameters : " + param);
        tag.appendChild(text);

        var divMixMax = document.createElement("div");
        divMixMax.className = "param-row";
        var divL = document.createElement("div");
        var divR = document.createElement("div");
        divL.className = 'float-container active';
        divR.className = 'float-container active right';

        var labelL = document.createElement("label");
        var labelR = document.createElement("label");
        labelL.htmlFor = 'inputLeft';
        labelL.innerHTML = "min";
        labelR.htmlFor = 'inputRight';
        labelR.innerHTML = "max";

        var inputMin = document.createElement("input");
        inputMin.type = "number";
        inputMin.defaultValue = input.min;
        inputMin.id = "inputLeft";

        var inputMax = document.createElement("input");
        inputMax.type = "number";
        inputMax.defaultValue = input.max;
        inputMax.id = "inputRight";

        divL.appendChild(labelL);
        divL.appendChild(inputMin);
        divR.appendChild(labelR);
        divR.appendChild(inputMax);
        divMixMax.appendChild(divL);
        divMixMax.appendChild(divR);

        var currentValue = document.createElement("div");
        currentValue.className = "continuousSlider_value";

        div.appendChild(tag);
        div.appendChild(divMixMax);
        div.appendChild(input);
        div.appendChild(currentValue);

        inputs.appendChild(div);
    }

    document.getElementById("sim_PhysicalParametersControls").appendChild(inputs);

    rangeSlider();

    // Generating proper eventListeners for HTML controllers
    for (let param in params) {
        document.getElementById(param).addEventListener("input", function() {
            //console.log(($(this).next())[0].innerHTML);
            update_param(param, $(this).next()[0].innerHTML);
        }, false);
    }

}

document.getElementById("zfactorinput").addEventListener("input", function() {
    zFactorUpdate(this.value);
}, false);




function resetParametersControls(){
    document.getElementById("sim_PhysicalParametersControls").innerHTML = "";
}

function generateInputsControls() {

    var element = document.getElementById("sim_InputsControls");
    element.innerHTML = "";

    let inputs = mdl.inOutDict;

    for (let input in inputs) {
        let moduleType = inputs[input].type;

        switch (moduleType) {
            case 'frcInput':
                var div = document.createElement("div");
                div.className = "frcInput";

                var tag = document.createElement("p");
                tag.className = "header";
                var text = document.createTextNode("Controller : Force Input " + input);
                tag.appendChild(text);

                var button = document.createElement("button");
                button.innerHTML = "Apply";
                button.className = "btn-secondary";
                button.id = input+'_btn';

                var force = document.createElement("input");
                force.type = "text";
                force.defaultValue = 1;
                force.id = input+'_val';

                var tag1 = document.createElement("span");
                var text1 = document.createTextNode(" a Force Input of ");
                var tag2 = document.createElement("span");
                var text2 = document.createTextNode("to "+input);
                tag1.appendChild(text1);
                tag2.appendChild(text2);

                div.appendChild(tag);
                div.appendChild(button);
                div.appendChild(tag1);
                div.appendChild(force);
                div.appendChild(tag2);

                element.appendChild(div);

                button.addEventListener('click', function() {
                    let id = "f_"+input.slice(-3);
                    apply_frcInput(id,force.value);
                    if(animationPaused){
                        pauseAnimation(false);
                        animate();
                    }

                    if($('#simulateRun').hasClass('active')) {
                    } else {
                        $('#simulateRun').addClass('active');
                    }
                    if($('#simulatePause').hasClass('active')) {
                        $('#simulatePause').removeClass('active');
                    }

                }, false);
                break;

            case 'posInput':
                var div = document.createElement("div");
                div.className = "posInput";

                var range = document.createElement("input");
                let posz = mdl.inOutDict[input].pos["z"];
                range.type = "range";
                range.className = "continuousSlider_range"; // set the CSS class
                range.id = input+'_rng';
                range.defaultValue = posz;
                range.min = -50;
                range.max = 50;
                range.step = 0.001;

                var tag = document.createElement("p");
                tag.className = "header";
                var text = document.createTextNode("Controller : Position Input " + input);
                tag.appendChild(text);
                /*
                                var divMixMax = document.createElement("div");
                                divMixMax.className = "param-row";
                                var divL = document.createElement("div");
                                var divR = document.createElement("div");
                                divL.className = 'float-container active';
                                divR.className = 'float-container active right';

                                var labelL = document.createElement("label");
                                var labelR = document.createElement("label");
                                labelL.htmlFor = 'inputLeft';
                                labelL.innerHTML = "min";
                                labelR.htmlFor = 'inputRight';
                                labelR.innerHTML = "max";

                                var inputMin = document.createElement("input");
                                inputMin.type = "number";
                                inputMin.defaultValue = range.min;
                                inputMin.id = "inputLeft";

                                var inputMax = document.createElement("input");
                                inputMax.type = "number";
                                inputMax.defaultValue = range.max;
                                inputMax.id = "inputRight";

                                divL.appendChild(labelL);
                                divL.appendChild(inputMin);
                                divR.appendChild(labelR);
                                divR.appendChild(inputMax);
                                divMixMax.appendChild(divL);
                                divMixMax.appendChild(divR);

                                var currentValue = document.createElement("div");
                                currentValue.className = "continuousSlider_value";
                */
                div.appendChild(tag);
                //div.appendChild(divMixMax);

                div.appendChild(range);
                //div.appendChild(currentValue);

                element.appendChild(div);

                range.addEventListener("input", function() {
                    update_posInput("p_"+input.substr(1), this.value);
                }, false);
        }
    }
}

function saveImage(nbImages) {
    var modelName = document.getElementById("modelName").value;
    var fileName = modelName;
    if (modelName == null || modelName == "")
        fileName = "defaultName";
    fileName = fileName + "_" + simulationFrameCount.toString().padStart(4, "0");
    const canvas = document.getElementsByTagName("canvas")[0]
    const image = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = image.replace(/^data:image\/[^;]/, 'data:application/octet-stream');
    a.download = fileName + ".png";
    a.click();

    setTimeout(function(){
        if (nbImages > 1) {
            for (i = 0; i < nbImages; i++) {
                console.log('export');
                animateOneStep();
                var modelName = document.getElementById("modelName").value;
                var fileName = modelName;
                if (modelName == null || modelName == "")
                    fileName = "defaultName";
                fileName = fileName + "_" + simulationFrameCount.toString().padStart(4, "0");
                const canvas = document.getElementsByTagName("canvas")[0]
                const image = canvas.toDataURL("image/png");
                const a = document.createElement("a");
                a.href = image.replace(/^data:image\/[^;]/, 'data:application/octet-stream');
                a.download = fileName + ".png";
                a.click();
            }
        }
    }, 1000);
}

/* Experimentation | not necessarily stable */
function generateFromJS(jsx){
    console.log("In execute code funtion");

    $("#chalfunction").remove();
    var s = document.createElement('script');
    s.setAttribute("id", "chalfunction");
    s.textContent = "function physicalFunction(){\n"
    s.textContent += jsx;
    s.textContent += "};"
    document.scripts.namedItem("insertcode").append(s);

    physicalFunction();
}


mims.setValue(localStorage.getItem("mimsCode"));




    /*   For futur import mdl over the web functions *//*

const url1 = 'https://raw.githubusercontent.com/mi-creative/FaustPM_2021_examples/master/06_Bounce.dsp'
const response = await fetch(url1);
const data = await response.text();
console.log(data);

    */
