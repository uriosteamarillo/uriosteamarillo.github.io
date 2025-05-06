var config = {};


$(document).ready(function(){
	$("#errorMessage").hide();
    
    if(window.location.hash) 
    {	
        config.environment = getParameterByName('environment', window.location.search);               
        token = getParameterByName('access_token', window.location.hash);
        location.hash = '';
        
    }
    else
    {	
        //Config Genesys Cloud
        config = {
            "environment": getParameterByName('environment', window.location.search),
            "clientId": getParameterByName('clientId', window.location.search),
            "redirectUri": getParameterByName('redirectUri', window.location.search)

        };
        
        var queryStringData = {
            response_type: "token",
            client_id: config.clientId,
            redirect_uri: config.redirectUri
        }        
        
        window.location.replace("https://login." + config.environment + "/authorize?" + jQuery.param(queryStringData));
    }

});


function getParameterByName(name, data) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\#&?]" + name + "=([^&#?]*)"),
      results = regex.exec(data);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};


//http://127.0.0.1:8887?environment=mypurecloud.com&clientId=94780cdf-ec5c-45b8-a637-c52f64fba3ef&redirectUri=http%3A%2F%2F127.0.0.1%3A8887%3Fenvironment%3Dmypurecloud.com
