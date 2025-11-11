// Version 12:43
var config = {};
var token;
var conversationId;

function getParameterByName(name, data) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\#&?]" + name + "=([^&#?]*)"),
      results = regex.exec(data);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

function makeOutboundCall(token, phoneNumber, queueId) {
    const url = `https://api.${config.environment}/api/v2/conversations/calls`;
   
    const body = {
        phoneNumber: phoneNumber, // E.164 format recommended: e.g., "+541112345678"
        callFromQueueId: queueId // Optional. If provided, routes call via a queue
    };

    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            type: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            data: JSON.stringify(body),
            success: function (data) {
                console.log("Outbound call created:", data);
                resolve(data);
            },
            error: function (err) {
                console.error("Error making outbound call:", err);
                reject(err);
            }
        });
    });
}

function checkPhoneNumber(token, flowId, phoneNumber) {
    const url = 'https://api.usw2.pure.cloud/api/v2/flows/executions';
    
    const body = {
        flowId: flowId,
        inputData: {
            "Flow.phonenumber": phoneNumber
        }
    };

    return fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    .then(res => res.json())
    .then(data => {
        console.log("Flow started:", data);
        return data.id;  // This is the flowExecutionId
    })
    .catch(err => {
        console.error("Error starting flow:", err);
    });

}
function getFlowExecutionDetails(token, flowExecutionId) {
    const url = `https://api.usw2.pure.cloud/api/v2/flows/executions/${flowExecutionId}`;

    return fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch flow execution details');
        }
        return response.json();  // Parse the response to JSON
    })
    .then(data => {
        console.log("Flow Execution Details:", data);
        return data;  // Return the data so it can be used elsewhere
    })
    .catch(error => {
        console.error("Error:", error);
    });
}
function pollFlowExecutionUntilComplete(token, flowExecutionId, maxAttempts = 5, interval = 2000) {
    let attempts = 0;

    return new Promise((resolve, reject) => {
        function checkStatus() {
            getFlowExecutionDetails(token, flowExecutionId)
                .then(data => {
                    const status = data.status;
                    console.log("Current Status:", status);

                    if (status === "COMPLETED") {
                        resolve(data.outputData);  // When done, resolve with output data
                    } else {
                        attempts++;
                        if (attempts < maxAttempts) {
                            setTimeout(checkStatus, interval); // Wait and retry
                        } else {
                            reject(new Error("Flow did not complete in time."));
                        }
                    }
                })
                .catch(err => reject(err));
        }

        checkStatus(); // Start polling
    });
}

function loadQueues(token) {
    const url = `https://api.${config.environment}/api/v2/routing/queues?pageSize=100&pageNumber=1`;

    fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch queues');
        }
        return response.json();
    })
    .then(data => {
        const queueSelect = $('#queueSelect');
        queueSelect.empty(); // Clear any placeholder option

        data.entities.forEach(queue => {
            queueSelect.append(
                $('<option></option>')
                    .val(queue.id)
                    .text(queue.name)
            );
        });
    })
    .catch(error => {
        console.error("Error loading queues:", error);
        $('#queueSelect').html('<option value="">Failed to load queues</option>');
    });
}

function generateRandomString(length) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
}

async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function updateSecureAttributes(token, conversationId) {
    
const url = `https://api.${config.environment}/api/v2/conversations/${conversationId}/secureattributes`;

const body = {
  attributes: {
    sharedtoken: token
  }
};

  try {
    const response =  fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText =  response.text();
      throw new Error(`Error updating secure attributes: ${errorText}`);
    }

    const result =  response.json();
    console.log('Secure attributes updated successfully:', result);
    return result;
  } 
  catch (error) {
    console.error('Failed to update secure attributes:', error);
  }
}

$(document).ready(function () {
    $("#errorMessage").hide();

    $('#callBtn').on('click', function () {
        const button = this;
        const queueId = $('#queueSelect').val();  // Capture it at the moment of interacti
        const phoneNumber = $('#phoneInput').val(); // Get number from input
        const flowId = '96ef0374-31c8-45b1-b814-2472f46cac74';

        if (!phoneNumber || !phoneNumber.startsWith('+')) {
            alert('Please enter a valid phone number in E.164 format (e.g., +541112345678)');
            return;
        }

        button.disabled = true;
        document.getElementById('output').textContent = 'Processing...';

        checkPhoneNumber(token, flowId, phoneNumber)
            .then(flowExecutionId => {
                return pollFlowExecutionUntilComplete(token, flowExecutionId);
            })
            .then(outputData => {
                console.log("Flow Output Data:", outputData);
                document.getElementById('output').textContent = JSON.stringify(outputData, null, 2);
                if (outputData["Flow.CanCall"] === true) {
                        makeOutboundCall(token, phoneNumber, queueId)
                        .then(response => {
                        console.log("Outbound call initiated:", response);
                        })
                            .catch(err => {
                        console.error("Error initiating outbound call:", err);
                    });
    } else {
        console.log("Cannot make call: CanCall is false or not set.");
    }
            })
            .catch(err => {
                console.error("Error during flow execution:", err);
                document.getElementById('output').textContent = 'Error occurred. See console for details.';
            })
            .finally(() => {
                button.disabled = false;
            });
    });


   // --- Button click handler ---
$('#shareToken').on('click',  function() {
    const button = this;
    if (!conversationId) {
        alert('No ConversationId.');
        return;
    }
    
    // Disable button to prevent double clicks
    button.disabled = true;
 

    try {
      
        const result =  updateSecureAttributes(token, conversationId);
        console.log("Secure attributes updated:", result);
       
    } catch (error) {
        console.error("Error updating secure attributes:", error);
       
    } finally {
        button.disabled = false;
    }
});
   







    
    // OAuth & token parsing
    async function startAuthFlow() {
    config.environment = getParameterByName('environment', window.location.search) || 'usw2.pure.cloud';
    config.clientId = getParameterByName('clientId', window.location.search);
    config.redirectUri = "https://uriosteamarillo.github.io/ClientApp/newInteraction.html?environment=" + config.environment;

    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    sessionStorage.setItem('code_verifier', codeVerifier);

    const query = new URLSearchParams({
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
    });

    window.location.href = `https://login.${config.environment}/authorize?${query.toString()}`;
}

async function exchangeCodeForToken(code) {
    const codeVerifier = sessionStorage.getItem('code_verifier');
    const tokenUrl = `https://login.${config.environment}/oauth/token`;

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: "https://uriosteamarillo.github.io/ClientApp/newInteraction.html?environment=" + config.environment,
        client_id: config.clientId,
        code_verifier: codeVerifier
    });

    const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
    });

    const data = await res.json();
    return data.access_token;
}

// Detecta si venís del login con un "code="
$(document).ready(async function () {
    const code = getParameterByName('code', window.location.search);

    if (code) {
        const tokenData = await exchangeCodeForToken(code);
        token = tokenData;
        conversationId = sessionStorage.getItem("conversationId");
        loadQueues(token);
    } else {
        startAuthFlow();
    }
});
// ready document




 



