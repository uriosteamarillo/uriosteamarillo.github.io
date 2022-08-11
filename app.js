const platformClient = require("platformClient");

var helpUrl = '';
var conversationId='';
var agentUserId = "";
Vue.prototype.$clientApp = null;
Vue.prototype.$usersApi = null;
Vue.prototype.$qualityApi = null;
Vue.prototype.$conversationsApi = null;

const authenticatingComponent = {
    props: ['errorMessage', 'authenticated'],
    template: '#authenticating-template'
}

const profileComponent = {
    props: ['profileData'],

    computed: {
        imageUri: function () {
            return processImageData(this.profileData.images);
        }
    },

    methods: {
        profileLinkListener: function(evt) {
            evt.preventDefault();

            if (this.profileData.id) {
                Vue.prototype.$clientApp.directory.showUser(this.profileData.id);
            } else {
                console.info("No user ID available to route to user profile");
            }
        }
    },

    template: '#profile-template'
};

const conversationsComponent = {
    props: ['conversationsData'],

    data: function() {
        return {
            startDate: moment('1997-01-01').toISOString(),
            endDate: moment().toISOString(),
            message: "",
            titles: [
                "Evaluation Id",
                "Interaction Id",
                "Critical Score",
                "Score",
                "Evaluation Form Name",
                "Evaluator",
                "Release Date/Time",
                "Reviewed By Agent"
            ],
        }
    },

    computed: {
        conversations: function() {
            let filteredConversations = [];
            let sortedConversations = _.orderBy(this.conversationsData.conversations, 'startTime', 'desc');
            if (Array.isArray(sortedConversations)) {
                filteredConversations = sortedConversations.filter((conv) => {
                    if (!this.startDate._isValid) {
                        this.startDate = moment('1970-01-01').toISOString();
                    }
                    if (!this.endDate._isValid) {
                        this.endDate = moment().toISOString();
                    }
                    return conv.id && (conv.endTime ?
                        (moment(conv.startTime).isAfter(moment(this.startDate)) &&
                        moment(conv.endTime).isBefore(moment(this.endDate))):
                        moment(conv.startTime).isBetween(
                            moment(this.startDate),
                            moment(this.endDate)
                        ));
                });
            }
            return filteredConversations;
        },
        convEvalMap: function() {
            return this.conversationsData.convEvalMap;
        }
    },

    methods: {
        filterCards: function(evt) {
            this.startDate = moment(evt.target.elements.starttime.value);
            this.endDate = moment(evt.target.elements.endtime.value);
        },
        viewInteraction: function(convId) {
            Vue.prototype.$clientApp.myConversations.showInteractionDetails(convId);
        },
        viewEvaluation: function(convId, evId) {
            Vue.prototype.$clientApp.myConversations.showEvaluationDetails(convId, evId);
        },
        callHelp:function(){
            reprocess()
            
            
          },
        sendWhatsapp:function(){
           
            generarCallBack(this.message)
            
            
          }
    },

    template: '#conversations-template'
};

const testerComponent = {
    data: function() {
        return {
            convId: "",
            evalId: ""
        }
    },

    methods: {
        viewInteraction: function(convId) {
            Vue.prototype.$clientApp.myConversations.showInteractionDetails(convId);
        },
        viewEvaluation: function(convId, evalId) {
            Vue.prototype.$clientApp.myConversations.showEvaluationDetails(convId, evalId);
        },
        getConversationOrEvaluation: function(evt) {
            if (this.convId) {
                if (this.evalId) {
                    this.viewEvaluation(this.convId, this.evalId);
                } else {
                    this.viewInteraction(this.convId);
                }
            }
        }
    },

    template: '#tester-template'
}

new Vue({
    el: '#app',

    data: {
        profileData: {
            name: "Ron Swanson",
            email: "ron@swanson.com",
            department: "Parks and Rec"
        },
        conversationsData: {
            conversations: [],
            convEvalMap: new Map()
        },
        errorMessage: "",
        authenticated: false
    },

    components: {
        'authenticating': authenticatingComponent,
        'profile': profileComponent,
        'conversations': conversationsComponent,
        'tester': testerComponent
    },

    beforeMount() {
        let pcEnvironment = getEmbeddingPCEnv();
        if (!pcEnvironment) {
            this.errorMessage = 'Cannot identify App Embeddding context.  Did you forget to add pcEnvironment={{pcEnvironment}} to your app\'s query string?';
            return;
        }

        let client = platformClient.ApiClient.instance;
        let clientApp = null;
        try {
            clientApp = new window.purecloud.apps.ClientApp({
                pcEnvironment,
            });
            Vue.prototype.$clientApp = clientApp;
        } catch (e) {
            console.log(e);
            this.errorMessage = pcEnvironment + ": Unknown/Unsupported Genesys Cloud Embed Context";
            return;
        }

        // Create API instance
        const usersApi = new platformClient.UsersApi();
        const qualityApi = new platformClient.QualityApi();
        const conversationsApi = new platformClient.ConversationsApi();
        const externalContactsApi = new platformClient.ExternalContactsApi();
        Vue.prototype.$usersApi = usersApi;
        Vue.prototype.$qualityApi = qualityApi;
        Vue.prototype.$conversationsApi = conversationsApi;
        Vue.prototype.$externalContactsApi = externalContactsApi;

        let authenticated = false;
        

        function getCustomerParticipant(conv) {
            // Function returns null if there is no valid participant found.
            if (!conv || !conv.participants) {
                return null;
            }
            return conv.participants.find((part) => {
                return part.purpose === "customer" || part.purpose === "external";
            }) || null;
        }

        function getCustomerAttributes(conv) {
            // Function returns null if there is no valid participant found.
            if (!conv || !conv.attributes) {
                return null;
            }
            console.log(`data: ${JSON.stringify(conv.attributes, null, 2)}`);
            return conv.attributes;
        }


  


        async function getCustomerName(customer){
            if (customer === null){
                return "Unknown";
            } else if (customer.externalContactId){
                const externalContact = await externalContactsApi.getExternalcontactsContact(customer.externalContactId)
                const name = `${externalContact.firstName} ${externalContact.lastName}`;
                return name;
            } else if (customer.name){
                return customer.name;
            } else{
                return "Unknown";
            }
        }

        function buildConversationCustomer(customer, name){
            if(customer === null) customer = {};
            customer.name = name;
            return customer;
        }

        async function getConversationData(convId){
            try{
                const conv = await conversationsApi.getConversation(convId);
                const customerParticipant = getCustomerParticipant(conv);
                const name = await getCustomerName(customerParticipant);
                //NUEVO
                const attributes = await getCustomerAttributes(customerParticipant);
                conv.customer = buildConversationCustomer(customerParticipant, name);
                conv.attributes = attributes;
                return conv;
            } catch(err){
                console.log(`Failed to get conversation/customer: ${err}`);
                throw err;
            }
        }

        async function getConversationsAndEvaluations(agentUserId) {
            const startTime = moment('1997-01-01').toISOString();
            const endTime = moment().toISOString();
            const data = await getEvaluations(qualityApi, startTime, endTime, agentUserId);

            const evaluations = data.entities;
            const evalConversations = {};

            await Promise.allSettled(
                // Gets conversations with evaluations
                evaluations.map(async eval => {
                    const evalConvId = eval.conversation.id;
                    const evalConv = await getConversationData(evalConvId);

                    if(evalConv !== undefined) {
                        if (!(evalConvId in evalConversations)){
                            evalConversations[evalConvId] = {
                                conv: evalConv,
                                evals: []
                            };
                        }
                        evalConversations[evalConvId].evals.push(eval);
                    }
                })
            );

            const conversationsData = await conversationsApi.getConversations();
            const conversations = {};
            await Promise.allSettled(
                // Gets all active conversations
                conversationsData.entities.filter(conv => !(conv.id in evalConversations))
                    .map(async conv => {
                        const newConv = await getConversationData(conv.id);

                        conversationId =conv.id;
                        conversations[conv.id] = {
                            evals: [],
                            conv: newConv
                        };
                    })
            );

            return Object.assign(conversations, evalConversations);
        }

        // Authentication and main flow
        authenticate(client, pcEnvironment)
            .then(() => {
                authenticated = true;
                return usersApi.getUsersMe({ "expand": ["presence"] });
            })
            .then(async (profileData) => {
                // Process agent's profile data
                this.profileData = profileData;
                agentUserId = profileData.id;


                try {
                  //  const conversations = await getConversationsAndEvaluations(agentUserId);
                  //  for (var convId in conversations){
                  //      this.conversationsData.conversations.push(conversations[convId].conv);
                  //      conversationId = convId
                  //      if(conversations[convId].evals.length > 0) this.conversationsData.convEvalMap.set(convId, conversations[convId].evals);
                   // }
                   
                    // Set this boolean to indicated loading complete
                    this.authenticated = true;
                } catch(e) {
                    console.error(e);
                    this.errorMessage = "Failed to fetch conversations/evaluations";
                }
            })
            .catch((err) => {
                console.log(err);
                this.errorMessage =
                    !authenticated
                        ? "Failed to Authenticate with Genesys Cloud - " + err.message
                        : "Failed to fetch/display profile";
            });
    },
});

async function  reprocess() {
try {
    console.log(conversationId);
    conversationsApi =  new platformClient.ConversationsApi();
    var conv = await conversationsApi.getConversation(conversationId);
   // console.log(conv);
    //alert(JSON.stringify(conv))
    
    var participants = conv['participants'];
    let  result = participants.filter(part => part.purpose =='agent');
  //  console.log(JSON.stringify(participants))
     
    console.log(JSON.stringify(result))

    console.log(JSON.stringify(result[0].attributes))
    alert(helpUrl =result[0].attributes.urlHelp)

    //setTimeout(function(){document.location.href = helpUrl},1000);
    
} catch(e) {
    console.error(e);
    this.errorMessage = "Failed to fetch conversations/evaluations";
}
}
async function  generarCallBack(ani) {
    try {
        //console.log(conversationId);
        conversationsApi =  new platformClient.ConversationsApi();
        var conv = await conversationsApi.getConversation(conversationId);
       // console.log(conv);
       // alert(agentUserId)
     
		// Use your own IDs and data here
		const callbackData = {
			routingData: {
				queueId: '723548df-b358-4330-b4b8-7362afb76078',
                preferredAgentIds: [agentUserId]
			},
			scriptId: '1b2a3804-6949-426b-91c9-05fc4b3194a6',
			callbackUserName: 'Whatsapp Saliente',
			callbackNumbers: [
				ani
			],
			data:{
				customDataAttribute: 'custom value 1'
			},
			callerId: '',
			callerIdName: ''
		};


		// Create callback

		return conversationsApi.postConversationsCallbacks(callbackData);
                
        //setTimeout(function(){document.location.href = helpUrl},1000);
        
    } catch(e) {
        console.error(e);
        this.errorMessage = "Failed to fetch conversations/evaluations";
    }
    }
    