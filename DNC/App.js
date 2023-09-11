var config = {};
const pollingTime = 30000;//milliseconds
var token;

$(document).ready(function(){
	$("#errorMessage").hide();
    
    if(window.location.hash) 
    {	
        config.environment = getParameterByName('environment', window.location.search);               
        token = getParameterByName('access_token', window.location.hash);
        location.hash = '';
        console.log("location hash")
        console.log(config.environment)
        
    }
    else
    {	
        console.log("Config Genesys Cloud")
        config = {
            "environment": "usw2.pure.cloud",
            "clientId": "65bddbb5-72f8-45f3-b507-dc68cbf5a938",
            "redirectUri": "https://uriosteamarillo.github.io/DNC/index.html"

        };
        
        var queryStringData = {
            response_type: "token",
            client_id: config.clientId,
            redirect_uri: config.redirectUri
        }        
        
        console.log(config.environment)
        window.location.replace("https://login." + config.environment + "/authorize?" + jQuery.param(queryStringData));
    }

});


function getParameterByName(name, data) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\#&?]" + name + "=([^&#?]*)"),
      results = regex.exec(data);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};


function addNumberToDNC( phoneNumberToAdd) {
    let dnclist = '1ea5c5a9-76f2-451f-9798-7ba8b5be179c';
    console.log(config)
    let url = "https://api." + config.environment + "/api/v2/outbound/dnclists/" + dnclist + "/phonenumbers";

    // Create the request body as an object
    const requestBody = {
        action:"add",
        phoneNumbers: [phoneNumberToAdd],
        "expirationDateTime": "" // Replace 'phoneNumberToAdd' with the actual phone number you want to add
    };

    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            type: "PATCH",
            beforeSend: function (xhr) { xhr.setRequestHeader('Authorization', 'bearer ' + token); },
            contentType: "application/json",
            dataType: 'json',
            data: JSON.stringify(requestBody), // Convert the object to JSON
            success: function (result) {
                console.log(result);
                // Handle success here
                resolve(result);
            },
            error: function (request) {
                console.log("addNumberToDNC-error", request);
                // Handle errors here
                reject("addNumberToDNC -> " + JSON.stringify(request));
            }
        });
    });
}





