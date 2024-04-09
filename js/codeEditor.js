


var js = CodeMirror.fromTextArea(document.getElementById("codejs"), {
    mode:  "javascript",
    lineNumbers: true,
    lineWrapping: true,
    extraKeys: {"Cmd-Enter": "compile"}
    //highlightSelectionMatches: {showToken: /\w/, annotateScrollbar: true}
});

var faust = CodeMirror.fromTextArea(document.getElementById("codefaust"), {
    mode:  "application/faust",
    lineNumbers: true,
    lineWrapping: true,
    autoCloseBrackets: true

    //highlightSelectionMatches: {showToken: /\w/, annotateScrollbar: true}
});

js.setOption("extraKeys", {
    "Ctrl-Enter": function(cm) {
        if(js.getSelection()){
            executeCode(js.getSelection());
        }
        else{
            executeCode(js.getLine(js.getCursor().line));
            var l = js.getLine(js.getCursor().line)
            //js.markText({line: js.getCursor().line, ch:0}, {line: js.getCursor().line+1, ch:4}, {className: ".CodeMirror-selected"});
        }
    }
});

function executeCode(jsx){
    console.log("In execute code funtion");
    try {

        $("#chalfunction").remove();
        var s = document.createElement('script');
        s.setAttribute("id", "chalfunction");
        s.textContent = "function physicalFunction(){\n"
        s.textContent += jsx;
        s.textContent += "};"
        document.scripts.namedItem("insertcode").append(s);

        physicalFunction();

        var today = new Date();
        var time =
            ("0" + today.getHours()).slice(-2) + ":" +
            ("0" + today.getMinutes()).slice(-2) + ":" +
            ("0" + today.getSeconds()).slice(-2);

        var info = "Commands executed without error (" + time + ")";
        $(".pconsole").remove();
        $(".console").append("<p class='pconsole indent'>" + info + "</p>");
        drawScene();
        console.log(Object.values(Model.getMatArray()));
        console.log(Object.values(Model.getInteractionArray()));
    }
    catch (error) {
        console.error(error);
        $(".pconsole").remove();
        $(".console").append("<p class='pconsole indent' style=\"background-color: white;color:#FF0000;\">" + error + " </p>");
    }
}

// Callback function for running the Javascript code.
$(document).ready(function(){
    $("#run").click(function(){
        var jsx = js.getValue();
        executeCode(jsx);
    });
});
