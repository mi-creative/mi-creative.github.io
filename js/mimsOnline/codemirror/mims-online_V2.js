
(function main($) {

    var all_modules, in_out_modules, interaction_modules, macro_modules, mass_modules, other_modules;
    mass_modules = ["mass", "massG", "osc", "ground"];
    interaction_modules = ["damper", "spring", "nlSpring", "nlSpring2", "nlSpring3", "nlPluck", "nlBow", "contact", "springDamper", "nlSpringDamper", "nlContact"];
    macro_modules = ["string", "stiffString", "chain", "mesh", "closedMesh", "cornerMesh"];
    in_out_modules = ["posInput", "posOutput", "frcInput", "frcOutput"];
    other_modules = ["none", "param", "audioParam"];
    all_modules = ((((mass_modules + interaction_modules) + macro_modules) + in_out_modules) + other_modules);

    const faustModDict = {
        "mass" : {func : "mass", nbArgs:1, optArgs : ["gravity"]},
        "osc" : {func : "osc", nbArgs:3, optArgs : 0},
        "ground" : { func :"ground", nbArgs:0, optArgs : 0},
        "spring" : { func :"spring", nbArgs:1, optArgs : 0},
        "springDamper" : { func :"spring", nbArgs:2, optArgs : 0},
        "damper" : { func :"damper", nbArgs:1, optArgs : 0},
        "contact" : { func :"compute_contact", nbArgs:2, optArgs : ["thresh"]},
        "nlContact" : { func :"compute_contact_nl3_clipped", nbArgs:4, optArgs : ["thresh"]},
        "nlSpring2" : { func :"compute_spring_damper_nl2", nbArgs:3, optArgs : 0},
        "nlSpring3" : { func :"compute_spring_damper_nl3", nbArgs:3, optArgs : 0},
        "nlSpringDamper" : { func :"compute_spring_damper_nl3_clipped", nbArgs:4, optArgs : 0},
        "nlBow" : { func :"compute_nlBow", nbArgs:2, optArgs : ["smooth"]},
        "nlPluck" : { func :"compute_nlPluck", nbArgs:2, optArgs : ["Z"]},
        "posInput" : { func :"posInput", nbArgs:0, optArgs : 0},
        "frcInput" : { func :"apply_input_force", nbArgs:0, optArgs : 0},
    };

    var mims = CodeMirror.fromTextArea(document.getElementById("mimscode"), {
        mode:  "javascript",
        lineNumbers: true,
        lineWrapping:true,
        extraKeys: {"Cmd-Enter": "compile"},
        //highlightSelectionMatches: {showToken: /\w/, annotateScrollbar: true}
    });

    var faust = CodeMirror.fromTextArea(document.getElementById("faustcode"), {
        mode:  "application/faust",
        lineNumbers: true,
        autoCloseBrackets: true,
        lineWrapping:true,

        //highlightSelectionMatches: {showToken: /\w/, annotateScrollbar: true}
    });



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

    $(document).ready(function(){
        $("#faustRefresh").click(function(){
            mims2faust();
            drawScene();
        });
    });

    $(document).ready(function(){
        $("#mimsTestTerminal").click(function(){
            console.log("test retour console");
        });
    });


    $(document).ready(function(){
        $("#updateModelinView").click(function(){
            mims2faust();
            drawScene();
        });
    });

    $(document).ready(function(){
        $("#faustExport").click(function(){
            var modelName = document.getElementById("modelName").value;
            var fileName;
            if (modelName == null || modelName == "")
                fileName = "Default.dsp";
            else fileName = modelName.concat(".dsp");
            download(fileName,faust.getValue());
        });
    });

    window.mims2faust = function() {
        //faust.setValue(mims.getValue());
        parseMIMSFile(mims.getValue());
        faust.setValue(generateFaustCode());
    }






    /**
     * Parse an entire MIMS Script file
     * @param text the file as a single string of text.
     */
    function parseMIMSFile(text){

        clear();

        try {
            var lines = text.split(/\r\n|\r|\n/);
            for(var i = 0; i < lines.length; i++)
                parseCommand(lines[i]);
            state = 1;

            var out = {
                masses: massDict,
                interactions: interDict,
                macroStructures: macroDict,
                inOuts: inOutDict,
                parameters: paramDict
            };

        } catch(e){
            console.error(e);

            state = 0;

            return -1;
        }
    }

    /**
     * Parse and interpret a MIMS command line.
     * @param text the line to parse.
     */
    function parseCommand(text){
        if(!/^\s*@/.test(text)){
            if(/^\s*~begin/.test(text)){
                let s = text.split(/\s/)[1];
                if(s == null)
                    throw "Invalid buffer begin command";
                else{
                    if (activeBufferList.indexOf(s) === -1){
                        activeBufferList.push(s);
                        bufferList.push(s);
                    }
                }
            }
            else if(/^\s*~end/.test(text)){
                let s = text.split(/\s/)[1];
                if(s == null)
                    throw "Invalid buffer end command";
                else{
                    if (activeBufferList.indexOf(s) > -1)
                        activeBufferList = activeBufferList.splice(activeBufferList.indexOf(s) + 1);
                }
            }
            return;
        }

        var regExp = /[^\s+\[']+|\[[^\]]*\]|'[^']*'/g;
        var list = [];
        while ((array1 = regExp.exec(text)) !== null)
            list.push(array1.toString());
        attributeListToDicts(list);
    }

    /**
     * Use list of parsed elements from a command to fill dictionaries with the model specifications.
     * @param list the array of elements obtained from a parsed MIMS command.
     */
    function attributeListToDicts(list){

        /**
         *
         */
        function makeArgList(list, argStart, argEnd, expected, opt = 0){

            var args = list.slice(argStart, list.length - argEnd);
            for (let i = 0; i < args.length; i++)
                args[i] = args[i].replace(/[\[\]']+/g,'');

            if (args.length < expected)
                throw "Insufficient number of arguments for " + list[1] + " element: " + list[0] + " (" + args.length + ")";
            else if (args.length > expected + opt)
                throw "Wrong number of arguments for " + list[1] + " element: " + list[0] + " (" + args.length + ")";


            return args;
        }



        try {

            let name = checkIsModule(list[0]);
            let type = list[1];
            let len = list.length;
            let args = [];
            let expected_args, opt_args;
            let pos, vel;

            if (type in faustModDict){
                expected_args = faustModDict[type]["nbArgs"];
                opt_args = faustModDict[type]["optArgs"].length;
            }
            else
                expected_args = 0;

            if (isPresentInDict(name, massDict) || isPresentInDict(name, interDict) ||
                isPresentInDict(name, macroDict) || isPresentInDict(name, paramDict) ||
                isPresentInDict(name, paramDict)) {
                throw name + " already exists in the model.";
            }


            if (mass_modules.indexOf(type) > -1) {
                if(type === "ground")
                    pos = list[len - 1];
                else {
                    pos = list[len - 2];
                    vel = list[len - 1];
                }
                args = makeArgList(list, 2, 2, expected_args, opt_args);

                if (type === "ground")
                    vel = "0";
                massDict[name] = {
                    type: type,
                    args: args,
                    pos: posStringToDict(pos),
                    vel: posStringToDict(vel),
                    buffer : activeBufferList.slice()
                }
            }

            else if (interaction_modules.indexOf(type) > -1) {

                var m1 = checkIsModule(list[2]);
                var m2 = checkIsModule(list[3]);
                args = makeArgList(list, 4, 0, expected_args, opt_args);

                interDict[name] = {
                    type: type,
                    m1: m1,
                    m2: m2,
                    args: args
                }
            }

            else if (macro_modules.indexOf(type) > -1) {
                pos = list[len - 2];
                vel = list[len - 1];
                args = makeArgList(list, 2, 2, expected_args, opt_args);
                macroDict[name] = {
                    type: type,
                    args: args,
                    pos: posStringToDict(pos),
                    vel: posStringToDict(vel),
                    buffer : activeBufferList.slice()
                };
            }

            /*
            else if (in_out_modules.indexOf(type) > -1){
                if (len !== 3)
                    throw "Bad number of arguments for " + type + " element: " + name;
                else {
                    if ((type === "posInput") || (type === "frcInput")){
                        if (!/in/.test(name))
                            throw "Bad name for " + type + " " + name;
                        else {
                            if(type === "posInput"){
                                inOutDict[name] = {
                                    type: type,
                                    pos: posStringToDict(list[2]),
                                    vel: posStringToDict(list[2])
                                }
                            }
                            else if(type === "frcInput") {
                                inOutDict[name] = {
                                    type: type,
                                    m: checkIsModule(list[2])
                                }
                            }
                        }
                    }
                    else if ((type === "posOutput") || (type === "frcOutput")) {
                        if (!/out/.test(name))
                            throw "Bad name for " + type + " " + name;
                        else {
                            inOutDict[name] = {
                                type: type,
                                m: checkIsModule(list[2])
                            }
                        }
                    }
                }
            }
             */

            // Could definitely refactor a lot of this stuff
            else if (type === "posInput") {
                if (len !== 3) {
                    throw "Bad number of arguments for " + type + " element: " + name;
                } else {
                    if (!/in/.test(name))
                        throw "Bad name for " + type + " " + name;
                    else {
                        inOutDict[name] = {
                            type: type,
                            pos: posStringToDict(list[2]),
                            vel: posStringToDict(list[2]),
                            buffer : activeBufferList.slice()
                        }
                    }
                }
            } else if ((type === "posOutput") || (type === "frcOutput")) {
                if (len !== 3) {
                    throw "Bad number of arguments for " + type + " element: " + name;
                } else {
                    if (!/out/.test(name))
                        throw "Bad name for " + type + " " + name;
                    else {
                        inOutDict[name] = {
                            type: type,
                            m: checkIsModule(list[2])
                        }
                    }
                }
            } else if (type === "frcInput") {
                if (len !== 3) {
                    throw "Bad number of arguments for " + type + " element: " + name;
                } else {
                    if (!/in/.test(name))
                        throw "Bad name for " + type + " " + name;
                    else {
                        inOutDict[name] = {
                            type: type,
                            m: checkIsModule(list[2])
                        }
                    }
                }
            }

            else if (type === "param") {
                if (len !== 3) {
                    throw "Bad number of arguments for " + type + " element: " + name;
                } else {
                    paramDict[name] = {
                        type: type,
                        args: list[2]
                    }
                }
            } else if (type === "audioParam") {
                if (len !== 3) {
                    throw "Bad number of arguments for " + type + " element: " + name;
                } else {
                    let input = checkIsModule(list[2]);
                    if (!/in/.test(input))
                        throw "Bad name for " + type + " " + name;
                    paramDict[name] = {
                        type: type,
                        input: input.toString()
                    }
                }
            }
        } catch (e){
            throw("Parsing Error: " + e);
        }
    }


    /**
     * Clear all the data associated with a MIMS model and reset the parser state.
     */
    function clear(){

        massDict = {};
        interDict = {};
        inOutDict = {};
        paramDict = {};
        macroDict = {};

        bufferList = [];
        activeBufferList = [];
        state = 0;

    }

    /**
     * Check if an element respects the module name format (starting with an @, e.g. @m1). Throws exception if not.
     * @param element element to test.
     * @returns {string|*} the element if it respects the module type, null otherwise.
     */
    function checkIsModule(element){
        var m = element.replace(/[\[\]']+/g,'').split(/\s+/g);
        if(!/^@/.test(m[0])){
            throw "Bad mass name for " + m +", " + m + " doesn't start with @.";
        }
        else
            return m;
    }

    /**
     * Check if a field exists in a dictionary (e.g if the mass "@m1" is present in "massDict".
     * @param name field to test.
     * @param dic the dictionary in which we want to know if the field exists.
     * @returns {boolean} true if present, false otherwise.
     */
    function isPresentInDict(name, dic){
        return dic[name] !== undefined;
    }

    /**
     * Translate a position argument (either float or three floats inside brackets) into an x-y-z dictionary
     * @param pos the position string to test.
     * @returns {{x: *, y: *, z: *}|{x: *, y: number, z: number}}
     */
    function posStringToDict(pos){
        let posArray = pos.replace(/[\[\]']+/g,'').split(/\s+/g);
        var pdict;
        if(posArray.length === 3)
            pdict = {x:posArray[0], y:posArray[1], z: posArray[2]};
        else if (posArray.length === 1)
            pdict = {x:posArray[0], y:0, z:0};
        else
            throw "Bad Number of elements in position list " + pos;
        return pdict;
    }

    function isEmpty(obj) {
        for(var key in obj) {
            if(obj.hasOwnProperty(key))
                return false;
        }
        return true;
    }

    /**
     * Get the integer index of an input or output module
     * @param string the module name
     * @returns {number} index of the number.
     */
    function stripInOutToInt(string){
        let exp;
        if(/^@in/.test(string))
            exp = "@in";
        else if(/^@out/.test(string))
            exp = "@out";
        let nb = parseInt(string.replace(exp, ""));
        if (Number.isNaN(nb))
            throw "Cannot find index of " + string;
        return nb;
    }

    function generateFaustCode(){
        if(!isEmpty(macroDict))
            throw "The code contains macro elements, cannot generate for Faust !";

        let fMass = [];
        let fMassIndexMap = {};
        let fInter = [];
        let fParams = [];

        let dict = {};

        let cpt = 0;
        for (let name in massDict) {
            if (massDict.hasOwnProperty(name)) {
                dict = massDict[name];
                let args = dict["args"];
                var type = dict["type"];
                let regArgNb = faustModDict[type]["nbArgs"];
                let optArgNb = faustModDict[type]["optArgs"].length;
                let func = faustModDict[type]["func"];

                let argstring = "";
                for (let i = 0; i < args.length; i++) {
                    if(i >= regArgNb){
                        let paramName = faustModDict[type]["optArgs"][i-regArgNb];
                        argstring = argstring.concat(paramName + " = ");
                        if(paramName === "gravity")
                            argstring = argstring.concat(args[i] + "/ ma.SR");
                        else
                            argstring = argstring.concat(args[i]);
                    }
                    else
                        argstring = argstring.concat(args[i]);
                    if(i < args.length-1)
                        argstring = argstring.concat(", ");
                }

                let pos = dict["pos"]["x"];
                let delPos = pos;
                let posString = "";
                if(type === "ground" )
                    posString = pos;
                else{
                    if(parseFloat(dict["vel"]["x"]) !== 0)
                        delPos = dict["pos"]["x"] + " - (" + dict["vel"]["x"] + "/ ma.SR)";
                    posString =  pos + ", " + delPos;
                }
                if(argstring !== "")
                    fMass.push(func +  "(" + argstring + ", " + posString + ")");
                else
                    fMass.push(func +  "(" + posString + ")");
                fMassIndexMap[name] = {index:cpt++, pos:pos, posR: delPos};

            }
        }

        let posOutputMasses = {};
        let posInputMasses = {};
        let frcOutputMasses = {};
        let frcInputMasses = {};

        let paramAudioIns = [];

        for (let name in inOutDict) {
            if (inOutDict.hasOwnProperty(name)) {
                dict = inOutDict[name];
                if (dict["type"] === "posInput"){
                    fMass.push("posInput(" + dict["pos"]["x"] + ")");
                    fMassIndexMap[name] = {index:cpt++, pos:dict["pos"]["x"], posR:dict["pos"]["x"]};
                    posInputMasses[stripInOutToInt(name)] = {pos:dict["pos"]["x"]};
                }
            }
        }

        for (let name in inOutDict) {
            if (inOutDict.hasOwnProperty(name)) {
                dict = inOutDict[name];
                if(dict["type"] === "posOutput")
                    posOutputMasses[stripInOutToInt(name)] = fMassIndexMap[dict["m"]]["index"];
                else if(dict["type"] === "frcOutput")
                    frcOutputMasses[stripInOutToInt(name)] = fMassIndexMap[dict["m"]]["index"];
                else if(dict["type"] === "frcInput")
                    frcInputMasses[stripInOutToInt(name)] = fMassIndexMap[dict["m"]]["index"];
            }
        }

        for (let name in paramDict) {
            if (paramDict.hasOwnProperty(name)) {
                dict = paramDict[name];
                if(dict["type"] === "audioParam"){
                    let inName = dict["input"].replace("@", "");
                    fParams.push(name.replace("@", "")
                        +  " = " + inName);
                    paramAudioIns.push(inName);
                }

                else if(dict["type"] === "param")
                    fParams.push(name.replace("@", "")
                        +  " = " + dict["args"]);
            }
        }

        ///TODO: get out if there are no interactions !
        let nbMasses = fMass.length;
        let nbInter = Object.keys(interDict).length;
        let routingMatrix = Array(nbMasses).fill(null).map(() => Array(2*nbInter).fill(0));
        let nbOut = Object.keys(posOutputMasses).length + Object.keys(frcOutputMasses).length;

        let nbFrcInput = Object.keys(frcInputMasses).length;

        let i_cpt = 0;
        for (let name in interDict) {
            if (interDict.hasOwnProperty(name)) {
                dict = interDict[name];
                type = dict["type"];
                args = dict["args"];
                let func = faustModDict[type]["func"];

                let argstring = "";
                for (let i = 0; i < args.length; i++) {
                    argstring = argstring.concat(args[i]);
                    if(i < args.length-1)
                        argstring = argstring.concat(", ");
                }
                let mass1 = dict["m1"];
                let mass2 = dict["m2"];
                routingMatrix[fMassIndexMap[mass1]["index"]] [2*i_cpt] = 1;
                routingMatrix[fMassIndexMap[mass2]["index"]] [2*i_cpt+1] = 1;

                // TODO: get proper delayed position here
                fInter.push(func +  "(" + argstring + ", " +
                    fMassIndexMap[mass1]["posR"] + ", " +
                    fMassIndexMap[mass2]["posR"] + ")");

                i_cpt++;
            }
        }

        // Generate the routing tables used by Faust
        let l2m;
        let m2l;

        l2m = "RoutingLinkToMass(";
        for(let i = 0; i < nbInter; i++){
            l2m = l2m.concat("l"+ i +"_f1, l"+ i +"_f2, ");
        }

        let passthrough ="";
        for (let number in posOutputMasses)
            if (posOutputMasses.hasOwnProperty(number))
                passthrough = passthrough.concat("p_out" + number + ", ");
        l2m = l2m.concat(passthrough)

        for (let number in frcInputMasses)
            if (frcInputMasses.hasOwnProperty(number))
                l2m = l2m.concat("f_in" + number + ", ");

        l2m = l2m.replace(/,\s*$/,"");
        l2m = l2m.concat(") = ");

        let forceOutputStrings = [];

        l2m = l2m.concat("/* routed forces  */ ");
        for(let i = 0; i < nbMasses; i++){
            let routed_forces = "";
            let add = 0;

            for(let frc in frcInputMasses)
                if (frcInputMasses.hasOwnProperty(frc))
                    if(frcInputMasses[frc] === i){
                        if(add)
                            routed_forces = routed_forces.concat(" + ");
                        routed_forces = routed_forces.concat("f_in"+frc);
                        add = 1;
                    }

            for(let j = 0; j < 2*nbInter; j++)
                if(routingMatrix[i][j] === 1){
                    if (add)
                        routed_forces = routed_forces.concat(" + ");
                    routed_forces = routed_forces.concat("l" + Math.floor(j/2) + "_f" + ((j%2)+1));
                    add = 1;
                }

            if(routed_forces === "")
                routed_forces = "0";

            l2m = l2m.concat(routed_forces);

            for(let frc in frcOutputMasses)
                if (frcOutputMasses.hasOwnProperty(frc))
                    if(frcOutputMasses[frc] === i) {
                        forceOutputStrings.push(routed_forces);
                    }
            l2m = l2m.concat(", ");
        }

        if(!isEmpty(forceOutputStrings)){
            l2m = l2m.concat("/* force outputs */ ");
            l2m = l2m.concat(forceOutputStrings.join(", "));
            l2m = l2m.concat(", ");
        }

        if(passthrough !== ""){
            l2m = l2m.concat("/* pass-through */ ");
            l2m = l2m.concat(passthrough);
            l2m = l2m.replace(/,\s*$/,";");
        }

        // Generate Mat to Link Routing Function
        m2l = "RoutingMassToLink(";
        for(let i = 0; i < nbMasses-1; i++)
            m2l = m2l.concat("m" + i + ", ");
        m2l = m2l.concat("m" + (nbMasses-1) + ") = ")
        m2l = m2l.concat("/* interaction forces */ ");
        for(let j = 0; j < 2*nbInter; j++)
            for(let i = 0; i < nbMasses; i++)
                if(routingMatrix[i][j] === 1){
                    m2l = m2l.concat("m" + i + ", ");
                }

        m2l = m2l.concat("/* outputs */ ");
        for (let number in posOutputMasses)
            if (posOutputMasses.hasOwnProperty(number))
                m2l = m2l.concat("m"+posOutputMasses[number] + ", ");

        m2l = m2l.replace(/,\s*$/,";");

        /*
        let link2mass = "";
        let mass2link = "";
        for (let cur_ptL = 0; cur_ptL < 2*nbInter; cur_ptL++)
            for (let cur_ptM = 0; cur_ptM < nbMasses; cur_ptM++)
                if(routingMatrix[cur_ptM][cur_ptL]){
                    link2mass = link2mass.concat(", " + (cur_ptL + 1) + ", " + (cur_ptM + 1));
                    mass2link = mass2link.concat(", " + (cur_ptM + 1) + ", " + (cur_ptL + 1));
                }
        let pos_out = "";
        let i_out = 0;
        for (let name in outputMasses) {
            if (outputMasses.hasOwnProperty(name)) {
                dict = outputMasses[name];
                pos_out = pos_out.concat(", " + (outputMasses[name]+1) + "," + (nbInter*2 + 1 + i_out));
                i_out++;
            }
        }
        let routeLM = "RoutingLinkToMass = " +
         "route(" + (nbInter * 2) + ", " + (nbMasses) + link2mass + ");\n"
        let routeML = "RoutingMassToLink = " +
            "route(" + (nbMasses) + ", " + (nbInter * 2 + Object.keys(outputMasses).length)
            + mass2link + pos_out + ");\n"

        */


        // NOW GENERATE THE FAUST CODE
        let fDSP = "import(\"stdfaust.lib\");\nimport(\"mi.lib\");\n\n";

        for (let number in posInputMasses)
            if (posInputMasses.hasOwnProperty(number))
                fDSP = fDSP.concat("in" + number + " = hslider(\"Pos Input " + number + "\", 0, -1, 1, 0.001):si.smoo; "
                    +"\t//write a specific position input signal operation here\n");
        for (let number in frcInputMasses)
            if (frcInputMasses.hasOwnProperty(number))
                fDSP = fDSP.concat("in" + number + " = button(\"Frc Input " + number + "\"): ba.impulsify; "
                    +" \t//write a specific force input signal operation here\n");

        for(let i = 0; i < paramAudioIns.length; i++)
            fDSP = fDSP.concat(paramAudioIns[i] + " = hslider(\"Param " +
                paramAudioIns[i] + "\", 0.01, 0, 0.1, 0.0001):si.smoo; "
                +"\t//write a specific parameter signal operation here\n");

        fDSP = fDSP.concat("\n");

        fDSP = fDSP.concat("OutGain = 1;");
        fDSP = fDSP.concat("\n\n");

        fDSP = fDSP.concat(fParams.join(";\n"));
        fDSP = fDSP.concat(";\n\n");

        let frcPassThrough = "";
        if(nbFrcInput > 0)
            frcPassThrough = ",\n\tpar(i, nbFrcIn,_)";

        let interDSP = "";
        if (fInter.length > 0)
            interDSP = interDSP.concat(fInter.join(",\n\t") + ",\n");

        fDSP = fDSP.concat(
            "model = (\n\t"
            + fMass.join(",\n\t")
            + frcPassThrough
            + ":\n\t"
            + "RoutingMassToLink "
            + frcPassThrough
            + ":\n\t"
            + interDSP
            + "\tpar(i, nbOut+nbFrcIn, _)"
            //+ frcPassThrough
            + ":\n\t"
            + "RoutingLinkToMass\n)~par(i, nbMass, _):"
            + "\npar(i, nbMass, !), par(i, nbOut , _)\n"
        );

        fDSP = fDSP.concat(
            "with{\n\t" + m2l + "\n\t" + l2m +"\n"
            + "\tnbMass = " + nbMasses + ";\n"
            + "\tnbOut = " + nbOut + ";\n"
            + "\tnbFrcIn = " + nbFrcInput + ";\n"
            + "};\n"
        );

        fDSP = fDSP.concat("process = ");

        let inputs = "";
        for (let number in posInputMasses)
            if (posInputMasses.hasOwnProperty(number))
                inputs = inputs.concat("in" + number + ", ");
        for (let number in frcInputMasses)
            if (frcInputMasses.hasOwnProperty(number))
                inputs = inputs.concat("in" + number + ", ");
        inputs = inputs.replace(/,\s*$/,"");


        if(inputs !== "")
            fDSP = fDSP.concat(inputs + " : model");

        if(nbOut > 0){
            fDSP = fDSP.concat(":");
            for(let i = 0; i < nbOut ; i ++)
                fDSP = fDSP.concat("*(OutGain), ")
        }
        fDSP = fDSP.replace(/,\s*$/,"");
        fDSP = fDSP.concat(";");

        return fDSP;
    }

    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    return {
        mims2faust: mims2faust
    };


// Start file download.


})(jQuery);









/*
################################

THREE.JS Model Renderer

################################
 */


container = document.getElementById('modelView');

var scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, $(container).width()/$(container).height(), 1., 1000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize($(container).width(), $(container).height());
renderer.setClearColor(0xffffff);
renderer.render(scene, camera);
container.appendChild(renderer.domElement);

window.addEventListener( 'resize', function()
{
    camera.aspect = $(container).width()/$(container).height();
    renderer.setSize($(container).width(), $(container).height());
    camera.updateProjectionMatrix();
} );




var controles = new THREE.OrbitControls(camera);
//controles.enableZoom = false;
controles.update();
controles.enabled=false;

/* Gérer les controles souris !! */
container.addEventListener("mouseover", function (e) {
    e.preventDefault();
    controles.enabled=true;
})
container.addEventListener("mouseout", function () {
    controles.enabled=false;

})



function drawScene() {

    while(scene.children.length > 0){
        scene.remove(scene.children[0]);
    }

    var material_MAS = new THREE.MeshBasicMaterial( {color: 0x8CC63F} );
    var material_GND = new THREE.MeshBasicMaterial( {color: 0xc6793f} );
    var material_REF = new THREE.LineBasicMaterial( { color: 0x3f8cc6 } );

    const radius = 0.3;
    const widthSegments = 30;
    const heightSegments = 30;
    var geometry = new THREE.SphereBufferGeometry(radius, widthSegments, heightSegments);
    var geometry2 = new THREE.Geometry();

    let dict = {};
    let posYMax = 0., posYMin = 0.;

    for (let name in massDict) {
        dict = massDict[name];
        let posX = dict["pos"]["x"];
        let posY = dict["pos"]["y"];
        let posZ = dict["pos"]["z"];

        let type = dict["type"];
        if(posY > posYMax)
            posYMax = posY;
        if(posY < posYMin)
            posYMin = posY;
        if(type == "ground") {
            var sphere = new THREE.Mesh(geometry, material_GND);
        } else {
            var sphere = new THREE.Mesh(geometry, material_MAS);
        }
        sphere.position.copy(new THREE.Vector3(posX, posY, posZ));
        scene.add(sphere);
    }

    for (let name in interDict) {
        dict = interDict[name];
        let mass1 = massDict[dict["m1"]];
        let mass2 = massDict[dict["m2"]];
        let mass1posX = mass1["pos"]["x"];
        let mass1posY = mass1["pos"]["y"];
        let mass1posZ = mass1["pos"]["z"];
        let mass2posX = mass2["pos"]["x"];
        let mass2posY = mass2["pos"]["y"];
        let mass2posZ = mass2["pos"]["z"];

        geometry2.vertices.push(new THREE.Vector3(mass1posX, mass1posY, mass1posZ) );
        geometry2.vertices.push(new THREE.Vector3(mass2posX, mass2posY, mass2posZ) );
        var line = new THREE.Line( geometry2, material_REF );
        //scene.add( line );
    }


    var geometry3 = new THREE.PlaneGeometry( 20, 20, 20, 20);
    var material = new THREE.MeshBasicMaterial( {color: 0xffff00, wireframe:true });
    var plane = new THREE.Mesh( geometry3, material );
    scene.add( plane );


    window.scene = scene;

    //camera.position.z = 5;
    camera.position.set((posYMax - posYMin)/2.0,(posYMax - posYMin),0);
    controles.target.set((posYMax - posYMax)/2.0, 0, 0);

    controles.update();


    //var ambientLight = new THREE.AmbientLight( 0x606060 );
    //scene.add( ambientLight );

    var animate = function () {
        requestAnimationFrame(animate);

        controles.update();

        renderer.render(scene, camera);
    };

    animate();
}







(function ($) {
    $(document).ready(function(){

        Split(['#split1', '#split2'], {
            sizes: [65, 35],
            gutter: function (index, direction) {
                var gutter = document.createElement('div')
                gutter.className = 'gutter gutter-' + direction
                return gutter
            },
            gutterSize: 12,
            minSize: [400, 400],

        })
    });

    /* MIMS Console ui and log */
    $(document).ready(function() {
        $('.footerDrawer .open').on('click', function() {
            $('.footerDrawer .content').slideToggle();
        });
    });

/*
    $(document).ready(function() {
        var realConsoleLog = console.log;
        console.log = function () {
            var message = [].join.call(arguments, " ");

            //$(".consoleOutput").text(message);
            $(".consoleOutput").text(message);

            realConsoleLog.apply(console, arguments);
        };
    });
    */
    $(document).ready(function() {
        var realConsoleLog = console.log;
        console.log = function () {
            var message = [].join.call(arguments, " ");
            realConsoleLog.apply(console, arguments);
            var p = document.createElement("p"); //create the paragraph tag
            p.classList += 'log'; // give it a class by adding to the list
            p.innerHTML = message; // add html text or make another element if needed.
            $(".consoleOutput").append(p);

            var objDiv = $(".content");
            objDiv.scrollTop = objDiv.scrollHeight;

        };



    });



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
        $('.accordion-toggle').on('click',function(e){
            if($(this).parents('.panel').children('.accordion-body').hasClass('in')){
                mims2faust();
                drawScene();
                camera.aspect = $(container).width()/$(container).height();
                renderer.setSize($(container).width(), $(container).height());
                camera.updateProjectionMatrix();            }
        });
    });

    $(document).ready(function(){
        $(".collapse").on('shown.bs.collapse', function(){
            mims2faust();
            drawScene();
            camera.aspect = $(container).width()/$(container).height();
            renderer.setSize($(container).width(), $(container).height());
            camera.updateProjectionMatrix();
        });
    });

    $( "#faustExport" ).hide();
    $( "#faustRefresh" ).hide();
    $( "#faustRun" ).hide();

    $( "#updateModelinView" ).hide();

    $("#collapse3").on('shown.bs.collapse', function() {
        $( "#updateModelinView" ).show( 100, function() {
        });
    });

    $("#collapse3").on('hidden.bs.collapse', function() {
        $( "#updateModelinView" ).hide( 100, function() {
        });
    });

    $("#collapse4").on('shown.bs.collapse', function() {
        $( "#faustRefresh" ).show( 100, function() {
            $("#faustRun").show( 100, function () {
                $("#faustExport").show( 100)
            });
        });
    });

    $("#collapse4").on('hidden.bs.collapse', function() {
        $( "#faustRefresh" ).hide( 100, function() {
            $("#faustRun").hide( 100, function () {
                $("#faustExport").hide( 100)
            });
        });
    });

})(jQuery);

