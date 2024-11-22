/*
This file is the server file which accepts request
and send response to the front end
The response structure is : 
for Success : 
{
    "success" : true,
    "result" : RESULT {This part is optional}
}
for Failure : 
{
    "success" : false,
    "error" : {ERROR MESSAGE AS A STRING}
}
*/

//Loading pre requisites for the server
var express = require('express');
var app = express();

//Getting Entities and Manager from data layer
var Entities = require('./../data layer/Entities');
var Manager = require('./../data layer/Manager');

//Getting pre requisites for EJS
var ejs = require('ejs');
var ejsMate = require('ejs-mate');

//Getting body-parser for getting data in request
var bodyParser = require('body-parser');

//Getting path library
var path = require('path');

//Getting session for maintaining sessions at server side
var session = require('express-session');

var flash = require('connect-flash');

var jwt = require('jsonwebtoken');

var axios = require('axios');
const { request } = require('http');
var dotenv = require('dotenv').config({"path" : "../.env"});

var studentPortalBaseURL = process.env.STUDENT_PORTAL_BASE_URL;
var adminPortalBaseURL = process.env.ADMIN_PORTAL_BASE_URL;

//Setting the view engine
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);

//Telling the path of EJS Files
app.set("views",path.join(__dirname,"./../../Frontend/views/company"));

//Declaring about data will be in urencoded form
app.use(bodyParser.urlencoded({"extended" : true}));

//Adding the static path for frontend
app.use(express.static(path.join(__dirname,"./../../Frontend/public")));  // To join current file i.e server.js to custom css/js files directory

//Using the session in server
app.use(session({
    "secret" : "IET Placement Insights",
    "resave" : false,
    "saveUninitialized" : false,
    "cookie" : 
    {
        "maxAge" : 60*60*1000
    }
}));

//Function to check whether session is present or not
function checkSession(request)
{
    if(request.session)
    {
        if(!request.session.user)
            return false;
        if(request.session.user.email && request.session.user.email != null)
            return true;
    }
    return false;
}

async function authorizeAdmin(email)
{
    try
    {
        var response = await axios.post("https://admin.ietdavv.edu.in/server/users/fetch", {email : email});
        var message = response.data.messege;
        if(message == "Authorized")
            return true;
        return false;
    }
    catch(err)
    {
        console.log(err);
        return false;
    }
}

app.use(flash());

// Middleware to flash messages
app.use((request,response,next) => {
    response.locals.good = request.flash("good");
    response.locals.bad = request.flash("bad");
    next();
});

//This API is for rendering the index.ejs file on the client side
app.get("/", (request,response)=>
{
    if(checkSession(request) == false)
    {
        response.redirect(studentPortalBaseURL);
        return;
    }
    response.locals.flag = checkSession(request);
    response.locals.user = null;
    if(response.locals.flag == true)
    {
        response.locals.user = request.session.user;
    }
    response.render("index.ejs");
});

app.get("/viewProfile", (request,response) => {
    if(checkSession(request) == false)
    {
        response.redirect(studentPortalBaseURL);
        return;
    }
    response.locals.flag = checkSession(request);
    response.locals.user = null;
    if(response.locals.flag == true)
    {
        response.locals.user = request.session.user;
    }        
    // response.render("developers.ejs");
    response.render("updateProfile.ejs");
})

app.get("/user/profile/:id", async (request, response) => {
    if (checkSession(request) == false) {
        response.redirect(studentPortalBaseURL);
        return;
    }
    try {
        var id = request.params.id;
        var manager = new Manager.User();
        var user = await manager.getById(id);
        var likeCount = await manager.getLikesCount(id);
        var postCount = await manager.getPostCount(id);
        var blogLiked = await manager.getBlogMaxLikes(id);
        // response.send({ "success": true, "result": user });

        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }        
        response.render("viewProfile.ejs", {user,likeCount,postCount,blogLiked});
    }
    catch (err) {
        console.log(err);
        response.send({ "success": false, "error": err.message });
    }
});

app.get("/login", async (request,response)=>
{
    try
    {
        var token = request.query.token;
        //check if token is not expired.
        var userData = jwt.decode(token);
        if(userData)
        {
            var manager = new Manager.User();
            var user = await manager.getByEmail(userData.email);
            if(user == null)
            {
                var user = await manager.add(new Entities.User(-1,userData.email,userData.name));
            }
            if(request.query.role == "admin")
            {
                var isAdmin = await authorizeAdmin(user.getEmail());
                if(isAdmin == true)
                {
                    user.role = "admin";
                }
            }
            request.session.user = user;
            response.locals.flag = checkSession(request);
            response.locals.user = null;
            if(response.locals.flag == true)
            {
                response.locals.user = request.session.user;
            }
            response.render("index.ejs");
            return;
        }
        //If expired then send to the dashboard of student portal
        
        
        //Also add role for admin portal
        response.redirect(studentPortalBaseURL);
    }
    catch(err)
    {
        //Invalid token
        response.redirect(studentPortalBaseURL);
    }
});

app.get("/blog/add",async (request,response)=>
{
    // console.log(request.path, "-1");

    if(checkSession(request) == false)
    {
        response.redirect(studentPortalBaseURL);
        return;
    }

    var manager = new Manager.Company();
    var companies = await manager.getAll();
    response.locals.flag = checkSession(request);
    response.locals.user = null;
    if(response.locals.flag == true)
    {
        response.locals.user = request.session.user;
    }

    // console.log(request.path, "1");
    // response.redirect("/blog/add");
    // response.redirect(request.path);

    response.render("addBlog.ejs", {companies});
});

app.get("/company/add",async (request,response)=>
{
    if(checkSession(request) == false)
    {
        response.redirect(studentPortalBaseURL);
        return;
    }
    response.locals.flag = checkSession(request);
    response.locals.user = null;
    if(response.locals.flag == true)
    {
        response.locals.user = request.session.user;
    }
    response.render("addCompany.ejs");
});

//This API is for rendering the about us page on client side
app.get("/about", (request,response)=>
{
    if(checkSession(request) == false)
    {
        response.redirect(studentPortalBaseURL);
        return;
    }
    response.locals.flag = checkSession(request);
    response.locals.user = null;
    if(response.locals.flag == true)
    {
        response.locals.user = request.session.user;
    }
    response.render("about.ejs");
});

app.get("/developers", async (request,response)=>
{
    if(checkSession(request) == false)
    {
        response.redirect(studentPortalBaseURL);
        return;
    }
    response.locals.flag = checkSession(request);
    response.locals.user = null;
    if(response.locals.flag == true)
    {
        response.locals.user = request.session.user;
    }
    response.render("developers.ejs");
});

//Session creation and destroy code starts here
//This API will check for login credentials of the user and create a session
//if they are valid else return login page again


//User service starts here
//This API is for creating a user for website
app.get("/user/update", async (request,response)=>
{
    if(checkSession(request) == false)
    {
        response.redirect(studentPortalBaseURL);
        return;
    }
    try
    {
        var manager = new Manager.User();
        var userDetails = await manager.getById(request.session.user.id);
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }    
        response.render("updateProfile.ejs", {userDetails});
    }
    catch(err)
    {
        console.log(err);
    }
});
app.post("/user/update", async (request,response)=>
{
    var user;
    if(checkSession(request) == false)
    {
        response.redirect(studentPortalBaseURL);
        return;
    }
    try
    {
        var id = request.body.id;
        var email = request.body.email;
        var name = request.body.name;
        var alternateEmail = request.body.alternateEmail;
        var phoneNumber = request.body.phoneNumber;
        var linkedinProfile = request.body.linkedinProfile;
        var githubProfile = request.body.githubProfile;
        var codingProfile = request.body.codingProfile;
        var branch = request.body.branch;
        var passoutYear = request.body.passoutYear;
        var showContactDetails = false;
        if(request.body.showContactDetails)
        {
            showContactDetails = true;
        }
        user = new Entities.User(id,email,name,showContactDetails);
        user.setAlternateEmail(alternateEmail);
        user.setLinkedinProfile(linkedinProfile);
        user.setGithubProfile(githubProfile);
        user.setCodingProfile(codingProfile);
        user.setPassoutYear(passoutYear);
        user.setBranch(branch);
        user.setPhoneNumber(phoneNumber);
        if(phoneNumber.length > 0 && phoneNumber.length < 10)
            throw Error("Invalid Phone Number");
        
        var manager = new Manager.User();
        await manager.update(user);
        response.redirect(`/user/profile/${id}`);
    }
    catch(err)
    {
        console.log(err);
        request.flash("bad","Invalid User Details !!!");
        response.locals.bad = request.flash("bad");
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("updateProfile.ejs", {"userDetails" : user});
    }
});
    
//User service ends here

//Company Services Starts Here
//This service helps to get all companies from databse
app.get("/company/getAll",async (request,response)=>
{
    if(checkSession(request) == false)
    {
        response.redirect(studentPortalBaseURL);
        return;
    }
    try
    {
        var manager = new Manager.Company();
        var companies = await manager.getAllWithCount();
        //response.send({"success" : true, "result" : companies});
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("companyList.ejs", {companies});
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false, "error" : err.message});
    }
});

//This service helps to delete an existing company's data from database
app.post("/company/delete", async (request,response)=>
{
    
    if(checkSession(request) == false || request.session.user.role != "admin")
    {
        //Send to admin portal page.
        response.redirect(adminPortalBaseURL);
        return;
    }
    try
    {
        var id = request.body.id;
        var manager = new Manager.Company();
        await manager.delete(id);
        response.send({"success" : true});
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false, "error" : err.message});
    }
});
//Company Service Ends Here


//Blog Service Starts Here
//This service gives all the blogs related to company id
app.get("/blog/getAll/:companyId",async (request,response)=>
{
    if(checkSession(request) == false)
    {
        response.redirect(studentPortalBaseURL);
        return;
    }    
    try
    {
        var companyId = request.params.companyId;
        var currentPage = 1;
        if(request.query.currentPage)
        {
            currentPage = request.query.currentPage;
        }
        var text = "";
        if(request.query.text)
        {
            text = request.query.text;
        }
        var manager = new Manager.Blog();
        var mngr = new Manager.Company();
        var company = await mngr.getCompanyById(companyId);
        var blogs = await manager.getByCompanyId(companyId);
        //response.send({"success" : true, "result" : blogs});
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("blogShow.ejs", {blogs,company,currentPage,text});
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false, "error" : err.message});
    }
});
app.get("/blog/getAll", async (request,response)=>
{
    if(checkSession(request) == false)
    {
        response.redirect(studentPortalBaseURL);
        return;
    }
    try
    {
        var currentPage = 1;
        if(request.query.currentPage)
        {
            currentPage = request.query.currentPage;
        }
        var text = "";
        if(request.query.text)
        {
            text = request.query.text;
        }
        var manager = new Manager.Blog();
        var blogs = await manager.getAll();
        // response.send({"success" : true, "result" : blogs});
        
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }

        response.render("viewAllBlogs.ejs",{blogs,currentPage,text});
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false, "error" : err.message});
    }
});

app.get("/blog/edit/:id", async (request,response)=>
{
    if(checkSession(request) == false)
    {
        response.redirect(studentPortalBaseURL);
        return;
    }
    try
    {
        var id = request.params.id;
        var manager = new Manager.Blog();
        var email = await manager.getEmailForBlog(id);
        if(email != request.session.user.email)
        {
            throw Error("This blog is not written by you");
        }
        var blog = await manager.getById(id);
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("updateBlog.ejs", {blog});
    }
    catch(err)
    {
        console.log(err);
        request.flash("bad", err.message);
        response.locals.bad = request.flash("bad");        
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("index.ejs");
    }
});

app.get("/blog/update/getAll", async (request,response)=>
{
    if(checkSession(request) == false || request.session.user.role != "admin")
    {
        response.redirect(adminPortalBaseURL);
        return;
    }
    try
    {
        var currentPage = 1;
        var text = "";
        var manager = new Manager.BlogUpdate();
        var blogUpdate = await manager.getAll();
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("BlogUpdate.ejs", {blogUpdate,currentPage,text});
    }
    catch(err)
    {
        console.log(err);
    }
});

app.post("/blog/update/add", async (request,response)=>
{
    if(checkSession(request) == false)
    {
        response.redirect(studentPortalBaseURL);
        return;
    }
    try
    {
        var content = request.body.content;
        var id = request.body.id;
        var manager = new Manager.Blog();
        var email = await manager.getEmailForBlog(id);
        if(email != request.session.user.email)
        {
            throw Error("This blog is not written by you");
        }
        var companyId = request.body.companyId;
        var userId = request.body.userId;
        var selectionStatus = false;
        if(request.body.selection_status)
            selectionStatus = true;
        var role = request.body.role;
        var tags = "";
        if(request.body.tags != "")
        {
            var inputTags = JSON.parse(request.body.tags);
            for(var i = 0; i < inputTags.length; i++)
            {
                if(i == inputTags.length-1)
                {
                    tags = tags+"'"+inputTags[i].value+"'";
                }
                else
                {
                    tags = tags+"'"+inputTags[i].value+"',";
                }
            }
        }
        var blog = new Entities.Blog(id,new Entities.Company(companyId,""),content,selectionStatus,new Entities.User(userId,"",""),role,"",tags);
        manager = new Manager.BlogUpdate();
        await manager.add(blog);
        request.flash("good", "Your updations submited and will be reviewed !!!");
        response.locals.bad = request.flash("good");        
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("index.ejs");
    }
    catch(err)
    {
        console.log(err);
        request.flash("bad", err.message);
        response.locals.bad = request.flash("bad");        
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("index.ejs");
    }
});

app.post("/blog/update/accept", async (request,response)=>
{
    if(checkSession(request) == false || request.session.user.role != "admin")
    {
        response.redirect(adminPortalBaseURL);
        return;
    }
    var currentPage = request.body.currentPage;
    var text = request.body.text;    
    try
    {
        var blogId = request.body.blogId;
        var manager = new Manager.BlogUpdate();
        await manager.accept(blogId);
        var blogUpdate = await manager.getAll();
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("BlogUpdate.ejs", {blogUpdate,currentPage,text});
    }
    catch(err)
    {
        console.log(err);
        var manager = new Manager.BlogUpdate();
        var blogUpdate = await manager.getAll();
        request.flash("bad", err.message);
        response.locals.bad = request.flash("bad");        
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("BlogUpdate.ejs", {blogUpdate,currentPage,text});
    }
});

app.post("/blog/update/reject", async (request,response)=>
{
    if(checkSession(request) == false || request.session.user.role != "admin")
    {
        response.redirect(adminPortalBaseURL);
        return;
    }
    var currentPage = request.body.currentPage;
    var text = request.body.text;    
    try
    {
        var blogId = request.body.blogId;
        var reason = request.body.reason;
        var manager = new Manager.BlogUpdate();
        await manager.reject(blogId,reason);
        var blogUpdate = await manager.getAll();
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("BlogUpdate.ejs", {blogUpdate,currentPage,text});
    }
    catch(err)
    {
        console.log(err);
        var manager = new Manager.BlogUpdate();
        var blogUpdate = await manager.getAll();
        request.flash("bad", err.message);
        response.locals.bad = request.flash("bad");        
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("BlogUpdate.ejs", {blogUpdate,currentPage,text});
    }
});
    
//This service deletes a blog
app.post("/blog/delete", async (request,response)=>
{
    if(checkSession(request) == false)
    {
        response.redirect(studentPortalBaseURL);
        return;
    }
    try
    {
        var id = request.body.id;
        var currentPage = request.body.currentPage;
        var text = request.body.text;
        //Validation that the owner of the blog is deleting the blog
        var manager = new Manager.Blog(); 
        await manager.delete(id);
        var url = request.body.url;
        response.redirect(url+"?currentPage="+currentPage+"&text="+encodeURIComponent(text));
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false,"error" : err.message});
    }
});
//Blog service ends Here

//CompanyRequest service starts here
//This service gets all requests
app.get("/company/request/getAll", async (request,response)=>
{
    if(checkSession(request) == false || request.session.user.role != "admin")
    {
        response.redirect(adminPortalBaseURL);
        return;
    }
    try
    {
        var manager = new Manager.CompanyRequest();
        var companyRequests = await manager.getAll();
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("companyRequest.ejs", {companyRequests});
        //response.send({"success" : true, "result" : requests});
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false, "error" : err.message});
    }
});

//This service adds a request
app.post("/company/request/add", async (request,response)=>
{
    if(checkSession(request) == false)
    {
        response.send(studentPortalBaseURL);
        return;
    }
    try
    {
        var name = request.body.name;
        var authorName = request.session.user.name;
        var authorEmail = request.session.user.email;
        var authr = new Entities.User(0,authorEmail,authorName);
        var manager = new Manager.User();
        
        //Checking whether author exist or not
        var author = await manager.getByEmail(authr.getEmail());
        if(author == null)
        {
            //If does not exist adding the author
            author = await manager.add(new Entities.Author(0,authr.email,authr.name));
        }

        var companyRequest = new Entities.CompanyRequest(name,author);
        manager = new Manager.CompanyRequest();
        await manager.add(companyRequest);
        
        request.flash("good", "Your company request added successfully!!!");
        response.locals.good = request.flash("good");        

        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }

        response.render("index.ejs");
    }
    catch(err)
    {
        console.log(err);
        request.flash("bad","The company already exists!!!");
        response.locals.bad = request.flash("bad");
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("addCompany.ejs"); 
    }
});

//This service accepts the request
app.post("/company/request/accept", async (request,response)=>
{
    if(checkSession(request) == false || request.session.user.role != "admin")
    {
        //Send to admin portal
        response.redirect(adminPortalBaseURL);
        return;
    }
    try
    {
        var name = request.body.name;
        var manager = new Manager.CompanyRequest();
        var company = await manager.accept(name);
        var companyRequests = await manager.getAll();
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("companyRequest.ejs", {companyRequests});
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false, err : err.message});
    }
});

//This service rejects the request
app.post("/company/request/reject", async (request,response)=>
{
    if(checkSession(request) == false || request.session.user.role != "admin")
    {
        //Send to Admin Portal
        response.redirect(adminPortalBaseURL);
        return;
    }
    try
    {
        var name = request.body.name;
        var manager = new Manager.CompanyRequest();
        await manager.reject(name);
        var companyRequests = await manager.getAll();
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("companyRequest.ejs", {companyRequests});
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false, err : err.message});
    }
});
//CompanyRequest service ends here

//BlogRequest service starts here
//This method displays all the requests for the blogs
app.get("/blog/request/getAll", async (request,response)=>
{
    if(checkSession(request) == false || request.session.user.role != "admin")
    {
        //Send to admin portal
        response.redirect(adminPortalBaseURL);
        return;
    }
    try
    {
        var currentPage = 1;
        var text = "";
        var manager = new Manager.BlogRequest();
        var blogRequests = await manager.getAll();
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("blogRequest.ejs", {blogRequests,currentPage,text});
        //response.send({"success" : true, "result" : blogRequests});
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false, "error" : err.message});
    }
});

//This method adds a request for the blog
app.post("/blog/request/add", async (request,response)=>
{
    if(checkSession(request) == false)
    {
        response.send(studentPortalBaseURL);
        return;
    }
    try
    {
        var content = request.body.content;
        var selectionStatus = request.body.selection_status;
        var role = request.body.role;
        var companyId = request.body.company_id;
        var authorName = request.session.user.name;
        var authorEmail = request.session.user.email; 
        
        var tags = "";
        if(request.body.tags != "")
        {
            var inputTags = JSON.parse(request.body.tags);
            console.log(inputTags);
            for(var i = 0; i < inputTags.length; i++)
            {
                if(i == inputTags.length-1)
                {
                    tags = tags+"'"+inputTags[i].value+"'";
                }
                else
                {
                    tags = tags+"'"+inputTags[i].value+"',";
                }
            }
        }        

        var author = await new Manager.User().getByEmail(authorEmail);
        if(author == null)
        {
            author = await new Manager.User().add(new Entities.User(-1,authorEmail,authorName));
        }

        var blog = new Entities.Blog(-1,new Entities.Company(companyId,""),content,selectionStatus,author,role,"",tags);
        
        var manager = new Manager.BlogRequest();
        await manager.add(blog);

        request.flash("good", "Your blog request added successfully!!!");
        response.locals.good = request.flash("good");    

        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }

        // response.send({"success" : true});
        response.render("index.ejs");
    }
    catch(err)
    {
        console.log(err);
        // response.send({"success" : false, "error" : err.message});
        
        var manager = new Manager.Company();
        var companies = await manager.getAll();

        request.flash("bad", "You can't add multiple blogs for single company");
        response.locals.bad = request.flash("bad");

        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }

        // response.render("index.ejs");
        response.render("addBlog",{companies});
    }
});

//This service helps admin to accept a blog
app.post("/blog/request/accept", async (request,response)=>
{
    if(checkSession(request) == false || request.session.user.role != "admin")
    {
        //Send to the Admin Portal
        response.redirect(adminPortalBaseURL);
        return;
    }
    try
    {
        var id = request.body.id;
        var currentPage = request.body.currentPage;
        var text = request.body.text;
        var manager = new Manager.BlogRequest();
        var blog = await manager.accept(id);
        var blogRequests = await manager.getAll();
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("blogRequest.ejs", {blogRequests,currentPage,text});
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false, "error" : err.message});
    }
});

//This service helps to reject the request for the blog
app.post("/blog/request/reject", async (request,response)=>
{
    if(checkSession(request) == false || request.session.user.role != "admin")
    {
        //Send to Admin portal
        response.redirect(adminPortalBaseURL);
        return;
    }
    try
    {
        var id = request.body.id;
        var currentPage = request.body.currentPage;
        var text = request.body.text;
        var reason = request.body.reason;
        var manager = new Manager.BlogRequest();
        await manager.reject(id,reason);
        var blogRequests = await manager.getAll();
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        response.render("blogRequest.ejs", {blogRequests,currentPage,text});
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false, "error" : err.message});
    }
});
//BlogRequest service ends here

//Like service starts here
app.post("/like", async (request,response)=>
{
    if(checkSession(request) == false)
    {
        response.redirect(studentPortalBaseURL);
        return;
    }
    try
    {
        var blogId = request.body.blog_id;
        var userId  = request.session.user.id;
        var url = request.body.url;
        var currentPage = request.body.currentPage;
        var text = request.body.text;
        var manager = new Manager.Like();
        var like = new Entities.Like(userId,blogId);
        var likeExist = await manager.likeExist(like);
        if(likeExist)
        {
            await manager.delete(like);
        }
        else
        {
            await manager.add(like);
        }
        response.redirect(url+"?currentPage="+currentPage+"&text="+encodeURIComponent(text));     
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false, "error" : err.message});
    }
});
//Like service ends here

//We define the port number on which server is needed to be started
//Also if port is occupied then we display the error
app.listen(5050,(err)=>
{
    if(err)
    {
        console.log(err);
        return;
    }
    //else we display this
    console.log("Server Started on PORT : 5050");
});


/*
These are the Part of the apis which are not in use
These API's are updated and their functionalities are changed.
//This service updates the blog
app.put("/blog/update", async (request,response)=>
{
    try
    {
        var id = request.body.id;
        var content = request.body.content;
        var selectionStatus = request.body.selectionStatus;
        var manager = new Manager.Blog();
        var blog = new Entities.Blog(id,null,content,selectionStatus,null,null);
        await manager.update(blog);
        response.send({"success": true});
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false, "error" : err.message})
    }
});

//This service adds a blog
app.post("/blog/add",async (request,response)=>
{
    try
    {
        var authorEmail = request.body.authorEmail;
        var authorName = request.body.authorName;
        var content = request.body.content;
        var selectionStatus = request.body.selectionStatus;
        var companyId = request.body.companyId;
        var role = request.body.role;
        var company = new Entities.Company(companyId,"");
        var manager = new Manager.Author();
        var author = await manager.getByEmail(authorEmail);
        if(author == null)
        {
            author = await manager.add(new Entities.Author(0,authorEmail,authorName));
        }
        manager = new Manager.Blog();
        var blog = await manager.add(new Entities.Blog(0,company,content,selectionStatus,author,role));
        response.send({"success" : true, "result" : blog});
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false, "error" : err.message});
    }
});

//This service helps to update data of an existing company in database
app.put("/company/update",async (request,response)=>
{
    try
    {
        var name = request.body.name;
        var id = request.body.id;
        var company = new Entities.Company(id,name);
        var manager = new Manager.Company();
        await manager.update(company);
        response.send({"success" : true});
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false, "error" : err.message});
    }
});

//This service helps to add company to database
app.post("/company/add",async (request,response)=>
{
    try
    {
        var name = request.body.name;
        var company = new Entities.Company(-1,name);
        var manager = new Manager.Company();
        company = await manager.add(company); 
        response.send({"success" : true, "result" : company});
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false, "error" : err.message});
    }
});

This API is for adding the user
app.post("/user/add", async (request,response)=>
{
    try
    {
        var email = request.body.email;
        var name = request.body.name;
        var password = await encrypter.encryptPassword(request.body.password);
        var user = new Entities.User(0,email,password);
        user.setName(name);
        user.setRole("author");
        var manager = new Manager.User();
        user = await manager.add(user);
        request.session.user = user;
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        request.flash("good", "Welcome to IET-PlacementInsights!!!");
        
        // storing request.flash("good") in local variable so that we can access this good variable in flash.ejs
        response.locals.good = request.flash("good");
        response.render("index.ejs");
    }
    catch(err)
    {
        console.log(err);
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }
        var error = err.message;

        request.flash("bad",error);
        response.locals.bad = request.flash("bad");

        response.render("addUser.ejs");

        //response.send({"success" : false, "error" : err.message});
    }
});

app.get("/user/add", (request,response)=>
{
    response.locals.flag = checkSession(request);
    response.locals.user = null;
    if(response.locals.flag == true)
    {
        response.locals.user = request.session.user;
    }
    response.render("addUser.ejs", {error : ""});
});

app.post("/login", async (request,response)=>
{
    if(checkSession(request) == true)
    {
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }

        response.render("index.ejs");
        return;
    }    
    try
    {
        var manager = new Manager.User();
        var email = request.body.email;
        var user = await manager.getUserByEmail(email);
        if(user == null)
        {
            var error = "Incorrect Username or Password";
            response.locals.flag = checkSession(request);
            response.locals.user = null;
            if(response.locals.flag == true)
            {
                response.locals.user = request.session.user;
            }
            response.render("login.ejs", {error});
            return;
        }
        var password = user.getPassword();
        var pass = request.body.password;
        if(await encrypter.comparePassword(password,pass) == false)
        {
            var error = "Incorrect Username or Password";

            response.locals.flag = checkSession(request);
            response.locals.user = null;
            if(response.locals.flag == true)
            {
                response.locals.user = request.session.user;
            }

            request.flash("bad", error);
            response.locals.bad = request.flash("bad");
            console.log(request.flash("bad"));
            
            response.render("login.ejs");
            return;
        }
        request.session.user = user;
        response.locals.flag = checkSession(request);
        response.locals.user = null;
        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
            // request.flash("good", "You logged in successfully");
        }

        // showing flash message at top of page when user logged in
        // request.flash("good") ---> User successfully logged in
        // request.flash("bad") ---> Login issue with user

        request.flash("good", "Welcome to IET-PlacementInsights!!!");
        
        // storing request.flash("good") in local variable so that we can access this good variable in flash.ejs
        response.locals.good = request.flash("good");  

        // console.log(request.flash("good"));
        // console.log(response.locals.good);
        // console.log(success);

        // console.log(request.path);
        // console.log(request.originalUrl);
        // console.log(request.baseUrl);
        // console.log(request.session.redirectUrl);

        // response.redirect(request.path);
        // console.log(request.locals.path);
        // console.log(request.locals.path2);

        // response.redirect("/blog/add");

        // console.log(request.locals.path);
        // if(response.locals.path == "/blog/add"){
        //     console.log(request.locals.path);
        //     response.redirect(request.locals.path);
        // }

        response.render("index.ejs");
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false, "error" : err.message});
    }
});

app.get("/user/change-password", (request,response)=>
{
    if(checkSession(request) == false)
    {
        response.redirect("http://localhost:5173");
        return;
    }
    response.locals.flag = checkSession(request);
    response.locals.user = null;
    if(response.locals.flag == true)
    {
        response.locals.user = request.session.user;
    }

    response.render("changePasswordPage.ejs");
});

//This API is for updating the password of the user
app.post("/user/change", async (request,response)=>
{    
    try
    {
        var email = request.session.user.email;
        var oldPassword = request.body.oldPassword;
        var newPassword = request.body.newPassword;
        var confirmPassword = request.body.confirmPassword; 
        if(newPassword != confirmPassword)
        {
            response.locals.flag = checkSession(request);
            response.locals.user = null;
         
            if(response.locals.flag == true)
            {
                response.locals.user = request.session.user;
            }

            request.flash("bad","Password doesn't match");
            response.locals.bad = request.flash("bad");

            response.render("changePasswordPage.ejs");
        }
        if(await encrypter.comparePassword(request.session.user.password,oldPassword) == false)
        {
            //Add a flash incorrect old password
            response.locals.flag = checkSession(request);
            response.locals.user = null;
            if(response.locals.flag == true)
            {
                response.locals.user = request.session.user;
            }

            request.flash("bad","Old password is incorrect!!!");
            response.locals.bad = request.flash("bad");

            response.render("changePasswordPage.ejs");
        }

        var password = await encrypter.encryptPassword(newPassword);
        var user = new Entities.User(-1,email,password);
        var manager = new Manager.User();
        await manager.update(user);

        request.session.user.password = password;
        response.locals.flag = checkSession(request);
        response.locals.user = null;

        if(response.locals.flag == true)
        {
            response.locals.user = request.session.user;
        }

        response.render("index.ejs");
        //response.send({"success" : true});
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false, "error" : err.message});
    }
});


//This is the logout API which will destory the current session of the user
app.get("/logout", (request,response)=>
{
    if(checkSession(request) == false)
    {
        response.redirect("http://localhost:5173");
        return;
    }

    request.flash("good", "You logged out successfully!!!");
    response.locals.good = request.flash("good");

    request.session.destroy((error)=>
    {
        if(error)
        {
            console.log(error);
        }
    });
    response.redirect("http://localhost:5173");
});
//Session destroy code ends here

app.post("/dislike", async (request,response)=>
{
    if(checkSession(request) == false)
    {
        response.redirect("http://localhost:5173");
        return;
    }
    try
    {
        var userId = request.session.user.id;
        var blogId = request.body.blog_id;
        var url = request.body.url;
        var like = new Entities.Like(userId,blogId);
        var manager = new Manager.Like();
        await manager.delete(like);
        response.redirect(url);
    }
    catch(err)
    {
        console.log(err);
        response.send({"success" : false,"error" : err.message});
    }
});


*/