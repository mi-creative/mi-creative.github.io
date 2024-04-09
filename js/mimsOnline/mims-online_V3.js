

var mims = CodeMirror.fromTextArea(document.getElementById("mimscode"), {
    mode:  "javascript",
    lineNumbers: true,
    lineWrapping:true,
    extraKeys: {"Cmd-Enter": "compile"},
    styleActiveLine: true,
    styleActiveSelected: true,

    //highlightSelectionMatches: {showToken: /\w/, annotateScrollbar: true}
});
mims.focus();

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
    });

    $(document).ready(function(){
        $("#mimsImport").click(function() {
            $("#mimsFile").click();
        });
    });

    $(document).ready(function(){

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

    function readFile(file, onLoadCallback){
        var reader = new FileReader();
        reader.onload = onLoadCallback;
        reader.readAsText(file);
    }


    /* Connection des functions aux boutons du header du conveter */
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
            window.open("https://faustide.grame.fr/","_self")
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
            download(fileName,mimsBundle.buildGendspPatch(genCodeArray));

        });
    });

    $(document).ready(function(){
        $("#viewRefresh").click(function(){
            viewRefresh();
        });
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
        mimsBundle.parseMIMSFile(mims.getValue());
    } catch (e) {
        mimsConsole("Errors detected during the model script parsing.", e);
        redMark();
    }

    if(mdl.isValid()){
        try {
            converter.setValue(mimsBundle.generateFaustDSP());
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
        mimsBundle.parseMIMSFile(mims.getValue());
    } catch (e) {
        mimsConsole("Errors detected during the model script parsing.", e);
        redMark();
    }

    if(mdl.isValid()){
        try {
            genCodeArray = mimsBundle.generateGenDSP();
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
        })

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

    /* old version pushing all console message in a specific div */
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
                viewRefresh();
            }
            viewResize();
        });
    });


    $( "#faustExport" ).hide();
    $( "#faustRefresh" ).hide();
    $( "#faustRun" ).hide();

    $( "#genExport" ).hide();
    $( "#genRefresh" ).hide();


    $( "#viewRefresh" ).hide();

    $("#collapse3").on('shown.bs.collapse', function() {
        $( "#viewRefresh" ).show( 100, function() {
        });
    });

    $("#collapse3").on('hidden.bs.collapse', function() {
        $( "#viewRefresh" ).hide( 100, function() {

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



    window.onresize = resize;
    resize();

    var userInMIMSEditor = false;
    mims.on("focus", function () {
        userInMIMSEditor = true;
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
        if ($('#toggle-autoCompile').is(":checked")) {
            if (event.which == 13 || event.which == 8 || event.which == 46){
                if($('#collapse3').hasClass('in')) {
                    viewRefresh();
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
                viewRefresh();
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
            mims.setCursor(lineFromModuleID(pickedModule[0]), 0);
        }

        document.getElementById('viewOverlay-moduleID').innerHTML = '<p> '+ pickedModule[0] + ' </p>';
        document.getElementById('viewOverlay-log').style.display = 'flex';

        const moduleType = pickedModule[1].type;
        console.log("module currently selected : "+moduleType);

        switch (moduleType) {
            case 'mass':
                /* IF MASS MODULE */
                viewRefresh();

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

                document.getElementById("param_M").value = parseFloat(pickedModule[1]["args"][0]);
                document.getElementById("mass_X").value = pickedModule[1]["pos"]["x"];
                document.getElementById("mass_Y").value = pickedModule[1]["pos"]["y"];
                document.getElementById("mass_Z").value = pickedModule[1]["pos"]["z"];

                break;

            case 'ground':

                viewRefresh();

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

                document.getElementById("mass_X").value = parseFloat(pickedModule[1]["pos"]["x"]);
                document.getElementById("mass_Y").value = pickedModule[1]["pos"]["y"];
                document.getElementById("mass_Z").value = pickedModule[1]["pos"]["z"];

                break;

            case 'springDamper':

                viewRefresh();

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
                let possibleParamK = "@" + pickedModule[1]["args"][0];
                let possibleParamZ = "@" + pickedModule[1]["args"][1];


                if (mdl.paramDict[possibleParamK] !== undefined){
                    document.getElementById("param_K").value = parseFloat(mdl.paramDict[possibleParamK]["args"]);
                } else {
                    document.getElementById("param_K").value = parseFloat(pickedModule[1]["args"][0]);
                }

                if (mdl.paramDict[possibleParamZ] !== undefined){
                    document.getElementById("param_Z").value = parseFloat(mdl.paramDict[possibleParamZ]["args"]);
                } else {
                    document.getElementById("param_Z").value = parseFloat(pickedModule[1]["args"][1]);
                }

                break;

            case 'osc':
                /* IF OSC MODULE */
                viewRefresh();

                ['param_M', 'mass_X', 'mass_Y', 'mass_Z', 'param_K', 'param_Z'].forEach(function(e){
                    let element = document.getElementById(e);
                    element.disabled = false;
                    element.parentNode.classList.add('active');
                });

                document.getElementById("param_M").value = parseFloat(pickedModule[1]["args"][0]);
                document.getElementById("param_K").value = parseFloat(pickedModule[1]["args"][1]);
                document.getElementById("param_Z").value = parseFloat(pickedModule[1]["args"][2]);
                document.getElementById("mass_X").value = pickedModule[1]["pos"]["x"];
                document.getElementById("mass_Y").value = pickedModule[1]["pos"]["y"];
                document.getElementById("mass_Z").value = pickedModule[1]["pos"]["z"];

                break;


            default:
                console.log(moduleType + " modules are not yet implemented");
        }


    } else {
        document.getElementById('viewOverlay-moduleID').innerHTML = '';
        document.getElementById('viewOverlay-log').style.display = 'none';
        viewRefresh();
    }


}

/* Dealing with model alteration and codeMirror + View update when new input in param fields from 3D View (on module picked)*/
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
    viewRefresh();
});
$('#mass_Y').on('input', function () {
    updateModuleParam("y", $(this).val());
    viewRefresh();
});
$('#mass_Z').on('input', function () {
    updateModuleParam("z", $(this).val());
    viewRefresh();
});

function updateModuleParam(paramType, newVal){
    switch (paramType) {
        case 'M':
            pickedModule[1]["args"][0] = newVal;
            break;
        case 'K':
            pickedModule[1]["args"][0] = newVal;
            break;
        case 'Z':
            pickedModule[1]["args"][1] = newVal;
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

                if(['mass', 'ground', 'springDamper', 'osc'].indexOf(item) >= 0){
                    var pickedModuleName = moduleNameAtLine(mims.getLine(mims.getCursor().line));
                    if (isPresentInDict(pickedModuleName, mdl.massDict)) {
                        pickedModule = [pickedModuleName, mdl.massDict[pickedModuleName]];
                        pickedModuleRefresh();
                    } else if (isPresentInDict(pickedModuleName, mdl.interDict)) {
                        pickedModule = [pickedModuleName, mdl.interDict[pickedModuleName]];
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


/* Dealing with Dragging and Dropping Mims Code generated by mimsGenetors functions */

var draggedMimsCode = "base";
document.addEventListener("dragstart", function( event ) {


    if(event.target.classList[1]=="generateJs"){
        if(jscode.getSelection()){
            generateFromJS(jscode.getSelection());
        } else {
            generateFromJS(jscode.getValue());
        }
    } else if(event.target.classList[0]=="generator"){
        var generatorName = event.target.classList[1];

        // find object
        var fn = window[generatorName];
        if (typeof fn === "function") {
            draggedMimsCode = fn.apply(null, getGeneratorParam(generatorName));
            var header = "\n\n# MIMS code generated by " + generatorName +"\n"
            var footer = "# end of MIMS code generated by " + generatorName + "\n\n";
            draggedMimsCode = header.concat(draggedMimsCode).concat(footer);
            event.dataTransfer.setData("text", draggedMimsCode);
        }
    };
}, false);

/*
document.addEventListener("drop", function( event ) {
    console.log("data : ", event.dataTransfer.getData( "text" ));
}, false);
*/

function getGeneratorParam(generatorName){
    var inputs = document.getElementById(generatorName).getElementsByTagName('input');
    var param = []

    for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        param.push(input.value);
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
