/*
This file has all the entities related to project
It is DTO for the project which includes getter setter
of each entity
*/

//Company is an entity
class Company
{
    //Initialize values of an object
    constructor(id, name)
    {
        this.id = id;
        this.name = name;
    }
    
    // Getter and Setter of the company
    setId(id)
    {
        this.id = id;
    }
    getId()
    {
        return this.id;
    }
    setName(name)
    {
        this.name = name;
    }
    getName()
    {
        return this.name;
    }
    setCount(count)
    {
        this.count = count;
    }
    getCount()
    {
        return this.count;
    }
}

//This is the blog class
class Blog
{
    //Initialising blog class
    constructor(id,company,content,selectionStatus,user,role,date,tags)
    {
        this.id = id;
        this.company = company;
        this.content = content;
        this.selectionStatus = selectionStatus;
        this.user = user;
        this.role = role;
        this.date = date;
        this.tags = tags;
    }
    
    //Getter and Setter for blog class
    setId(id)
    {
        this.id = id;
    }
    getId()
    {
        return this.id;
    }
    setCompany(company)
    {
        this.company = company;
    }
    getCompany()
    {
        return this.company;
    }
    setContent(content)
    {
        this.content = content;
    }
    getContent()
    {
        return this.content;
    }
    setSelectionStatus(selectionStatus)
    {
        this.selectionStatus = selectionStatus;
    }
    getSelectionStatus()
    {
        return this.selectionStatus;
    }
    setUser(user)
    {
        this.user = user;
    }
    getUser()
    {
        return this.user;
    }
    getRole()
    {
        return this.role;
    }
    setRole(role)
    {
        this.role = role;
    }
    getDate()
    {
        return this.date;
    }
    setDate(date)
    {
        this.date = date;
    }
    setLikeCount(likeCount)
    {
        this.likeCount = likeCount;
    }
    getLikeCount()
    {
        return this.likeCount;
    }
    setTags(tags)
    {
        this.tags = tags;
    }
    getTags()
    {
        return this.tags;
    }
}

//This is company request class which helps to add request for a company
class CompanyRequest
{
    //Initialising the class
    constructor(name,user)
    {
        this.name = name;
        this.user = user;
    }

    //Getter Setter of the request entity
    getName()
    {
        return this.name;
    }
    setName(name)
    {
        this.name = name;
    }
    getUser()
    {
        return this.user;
    }
    setUser(user)
    {
        this.user = user;
    }
    setCount(count)
    {
        this.count = count;
    }
    getCount()
    {
        return this.count;
    }
}

//This is the DTO for user which helps for transferring data
//for login and logout
class User
{
    constructor(id,email,name,showContactDetails)
    {
        this.id = id;
        this.email = email;
        this.name = name;
        this.showContactDetails = showContactDetails;
    }
    getId()
    {
        return this.id;
    }
    setId(id)
    {
        this.id = id;
    }
    getEmail()
    {
        return this.email;
    }
    setEmail(email)
    {
        this.email = email;
    }
    getName()
    {
        return this.name;
    }
    setName(name)
    {
        this.name = name;
    }
    getAlternateEmail()
    {
        return this.alternateEmail;
    }
    setAlternateEmail(alternateEmail)
    {
        this.alternateEmail = alternateEmail;
    }
    getPhoneNumber()
    {
        return this.phoneNumber;
    }
    setPhoneNumber(phoneNumber)
    {
        this.phoneNumber = phoneNumber;
    }
    getLinkedinProfile()
    {
        return this.linkedinProfile;
    }
    setLinkedinProfile(linkedinProfile)
    {
        this.linkedinProfile = linkedinProfile;
    }
    getGithubProfile()
    {
        return this.githubProfile;
    }
    setGithubProfile(githubProfile)
    {
        this.githubProfile = githubProfile;
    }
    getCodingProfile()
    {
        return this.codingProfile;
    }
    setCodingProfile(codingProfile)
    {
        this.codingProfile = codingProfile;
    }
    getBranch()
    {
        return this.branch;
    }
    setBranch(branch)
    {
        this.branch = branch;
    }
    getPassoutYear()
    {
        return this.passoutYear;
    }
    setPassoutYear(passoutYear)
    {
        this.passoutYear = passoutYear;
    }
    setRole(role)
    {
        this.role = role;
    }
    getRole()
    {
        return this.role;
    }
    setShowContactDetails(showContactDetails)
    {
        this.showContactDetails = showContactDetails;
    }
    getShowContactDetails()
    {
        return this.showContactDetails;
    }
}

class Like
{
    constructor(userId,blogId)
    {
        this.userId = userId;
        this.blogId = blogId;
    }
    getBlogId()
    {
        return this.blogId;
    }
    setBlogId(blogId)
    {
        this.blogId = blogId;
    }
    getUserId()
    {
        return this.userId;
    }
    setUserId(userId)
    {
        this.userId = userId;
    }
}

//Exporting entitiies
module.exports = { Company, Blog, CompanyRequest, User, Like };