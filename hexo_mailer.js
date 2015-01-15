var fs = require('fs');
var ejs = require('ejs');
var FeedSub = require('feedsub');
 
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('Mandrill API Key');

var csvFile = fs.readFileSync("friends_list.csv","utf8");
var emailTemplate = fs.readFileSync('emailTemplate.ejs', 'utf8'); 

var blogContent = new FeedSub('http://lei-clearsky.github.io/hexo-blog/atom.xml', {
        emitOnStart: true
});

 
function csvParse(csvFile){
    var arrayOfObjects = [];
    var arr = csvFile.split("\n");
    var newObj;
    var keys = arr.shift().split(",");
 
    arr.forEach(function(contact){
        contact = contact.split(",");
        newObj = {};
 
        for(var i =0; i < contact.length; i++){
            newObj[keys[i]] = contact[i];
        }
 
        arrayOfObjects.push(newObj);
 
    })
 
    return arrayOfObjects;
}
 
// experiment with the setTiemout function
blogContent.read(function(err, blogPosts){

    var latestPosts = [];

    blogPosts.forEach(function(post){
        // CHECK IF POST IS 7 Days old or Less. 
        // If it is, put the post object in the array.
        var now = Date.now();
        var postDate = Date.parse(post.published);
        var diff = now - postDate;
        if (diff <= 604800000) { //7 * 86400000
            latestPosts.push(post);
        }
    });
    var friendList = csvParse(csvFile);
 
    friendList.forEach(function(row){
        // add var?
        // add fields to friends_list.csv?
        var firstName = row["firstName"];
        var lastName = row["lastName"];
        var fullName = firstName + ' ' + lastName;
        var numMonthsSinceContact = row["monthsSinceContact"];
        var toEmail = row['emailAddress'];
        var fromName = 'Lei Zhu';
        var fromEmail = 'lei.clearsky@gmail.com';
        var subject = 'Test Email from Lei';
     
        // we make a copy of the emailTemplate variable to a new variable to ensure
        // we don't edit the original template text since we'll need to us it for 
        // multiple emails
     
        var templateCopy = emailTemplate;
     
        // use .replace to replace FIRST_NAME and NUM_MONTHS_SINCE_CONTACT with firstName and  monthsSinceLastContact  
        /*
        templateCopy = templateCopy.replace(/FIRST_NAME/gi,
        firstName).replace(/NUM_MONTHS_SINCE_CONTACT/gi, numMonthsSinceContact);
        */

        var customizedTemplate = ejs.render(emailTemplate, 
                    { firstName: firstName,  
                      monthsSinceContact: numMonthsSinceContact,
                      latestPosts: latestPosts
                    });

        sendEmail(fullName, toEmail, fromName, fromEmail, subject, customizedTemplate);

    });

});

// console.log(latestPosts);

function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
  var message = {
      "html": message_html,
      "subject": subject,
      "from_email": from_email,
      "from_name": from_name,
      "to": [{
              "email": to_email,
              "name": to_name
          }],
      "important": false,
      "track_opens": true,    
      "auto_html": false,
      "preserve_recipients": true,
      "merge": false,
      "tags": [
          "Fullstack_Hexomailer_Workshop"
      ]    
  };
  var async = false;
  var ip_pool = "Main Pool";
  mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
      // console.log(message);
      // console.log(result);   
  }, function(e) {
      // Mandrill returns the error as an object with name and message keys
      console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
      // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
  });
}

