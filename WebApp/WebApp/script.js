var counter = 4;

//fired before page is created (one of the very first state in page-lifecycle)
$(document).bind('pagebeforecreate', function (event, ui) {
    generateBirdList(counter)
    generatePanels(counter);


});
//fired when page is loaded, to fill the html with the birds data
$(document).bind('pagebeforeshow', function (event, ui) {
    setBirds(counter)

});


//generate html-list with "count" list-elements
function generateBirdList(count) {
    var html = "<ul data-role=\"listview\" class=\"ui-listview\">";
    for (var i = 1; i < count + 1; i++) {
        html = html + "<li id=\"" + i + "\" class=\"ui-li-has-thumb\">\n <a class=\"ui-btn ui-btn-icon-right ui-icon-carat-r\">\n <img id=\"bird" + i + "_img\" src=\"\">\n <h3 id=\"bird" + i + "_name\">Dunkelente</h3>\n <p id=\"bird" + i + "_sciname\">Anas rubripes</p>\n </a>\n </li>";
    }
    html = html + "</ul>";
    $('#main').html(html);

}

//generate "count" * html-panel
function generatePanels(count) {
    var html = "";
    for (var i = 1; i < count + 1; i++) {
        html = html + "<div data-role=\"panel\" data-position=\"right\" data-display=\"overlay\" id=\"panel" + i + "\" data-theme=\"a\">\n\n <div class=\"panel-content\">\n <h3 id=\"panel_name" + i + "\">" + i + "</h3>\n <p id=\"panel_abs" + i + "\">This panel has all the default options: positioned on the left with the reveal display mode. The panel markup is <em>before</em> the header, content and footer in the source order.</p>\n\n <a href=\"#demo-links\" data-rel=\"close\" data-role=\"button\" data-theme=\"a\" data-icon=\"delete\" data-inline=\"true\">Close panel</a>\n </div></div>";
    }

    $('#panels').html(html);
}

function setBirds(count) {
    $.ajax({
        type: "GET",
        //URL to the XML-Document
        url: "xml/birds_example.xml",
        dataType: "xml",
        success: function (xml) {

            //this stores the random numbers taken, to avoid multiple choise of equvalent numbers
            chosenNumbers = [];

            var correctAnwser = Math.floor((Math.random() * count) + 1);


            for (var i = 1; i < count + 1; i++) {

                //gets random number between 1-10
                var randomNumber = Math.floor((Math.random() * 10) + 1);
                //tests if this number was already taken
                while (chosenNumbers.indexOf(randomNumber) > -1) {
                    var randomNumber = Math.floor((Math.random() * 10) + 1);
                }
                //add taken number to array, so it will not be taken a second time
                chosenNumbers.push(randomNumber);

                //get bird with id=randomNumber
                var x = $(xml).find("bird[id=" + randomNumber + "]");

                //get img, name an sciname
                var img = $(x).find("img").text();
                var name = $(x).find("name").text();
                var sciname = $(x).find("sciname").text();
                var abs = $(x).find("abs").text();

                //manipulate the html-page to fill in the birds-data
                //list
                $('#bird' + i + '_img').attr('src', img);
                $('#bird' + i + '_name').text(name);
                $('#bird' + i + '_sciname').text(sciname);

                //panel
                $('#panel_name' + i).text(name);
                $('#panel_abs' + i).text(abs);

                //set onclick events (is anwser correct, id)
                if (correctAnwser === i) {
                    $('#' + i).attr('onclick', 'clicked(1,' + i + ');');
                }
                else {
                    $('#' + i).attr('onclick', 'clicked(0,' + i + ');');

                }
            }

        },
        //ajax error
        error: function (xml) {
            alert(xml.status + ' ' + xml.statusText);
        }
    });


}

function clicked(bool, id) {
    //opens panel of clicked bird
    $("#panel" + id).panel("open");

    //correct anwser
    if (bool === 1) {
        $('#anwser').css('background-color', '#dff0d8');
        $('#anwser').text('Richtige Antwort');


    }
        //wrong anwser
    else {
        $('#anwser').css('background-color', '#f2dede');
        $('#anwser').text('Falsche Antwort');


    }
}