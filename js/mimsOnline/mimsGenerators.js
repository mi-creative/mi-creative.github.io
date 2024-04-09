function generateString(val){
	var nbArgs = arguments.length;
	var s = "";
	if (nbArgs == 0) {
		post("Function needs arguments!");
	}
	else{
		var nbMass = arguments[0];
		var name = arguments[1];

		s = createString(nbMass, name, arguments[2], arguments[3], arguments[4], arguments[5], [parseFloat(arguments[6]), parseFloat(arguments[7]), parseFloat(arguments[8])], [parseFloat(arguments[9]), parseFloat(arguments[10]), parseFloat(arguments[11])], name+"_M", name+"_K", name+"_Z", name+"_Zo");
	}
    return s;
}


function generateRing(val){
    var nbArgs = arguments.length;
    var s = "";
    if (nbArgs == 0) {
        post("Function needs arguments!");
    }
    else{
        var nbMass = arguments[0];
        var radius = arguments[1];
        var name = arguments[2];

        s = createRing(nbMass, radius, name, arguments[3], arguments[4], arguments[5], arguments[6], [parseFloat(arguments[7]), parseFloat(arguments[8]), parseFloat(arguments[9])], arguments[13],  name+"_M", name+"_K", name+"_Z", name+"_Zo");
    }
    return s;
}


function generateMesh(val){
	var nbArgs = arguments.length;
	var s = "";
	if (nbArgs == 0) {
		post("Function needs arguments!");
	}
	else{
		var len = arguments[0];
		var wid = arguments[1];
		var name = arguments[2];

		s = createMembrane(len, wid, name, arguments[3], arguments[4], arguments[5], arguments[6], [parseFloat(arguments[7]), parseFloat(arguments[8]), parseFloat(arguments[9])], [parseFloat(arguments[10]), parseFloat(arguments[11]), parseFloat(arguments[12])], arguments[13],  name+"_M", name+"_K", name+"_Z", name+"_Zo");
	}
    return s;
}


function generateTriangle(val){
	var nbArgs = arguments.length;
	var s = "";
	if (nbArgs == 0) {
		post("Function needs arguments!");
	}
	else{
		var nbMass = arguments[0];
		var name = arguments[1];

		s = createTriangleMembrane(nbMass, name, arguments[2], arguments[3], arguments[4], arguments[5], [parseFloat(arguments[6]), parseFloat(arguments[7]), parseFloat(arguments[8])], [parseFloat(arguments[9]), parseFloat(arguments[10]), parseFloat(arguments[11])], arguments[12], name+"_M", name+"_K", name+"_Z", name+"_Zo");
	}
    return s;
}


function generateCube(val){
    var nbArgs = arguments.length;
    var s = "";
    if (nbArgs == 0) {
        post("Function needs arguments!");
    }
    else{
        var len = arguments[0];
        var wid = arguments[1];
        var dep = arguments[2];
        var name = arguments[3];

        s = createCube(len, wid, dep, name, arguments[4], arguments[5], arguments[6], arguments[7], [parseFloat(arguments[8]), parseFloat(arguments[9]), parseFloat(arguments[10])], [parseFloat(arguments[11]), parseFloat(arguments[12]), parseFloat(arguments[13])], name+"_M", name+"_K", name+"_Z", name+"_Zo");
    }
    return s;
}

function generateFromXYList(arguments){
    var name = arguments[0];
    var textToGenerate = arguments[11];
    console.log(textToGenerate);
    var s = createFromXYList(name, arguments[1], arguments[2], arguments[3], arguments[4], [parseFloat(arguments[5]), parseFloat(arguments[6]), parseFloat(arguments[7])], [parseFloat(arguments[8]), parseFloat(arguments[9]), parseFloat(arguments[10])],textToGenerate);
    return s;
}


function createString(size, name, M, K, Z, Zosc, firstPos, lastPos, mParamName, kParamName, zParamName, zoscParamName) {
    var dampVal, i, massVal, s, stiffVal, zoscVal;
    var totalMNumber = 0;
    var totalINumber = 0;

    size = parseInt(size, 10);

	step = [(lastPos[0]-firstPos[0])/(size+1), (lastPos[1]-firstPos[1])/(size+1), (lastPos[2]-firstPos[2])/(size+1)];

	s = "";
    zoscVal = "";


    if (mParamName) {
        s += (((("@" + mParamName) + " param ") + M.toString()) + "\n");
        massVal = mParamName;
    } else {
        massVal = M.toString();
    }
    if (kParamName) {
        s += (((("@" + kParamName) + " param ") + K.toString()) + "\n");
        stiffVal = kParamName;
    } else {
        stiffVal = K.toString();
    }
    if (zParamName) {
        s += (((("@" + zParamName) + " param ") + Z.toString()) + "\n");
        dampVal = zParamName;
    } else {
        dampVal = Z.toString();
    }
    if (Zosc !== 0) {
        if (zoscParamName) {
            s += (((("@" + zoscParamName) + " param ") + Zosc.toString()) + "\n");
            zoscVal = zoscParamName;
        } else {
            zoscVal = Zosc.toString();
        }
    }

	s += "\n";

    s += (("@" + name) + "_g0 ground "
	  + " [" +firstPos[0].toFixed(2) + " " + firstPos[1].toFixed(2));

	var zPos = (firstPos[2]).toFixed(2)
	s += " " + zPos + "] \n";

	i = 0;
    while ((i < size)) {
        // ( parseFloat(Zosc) === 0)
        if (false) {
            s += ("@" + name) + "_m" + i.toString() + " mass " + massVal;
            totalMNumber += 1;
        } else {
            s += ("@" + name) + "_m" + i.toString() + " osc " + massVal + " 0 " + zoscVal;
            totalMNumber += 1;
        }

		s += " [" +(firstPos[0]+(i+1)*step[0]).toFixed(2) + " " + (firstPos[1]+(i+1)*step[1]).toFixed(2);
		var zPos = (firstPos[2]+(i+1)*step[2]).toFixed(2)
		s += " " + zPos + "] 0\n";
        i = (i + 1);
    }

	s += ("@" + name) + "_g1 ground "
      + " [" +lastPos[0].toFixed(2) + " " + lastPos[1].toFixed(2);

	var zPos = (lastPos[2]).toFixed(2)
	s += " " + zPos + "] \n";
    totalMNumber += 1;



    s += "\n";
    i = 0;
    s += (((("@" + name) + "_r") + i.toString()) + " springDamper ");
    s += (((((("@" + name) + "_g0 @") + name) + "_m") + i.toString()) + " ");
    s += (((stiffVal + " ") + dampVal) + "\n");
    totalINumber += 1;
    totalMNumber += 1;


    while ((i < (size - 1))) {
        s += (((("@" + name) + "_r") + (i + 1).toString()) + " springDamper ");
        s += (((((((("@" + name) + "_m") + i.toString()) + " @") + name) + "_m") + (i + 1).toString()) + " ");
        s += (((stiffVal + " ") + dampVal) + "\n");
        i = (i + 1);
        totalINumber += 1;
    }
    s += (((("@" + name) + "_r") + (i + 1).toString()) + " springDamper ");
    s += (((((("@" + name) + "_m") + i.toString()) + " @") + name) + "_g1 ");
    s += (((stiffVal + " ") + dampVal) + "\n");
    totalINumber += 1;

    s += "\n";

    s += "\n";
    s += "# Model's total number of masses = " + totalMNumber;
    s += "\n";
    s += "# Model's total number of interactions = " + totalINumber;

    s += "\n";
    return s;
}

function createRing(nbMass, radius, name, M, K, Z, Zosc, firstPos, lastPos, mParamName, kParamName, zParamName, zoscParamName) {
    var dampVal, i, massVal, s, stiffVal, zoscVal;
    var totalMNumber = 0;
    var totalINumber = 0;
    nbMass = parseInt(nbMass, 10);
    radius = parseInt(radius, 10);
    let center = [firstPos[0], firstPos[1], firstPos[2]];
    let angleStep = 3.14159265359*2/nbMass;

    s = "";
    zoscVal = "";

    if (mParamName) {
        s += (((("@" + mParamName) + " param ") + M.toString()) + "\n");
        massVal = mParamName;
    } else {
        massVal = M.toString();
    }
    if (kParamName) {
        s += (((("@" + kParamName) + " param ") + K.toString()) + "\n");
        stiffVal = kParamName;
    } else {
        stiffVal = K.toString();
    }
    if (zParamName) {
        s += (((("@" + zParamName) + " param ") + Z.toString()) + "\n");
        dampVal = zParamName;
    } else {
        dampVal = Z.toString();
    }

    if (Zosc !== 0) {
        if (zoscParamName) {
            s += (((("@" + zoscParamName) + " param ") + Zosc.toString()) + "\n");
            zoscVal = zoscParamName;
        } else {
            zoscVal = Zosc.toString();
        }
    }

    s += "\n";


    i = 0;
    while ((i < nbMass)) {
        console.log(Zosc);
        // ( parseFloat(Zosc) === 0)
        if (false) {
            s += ("@" + name) + "_m" + i.toString() + " mass " + massVal;
            totalMNumber += 1;
        } else {
            s += ("@" + name) + "_m" + i.toString() + " osc " + massVal + " 0 " + zoscVal;
            totalMNumber += 1;
        }

        s += " [" +(center[0]+radius*Math.cos(i*angleStep)).toFixed(2) + " " + (center[1]+radius*Math.sin(i*angleStep)).toFixed(2);
        var zPos = (center[2]).toFixed(2);
        s += " " + zPos + "] 0\n";
        i = (i + 1);
    }

    i = 0;
    while ((i < (nbMass - 1))) {
        s += (((("@" + name) + "_r") + (i + 1).toString()) + " springDamper ");
        s += (((((((("@" + name) + "_m") + i.toString()) + " @") + name) + "_m") + (i + 1).toString()) + " ");
        s += (((stiffVal + " ") + dampVal) + "\n");
        i = (i + 1);
        totalINumber += 1;
    }
    s += (((("@" + name) + "_r") + (i + 1).toString()) + " springDamper ");
    s += (((((((("@" + name) + "_m") + (i).toString()) + " @") + name) + "_m") + (0).toString()) + " ");
    s += (((stiffVal + " ") + dampVal) + "\n");
    totalINumber += 1;



    s += "\n";

    s += "\n";
    s += "# Model's total number of masses = " + totalMNumber;
    s += "\n";
    s += "# Model's total number of interactions = " + totalINumber;

    s += "\n";

    return s;

}

function createMembrane(sizeL, sizeH, name, M, K, Z, Zosc, firstPos, lastPos, fixedPoints, mParamName, kParamName, zParamName, zoscParamName) {
    var dampVal, index, mList, massVal, s, sprIndex, stiffVal, zoscVal;
    var totalMNumber = 0;
    var totalINumber = 0;

	let step = [(lastPos[0]-firstPos[0])/(sizeH-1), (lastPos[1]-firstPos[1])/(sizeL-1)];
	s = "";
    zoscVal = "";

	if (mParamName) {
        s += (((("@" + mParamName) + " param ") + M.toString()) + "\n");
        massVal = mParamName;
    } else {
        massVal = M.toString();
    }
    if (kParamName) {
        s += (((("@" + kParamName) + " param ") + K.toString()) + "\n");
        stiffVal = kParamName;
    } else {
        stiffVal = K.toString();
    }
    if (zParamName) {
        s += (((("@" + zParamName) + " param ") + Z.toString()) + "\n");
        dampVal = zParamName;
    } else {
        dampVal = Z.toString();
    }
    if (Zosc !== 0) {
        if (zoscParamName) {
            s += (((("@" + zoscParamName) + " param ") + Zosc.toString()) + "\n");
            zoscVal = zoscParamName;
        } else {
            zoscVal = Zosc.toString();
        }
    }
    s += "\n";
    mList = [];

    switch (fixedPoints) {
        case "none":
            for (var j = 0, _pj_a = sizeL; (j < _pj_a); j += 1) {
                for (var i = 0, _pj_b = sizeH; (i < _pj_b); i += 1) {
                    index = ((((("@" + name) + "_m") + j.toString()) + "_") + i.toString());
                    if (Zosc === 0)
                        s += ((index + " mass ") + massVal);
                    else
                        s += ((index + " osc ") + massVal) + " 0 " + zoscVal;
                    s += " [" +(firstPos[0]+i*step[0]).toFixed(2) + " "
                    s += (firstPos[1]+j*step[1]).toFixed(2);

                    var zPos = "0";
                    s += " " + zPos + "] 0\n";

                    //s += " 0] 0\n";
                    mList.push(index);
                    totalMNumber += 1;
                }
            }
            break;

            // TODO : AJOUTER PRISE EN CHARGE STEP en Z
        case "corners":
            for (var j = 0, _pj_a = sizeL; (j < _pj_a); j += 1) {
                for (var i = 0, _pj_b = sizeH; (i < _pj_b); i += 1) {
                    index = ((((("@" + name) + "_m") + j.toString()) + "_") + i.toString());

                    if(i==0&&j==0 || i==_pj_b-1&&j==_pj_a-1 || i==0&&j==_pj_a-1 || i==_pj_b-1&&j==0){
                        s += ((index + " ground "));

                        s += " [" +(firstPos[0]+i*step[0]).toFixed(2) + " ";
                        s += (firstPos[1]+j*step[1]).toFixed(2);

                        var zPos = 0;
                        s += " " + zPos + "]\n";

                    } else {
                        if (Zosc === 0)
                            s += ((index + " mass ") + massVal);
                        else
                            s += ((index + " osc ") + massVal) + " 0 " + zoscVal;

                        s += " [" +(firstPos[0]+i*step[0]).toFixed(2) + " ";
                        s += (firstPos[1]+j*step[1]).toFixed(2);

                        var zPos = 0;
                        s += " " + zPos + "] 0\n";
                    }

                    //s += " 0] 0\n";
                    mList.push(index);
                    totalMNumber += 1;
                }
            }

            break;

            // TODO :  AJOUTER PRISE EN CHARGE STEP en Z
        case "borders":
            for (var j = 0, _pj_a = sizeL; (j < _pj_a); j += 1) {
                for (var i = 0, _pj_b = sizeH; (i < _pj_b); i += 1) {
                    index = ((((("@" + name) + "_m") + j.toString()) + "_") + i.toString());

                    if(i==0 || i==_pj_b-1 || j==_pj_a-1 || j==0){
                        s += ((index + " ground "));

                        s += " [" +(firstPos[0]+i*step[0]).toFixed(2) + " ";
                        s += (firstPos[1]+j*step[1]).toFixed(2);

                        var zPos = 0;
                        s += " " + zPos + "]\n";

                    } else {
                        if (Zosc === 0)
                            s += ((index + " mass ") + massVal);
                        else
                            s += ((index + " osc ") + massVal) + " 0 " + zoscVal;

                        s += " [" +(firstPos[0]+i*step[0]).toFixed(2) + " "
                        s += (firstPos[1]+j*step[1]).toFixed(2);

                        var zPos = 0;
                        s += " " + zPos + "] 0\n";
                    }


                    //s += " 0] 0\n";
                    mList.push(index);
                    totalMNumber += 1;
                }
            }

            break;

    }

    s += "\n";
    sprIndex = 0;
    for (var j = 0, _pj_a = sizeL; (j < _pj_a); j += 1) {
        for (var i = 0, _pj_b = (sizeH - 1); (i < _pj_b); i += 1) {
            s += (((("@" + name) + "_r") + sprIndex.toString()) + " springDamper ");
            s += ((mList[(((j * (sizeH - 1)) + i) + j)] + " ") + mList[((((j * (sizeH - 1)) + i) + 1) + j)]);
            s += ((((" " + stiffVal) + " ") + dampVal) + "\n");
            sprIndex += 1;
            totalINumber += 1;

        }
    }
    s += "\n";
    for (var j = 0, _pj_a = (sizeL - 1); (j < _pj_a); j += 1) {
        for (var i = 0, _pj_b = sizeH; (i < _pj_b); i += 1) {
            s += (((("@" + name) + "_r") + sprIndex.toString()) + " springDamper ");
            s += ((mList[((j * sizeH) + i)] + " ") + mList[(((j + 1) * sizeH) + i)]);
            s += ((((" " + stiffVal) + " ") + dampVal) + "\n");
            sprIndex += 1;
            totalINumber += 1;

        }
    }



    s += "\n";

    s += "\n";
    s += "# Model's total number of masses = " + totalMNumber;
    s += "\n";
    s += "# Model's total number of interactions = " + totalINumber;

    s += "\n";
    return s;

}

function createTriangleMembrane(size, name, M, K, Z, Zosc, firstPos, lastPos, fixedPoints, mParamName, kParamName, zParamName, zoscParamName) {
	var dampVal, index, mList, masCount, massVal, s, sprIndex, stiffVal, zoscVal;
    var totalMNumber = 0;
    var totalINumber = 0;

    size = parseInt(size, 10);
    step = [(lastPos[0]-firstPos[0])/(size-1), (lastPos[1]-firstPos[1])/(size-1), (lastPos[2]-firstPos[2])/(size-1)];


	s = "";
    zoscVal = "";

	if (mParamName) {
        s += (((("@" + mParamName) + " param ") + M.toString()) + "\n");
        massVal = mParamName;
    } else {
        massVal = M.toString();
    }
    if (kParamName) {
        s += (((("@" + kParamName) + " param ") + K.toString()) + "\n");
        stiffVal = kParamName;
    } else {
        stiffVal = K.toString();
    }
    if (zParamName) {
        s += (((("@" + zParamName) + " param ") + Z.toString()) + "\n");
        dampVal = zParamName;
    } else {
        dampVal = Z.toString();
    }
    if (Zosc !== 0) {
        if (zoscParamName) {
            s += (((("@" + zoscParamName) + " param ") + Zosc.toString()) + "\n");
            zoscVal = zoscParamName;
        } else {
            zoscVal = Zosc.toString();
        }
    }
    s += "\n";
    mList = [];

    switch (fixedPoints) {
        case "none":
            for (var j = 0, _pj_a = size; (j < _pj_a); j += 1) {
                for (var i = 0, _pj_b = (size - j); (i < _pj_b); i += 1) {
                    index = ((((("@" + name) + "_m") + j.toString()) + "_") + i.toString());
                    if (Zosc === 0)
                        s += (index + " mass ") + massVal;
                    else
                        s += (index + " osc ") + massVal + " 0 " + zoscVal;

                    s += " [" + (firstPos[0] + (i+j/2.0)*step[0]).toFixed(2) + " "
                    s += (firstPos[1]+j*step[1]).toFixed(2);

                    var zPos = (firstPos[2]+(j)*step[2]).toFixed(2);
                    s += " " + zPos + "] 0\n";

                    mList.push(index);
                    totalMNumber += 1;
                }
            }

            break;
        case "corners" :
            for (var j = 0, _pj_a = size; (j < _pj_a); j += 1) {
                for (var i = 0, _pj_b = (size - j); (i < _pj_b); i += 1) {
                    index = ((((("@" + name) + "_m") + j.toString()) + "_") + i.toString());

                    if(i==0&&j==0 || i==0&&j==_pj_a-1 || i==_pj_b-1&&j==0) {
                        s += (index + " ground ");
                        s += " [" + (firstPos[0] + (i+j/2.0)*step[0]).toFixed(2) + " "
                        s += (firstPos[1]+j*step[1]).toFixed(2);

                        var zPos = (firstPos[2]+(j)*step[2]).toFixed(2);
                        s += " " + zPos + "]\n";

                    } else {
                        if (Zosc === 0)
                            s += (index + " mass ") + massVal;
                        else
                            s += (index + " osc ") + massVal + " 0 " + zoscVal;
                        s += " [" + (firstPos[0] + (i+j/2.0)*step[0]).toFixed(2) + " "
                        s += (firstPos[1]+j*step[1]).toFixed(2);

                        var zPos = (firstPos[2]+(j)*step[2]).toFixed(2);
                        s += " " + zPos + "] 0\n";
                    }

                    mList.push(index);
                    totalMNumber += 1;
                }
            }

            break;
        case "borders":
            for (var j = 0, _pj_a = size; (j < _pj_a); j += 1) {
                for (var i = 0, _pj_b = (size - j); (i < _pj_b); i += 1) {
                    index = ((((("@" + name) + "_m") + j.toString()) + "_") + i.toString());

                    if(i==0 || i==size-1-j || j==0) {
                        s += (index + " ground ");
                        s += " [" + (firstPos[0] + (i+j/2.0)*step[0]).toFixed(2) + " "
                        s += (firstPos[1]+j*step[1]).toFixed(2);

                        var zPos = (firstPos[2]+(j)*step[2]).toFixed(2);
                        s += " " + zPos + "]\n";

                    } else {
                        if (Zosc === 0)
                            s += (index + " mass ") + massVal;
                        else
                            s += (index + " osc ") + massVal + " 0 " + zoscVal;
                        s += " [" + (firstPos[0] + (i+j/2.0)*step[0]).toFixed(2) + " "
                        s += (firstPos[1]+j*step[1]).toFixed(2);

                        var zPos = (firstPos[2]+(j)*step[2]).toFixed(2);
                        s += " " + zPos + "] 0\n";
                    }

                    mList.push(index);
                    totalMNumber += 1;
                }
            }
            break;

    }

    s += "\n";
    sprIndex = 0;
    masCount = 0;
    for (var j = 0, _pj_a = (size - 1); (j < _pj_a); j += 1) {
        for (var i = 0, _pj_b = ((size - 1) - j); (i < _pj_b); i += 1) {
            s += (((("@" + name) + "_r") + sprIndex.toString()) + " springDamper ");
            s += ((mList[masCount] + " ") + mList[(masCount + 1)]);
            s += ((((" " + stiffVal) + " ") + dampVal) + "\n");
            sprIndex += 1;
            totalINumber += 1;
            masCount += 1;
        }
        masCount += 1;
    }
    s += "\n";
    masCount = 0;
    for (var j = 0, _pj_a = (size - 1); (j < _pj_a); j += 1) {
        for (var i = 0, _pj_b = ((size - 1) - j); (i < _pj_b); i += 1) {
            s += (((("@" + name) + "_r") + sprIndex.toString()) + " springDamper ");
            s += ((mList[(masCount + i)] + " ") + mList[(((masCount + i) + size) - j)]);
            s += ((((" " + stiffVal) + " ") + dampVal) + "\n");
            sprIndex += 1;
            totalINumber += 1;

        }
        masCount += (size - j);

    }
    s += "\n";
    masCount = 1;
    for (var j = 0, _pj_a = (size - 1); (j < _pj_a); j += 1) {
        for (var i = 0, _pj_b = ((size - 1) - j); (i < _pj_b); i += 1) {
            s += (((("@" + name) + "_r") + sprIndex.toString()) + " springDamper ");
            s += ((mList[(masCount + i)] + " ") + mList[((((masCount + i) + size) - j) - 1)]);
            s += ((((" " + stiffVal) + " ") + dampVal) + "\n");
            sprIndex += 1;
            totalINumber += 1;

        }
        masCount += (size - j);

    }
    s += "\n";
    s += "# Model's total number of masses = " + totalMNumber;
    s += "\n";
    s += "# Model's total number of interactions = " + totalINumber;

    s += "\n";

    //console.log(s);
    return s;
}

function createCube(dimX, dimY, dimZ, name, M, K, Z, Zosc, firstPos, lastPos, mParamName, kParamName, zParamName, zoscParamName){
    var dampVal, index, mList, massVal, s, sprIndex, stiffVal, zoscVal;
    var totalMNumber = 0;
    var totalINumber = 0;

    step = [(lastPos[0]-firstPos[0])/(dimX-1), (lastPos[1]-firstPos[1])/(dimY-1), (lastPos[2]-firstPos[2])/(dimZ-1)];

    s = "";
    zoscVal = "";

    if (mParamName) {
        s += (((("@" + mParamName) + " param ") + M.toString()) + "\n");
        massVal = mParamName;
    } else {
        massVal = M.toString();
    }
    if (kParamName) {
        s += (((("@" + kParamName) + " param ") + K.toString()) + "\n");
        stiffVal = kParamName;
    } else {
        stiffVal = K.toString();
    }
    if (zParamName) {
        s += (((("@" + zParamName) + " param ") + Z.toString()) + "\n");
        dampVal = zParamName;
    } else {
        dampVal = Z.toString();
    }
    if (Zosc !== 0) {
        if (zoscParamName) {
            s += (((("@" + zoscParamName) + " param ") + Zosc.toString()) + "\n");
            zoscVal = zoscParamName;
        } else {
            zoscVal = Zosc.toString();
        }
    }


    s += "\n";


    for (var k = 0; k < dimZ; k++) {
        for (var i = 0; i < dimX; i++) {
            for (var j = 0; j < dimY; j++) {

                index = ((((((("@" + name) + "_m") + j.toString()) + "_") + i.toString()) + "_") + k.toString());

                if (Zosc === 0)
                    s += ((index + " mass ") + massVal);
                else
                    s += ((index + " osc ") + massVal) + " 0 " + zoscVal;

                s += " [" + (firstPos[0] + j * step[1]).toFixed(2) + " ";
                s += (firstPos[1] + i * step[0]).toFixed(2) + " ";
                s += (firstPos[2] + k * step[2]).toFixed(2) + "] 0\n";

                totalMNumber += 1;

            }
        }
    }
    s += "\n";

    sprIndex = 0;
    for (var k = 0; k < dimZ; k++) {
        for (var i = 0; i < dimX-1; i++) {
            for (var j = 0; j < dimY; j++) {

                s += (((("@" + name) + "_r") + sprIndex.toString()) + " springDamper ");

                s += ((((((("@" + name) + "_m") + j.toString()) + "_") + i.toString()) + "_") + k.toString());
                s += " ";
                s += ((((((("@" + name) + "_m") + j.toString()) + "_") + (i + 1).toString()) + "_") + k.toString());

                s += ((((" " + stiffVal) + " ") + dampVal) + "\n");
                sprIndex += 1;
                totalINumber += 1;
            }
        }
    }
    s += "\n";
    for (var k = 0; k < dimZ; k++) {
        for (var i = 0; i < dimX; i++) {
            for (var j = 0; j < dimY-1; j++) {

                s += (((("@" + name) + "_r") + sprIndex.toString()) + " springDamper ");

                s += ((((((("@" + name) + "_m") + j.toString()) + "_") + i.toString()) + "_") + k.toString());
                s += " ";
                s += ((((((("@" + name) + "_m") + (j+1).toString()) + "_") + i.toString()) + "_") + k.toString());

                s += ((((" " + stiffVal) + " ") + dampVal) + "\n");
                sprIndex += 1;
                totalINumber += 1;
            }
        }
    }
    s += "\n";

    for (var k = 0; k < dimZ-1; k++) {
        for (var i = 0; i < dimX; i++) {
            for (var j = 0; j < dimY; j++) {

                s += (((("@" + name) + "_r") + sprIndex.toString()) + " springDamper ");

                s += ((((((("@" + name) + "_m") + j.toString()) + "_") + i.toString()) + "_") + k.toString());
                s += " ";
                s += ((((((("@" + name) + "_m") + j.toString()) + "_") + i.toString()) + "_") + (k+1).toString());

                s += ((((" " + stiffVal) + " ") + dampVal) + "\n");
                sprIndex += 1;
                totalINumber += 1;
            }
        }
    }



    s += "\n";

    s += "\n";
    s += "# Model's total number of masses = " + totalMNumber;
    s += "\n";
    s += "# Model's total number of interactions = " + totalINumber;

    s += "\n";
    return s;



}

function createFromXYList(name, M, K, Z, Zosc, firstPos, lastPos, textToGenerate) {
    console.log(textToGenerate);
    var lines = textToGenerate.replace(/\r\n/g, "\n").split("\n");
    var coordinates;
    var s = "";
    var nbLines = lines.length;
    var x, y, z;
    var xMax, xMin, yMax, yMin, zMax, zMin;
    var xScale, yScale, zScale;

    s += (((("@"+name+"M"+" param ") + M.toString()) + "\n"));
    s += (((("@"+name+"K param ") + K.toString()) + "\n"));
    s += (((("@"+name+"Z param ") + Z.toString()) + "\n"));
    s += (((("@"+name+"Zosc param ") + Zosc.toString()) + "\n"));

    s += "\n";

    /* Extraction et mise en forme d'une serie de triplets X, Y, Z */
    var xCoordinates = [], yCoordinates = [], zCoordinates = [];

    lines.forEach(function(line) {
        coordinates = line.replace(/,/g, "\n").split("\n");
        if (coordinates.length == 1) {
            xCoordinates.push(coordinates[0]); yCoordinates.push(0); zCoordinates.push(0);
        } else if (coordinates.length == 2) {
            xCoordinates.push(coordinates[0]); yCoordinates.push(coordinates[1]); zCoordinates.push(0);
        } else if (coordinates.length == 3) {
            xCoordinates.push(coordinates[0]); yCoordinates.push(coordinates[1]); zCoordinates.push(coordinates[2]);
        } else if (coordinates.length > 3) {
            console.log("FORMAT ERROR");
        }
    });

    /* Calcul les valeurs extremes en X, Y et Z trouvee dans le text importe */
    xMax = Math.max.apply(null, xCoordinates),
    xMin = Math.min.apply(null, xCoordinates),
    yMax = Math.max.apply(null, yCoordinates),
    yMin = Math.min.apply(null, yCoordinates),
    zMax = Math.max.apply(null, zCoordinates),
    zMin = Math.min.apply(null, zCoordinates);

    /* Calcul le ratio d'echelle entre dimensions presentes dans le text et dimensions / position specifiees par l'entree utilisateur */
    xScale = (xMax-xMin)/(lastPos[0]-firstPos[0]);
    yScale = (yMax-yMin)/(lastPos[1]-firstPos[1]);
    zScale = (zMax-zMin)/(lastPos[2]-firstPos[2]);

    for (let i = 0; i < nbLines; i++) {

        x = ((xCoordinates[i]-xMin)/xScale+firstPos[0]);
        if(isNaN(x)) x=0;
        y = ((yCoordinates[i]-yMin)/yScale+firstPos[1]);
        if(isNaN(y)) y=0;
        z = ((zCoordinates[i]-zMin)/zScale+firstPos[2]);
        if(isNaN(z)) z=0;

        s += "@" + name + "_m" + i + " osc " +name+"M 0 " +name+"Zosc";
        s += " [" + x + " " + y + " " + z + "] 0\n";
    }

    s += "\n";

    for (let i = 0; i < nbLines-1; i++) {
        s += "@" + name + "_r" + i + " springDamper ";
        s += "@" + name + "_m" + i + " @" + name + "_m" + (i + 1) + " " + name+"K "+ name+"Z" + "\n" ;
    }

    s += "@" + name + "_r" + nbLines + " springDamper ";
    s += "@" + name + "_m" + (nbLines - 1) + " @" + name + "_m" + 0 + " " + name+"K "+ name+"Z" + "\n" ;

    return s;
}

