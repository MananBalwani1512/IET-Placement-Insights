/*
This file has the queries for the databaSe to
perform CRUD operations for each entity.
This file is DAO File for each entity of the project.

It has dependency 
    ./Connector.js 
    ./Entities.js
    ./../utilities/Email.js
*/

//Getting prerequisites for writing Data Access Objects
const connector = require('./Connector');
const Entities = require('./Entities');
const email = require('./../utilities/Email');

//DAO for Company
class Company
{
    //This method gives all the companies present in the database
    async getAllWithCount()
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select company.id, company.name, count(blog.id) as count from blog inner join company on company.id = blog.company_id where blog.acceptance_status = true group by company.name`;
            var companies = [];
            var [resultSet] = await connection.query(query);
            resultSet.map((row)=>
            {
                //Object of type company from entities
                var company = new Entities.Company(row.id, row.name);
                company.setCount(row.count);
                companies.push(company);
            });
            connection.release();
            return companies;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Cannot get companies");
        }
        finally
        {
            connection.release();
        }
    }
    
    async getAll()
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select * from company`;
            var companies = [];
            var [resultSet] = await connection.query(query);
            resultSet.map((row)=>
            {
                //Object of type company from entities
                var company = new Entities.Company(row.id, row.name);
                companies.push(company);
            });
            connection.release();
            return companies;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Cannot get companies");
        }
        finally
        {
            connection.release();
        }
    }
    //This method adds a company to the database
    async add(company)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            var connection = await pool.getConnection();
            
            //Checking whether company already exist in database
            var query = `select id from company where lower(name) = '${company.getName().toLowerCase()}'`;
            var [resultSet] = await connection.query(query);
            if(resultSet.length > 0)
            {
                throw Error(`Company ${company.name} already exists`);
            }
            //Inserting the company in the database
            query = `insert into company (name) values ('${company.getName()}')`;
            var [resultSet] = await connection.query(query);
            var id = resultSet.insertId;
            company.setId(id);
            //Sending the company object with id at 
            //which company is added to the server
            connection.release();
            return company;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Cannot add company");
        }
        finally
        {
            connection.release();
        }
    }

    //This method updates an exisiting company to the database
    async update(company)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            
            //Checking whether the company is present or not
            var query = `select name from company where id = ${company.getId()}`;
            var [resultSet] = await connection.query(query);
            if(resultSet.length == 0)
            {
                throw Error(`Company Id ${company.getId()} does not exist`);
            }
            query = `select id from company where lower(name) = '${company.getName().toLowerCase()}'`;
            [resultSet] = await connection.query(query);
            if(resultSet.length > 0)
            {
                throw Error(`Company with name ${company.getName()} already exist`);
            }
            
            //Updating the company
            query = `update company set name = '${company.getName()}' where id = ${company.getId()}`;
            await connection.query(query);
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Cannot update company");
        }
        finally
        {
            connection.release();
        }
    }

    //This method deletes an existing company from the database
    async delete(id)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            
            //Checking whether company exist
            var query = `select name from company where id = ${id}`;
            var [resultSet] = await connection.query(query);
            if(resultSet.length == 0)
            {
                throw Error(`Company Id ${id} does not exist`);
            }

            //Test that whether a blog is assigned to this company
            var blog = new Blog();
            if(await blog.getByCompanyId(id).length > 0)
            {
                throw Error(`Some blogs exist for the company id ${id}`);
            }

            //Deleting the company
            query = `delete from company where id = ${id}`;
            await connection.query(query);
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Cannot delete company");
        }
        finally
        {
            connection.release();
        }
    }

    /*
    This method is not used at the server end
    It is used to check whether company id is
    present in the database.
    */
    async companyExist(id)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select name from company where id = ${id}`;
            var [resultSet] = await connection.query(query);
            connection.release();
            if(resultSet.length == 0)
                return false;
            return true;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Cannot check for the company");
        }
        finally
        {
            connection.release();
        }
    }

    //This method returns the company object if company id exist
    async getCompanyById(id)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select * from company where id = ${id}`;
            var [resultSet] = await connection.query(query);
            connection.release();
            if(resultSet.length == 0)
                return null;
            var company = new Entities.Company(resultSet[0].id,resultSet[0].name);
            return company;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Cannot check for the company");
        }
        finally
        {
            connection.release();
        }
    }
}

//This is the DAO Class for the Blog
class Blog
{
    //Getting all the blogs with particular company id
    async getByCompanyId(companyId)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            
            //Validation for whether company exist
            var company = new Company();
            if(await company.companyExist(companyId) == false)
            {
                throw Error(`Company id ${companyId} does not exist`);
            }
            //Selecting blogs from database
            var query = `select user.name as user_name,user.email,blog.user_id, blog.id,blog.content,DATE_FORMAT(blog.date, '%D %M %Y') as date,blog.role,blog.selection_status,blog.company_id,company.name as company_name, (select count(user_id) from likes where likes.blog_id = blog.id) as likes_count, blog.tags from user inner join blog on user.id = blog.user_id inner join company on blog.company_id = company.id where company.id = ${companyId} and blog.acceptance_status = true order by likes_count DESC`;
            var [resultSet] = await connection.query(query);
            var blogs = [];
            resultSet.map((row)=>
            {    
                var blog = new Entities.Blog(row.id,new Entities.Company(row.company_id, row.company_name),row.content,row.selection_status,new Entities.User(row.user_id,row.email,row.user_name),row.role,row.date,row.tags);
                blog.setLikeCount(row.likes_count);
                blogs.push(blog);
            });
            //Sending blogs to the server
            connection.release();
            return blogs;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Cannot get blogs");
        }
        finally
        {
            connection.release();
        }
    }

    //This method shows all the blogs present in the database on the basis of date
    async getAll()
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select user.name as user_name,user.email,blog.user_id, blog.id,blog.content,DATE_FORMAT(blog.date, '%D %M %Y') as date,blog.role,blog.selection_status,blog.company_id,company.name as company_name, (select count(user_id) from likes where likes.blog_id = blog.id) as likes_count,blog.tags from user inner join blog on user.id = blog.user_id inner join company on blog.company_id = company.id where blog.acceptance_status = true order by date DESC`;
            var [resultSet] = await connection.query(query);
            var blogs = [];
            resultSet.map((row)=>
            {
                var blog = new Entities.Blog(row.id,new Entities.Company(row.company_id, row.company_name),row.content,row.selection_status,new Entities.User(row.user_id,row.email,row.user_name),row.role,row.date,row.tags);
                blog.setLikeCount(row.likes_count);
                blogs.push(blog);
            });
            connection.release();
            return blogs;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error(err.message);
        }
        finally
        {
            connection.release();
        }
    }
    //This function add the blog to the database
    /*async add(blog)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var company = new Company();
            //Using the company exist function to check whether company is their
            if(await company.companyExist(blog.getCompany().getId()) == false)
            {
                throw Error(`Company ${blog.getCompanyId()} does not exist`);
            }
            //Inserting the blog to the database
            var query = `insert into blog (company_id,content,selection_status,author_id,role,date) values (${blog.getCompany().getId()},'${blog.getContent()}',${blog.getSelectionStatus()},${blog.getAuthor().getId()}, '${blog.getRole()}',current_date())`;
            var [resultSet] = await connection.query(query);
            blog.setId(resultSet.insertId);
            
            //Returning blog object with the id at which blog is added 
            //to the server
            return blog;
        }
        catch(err)
        {
            console.log(err);
            throw Error("Cannot add blog");
        } 
        finally
        {
            connection.release();
        }
    }*/

    //This function deletes the blog
    async delete(id)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            
            //Checking whether the blog exist
            var query = `select selection_status from blog where id = ${id}`;
            var [resultSet] = await connection.query(query);
            if(resultSet.length == 0)
            {
                throw Error(`Blog with id ${id} does not exist`);
            }
            query = `delete from likes where blog_id = ${id}`;
            await connection.query(query);
            //Deleting the blog from database
            query = `delete from blog where id = ${id}`;
            await connection.query(query);
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Cannot delete Blog");
        }
        finally
        {
            connection.release();
        }
    }

    //This method helps to get all blogs written by a particular author
    async getByAuthor(email)
    {
        var connection;
        try
        {
            //Also add tags to this query
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select user.name as user_name,user.email,blog.user_id, blog.id,blog.content,DATE_FORMAT(blog.date, '%D %M %Y') as date,blog.role,blog.selection_status,blog.company_id,company.name as company_name,blog.tags,(select count(user_id) from likes where likes.blog_id = blog.id) as likes_count from user inner join blog on user.id = blog.user_id inner join company on blog.company_id = company.id where user.email = '${email}'`;
            var [resultSet] = connection.query(query);
            var blogs = [];
            resultSet.map((row)=>
            {
                var blog = new Entities.Blog(row.id,new Entities.Company(row.company_id, row.company_name),row.content,row.selection_status,new Entities.User(row.user_id,row.email,row.user_name),row.role,row.date,row.tags);
                blog.setLikeCount(row.likes_count);
                blogs.push(blog);
            });
            connection.release();
            return blogs;
        }   
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Unable to get blogs");
        }
        finally
        {
            connection.release();
        }
    }

    async getById(id)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select blog.id,company.id as company_id,company.name as company_name,blog.role,blog.selection_status,blog.content,blog.tags, user.id as user_id, user.name as user_name from user inner join blog on blog.user_id = user.id inner join company on company.id = blog.company_id where blog.id = ${id}`;
            var [resultSet] = await connection.query(query);
            if(resultSet.length != 1)
            {
                throw Error("Blog does not exist");
            }
            var row = resultSet[0];
            var blog = new Entities.Blog(row.id,new Entities.Company(row.company_id,row.company_name),row.content,row.selection_status,new Entities.User(row.user_id,row.user_name),row.role,"",row.tags);
            connection.release();
            return blog;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error(err.message);
        }
        finally
        {
            connection.release();
        }
    }

    //This method helps to give email of a user who written the blog for blog id
    async getEmailForBlog(id)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select user.email as email from user inner join blog on user.id = blog.user_id where blog.id = ${id}`;
            var [resultSet] = await connection.query(query);
            if(resultSet.length != 1)
            {
                throw Error("Unable to find blog in the database");
            }
            var email = resultSet[0].email;
            connection.release();
            return email;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error(err.message);
        }
        finally
        {
            connection.release();
        }
    }
}

class BlogUpdate
{
    async getAll()
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select user.name as user_name,user.email,blog_update.user_id,blog_update.blog_id,blog_update.content,blog_update.role,blog_update.selection_status,blog_update.company_id,company.name as company_name,blog_update.tags from user inner join blog_update on user.id = blog_update.user_id inner join company on blog_update.company_id = company.id `;
            var [resultSet] = await connection.query(query);
            var blogUpdates = [];
            resultSet.map((row)=>
            {
                var blog = new Entities.Blog(row.blog_id,new Entities.Company(row.company_id,row.company_name),row.content,row.selection_status,new Entities.User(row.user_id,row.email, row.user_name),row.role,"",row.tags);
                blogUpdates.push(blog);
            });
            connection.release();
            return blogUpdates;
        }
        catch(err)
        {
            connection.release();
            console.log(err);
        }
    }

    async getById(blogId)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select user.name as user_name,user.email,blog_update.user_id,blog_update.blog_id,blog_update.content,blog_update.role,blog_update.selection_status,blog_update.company_id,company.name as company_name,blog_update.tags from user inner join blog_update on user.id = blog_update.user_id inner join company on blog_update.company_id = company.id where blog_update.blog_id = ${blogId}`; 
            var [resultSet] = await connection.query(query);
            if(resultSet.length != 1)
            {
                throw Error("Unable to fetch blog");
            }
            var row = resultSet[0];
            var blogUpdate = new Entities.Blog(row.blog_id,new Entities.Company(row.company_id,row.company_name),row.content,row.selection_status,new Entities.User(row.user_id, row.email,row.user_name),row.role,"",row.tags);
            connection.release();
            return blogUpdate;
        }
        catch(err)
        {
            connection.release();
            console.log(err);
        }   
    }

    async add(blog)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `insert into blog_update (blog_id , company_id, user_id,role,content,selection_status, tags) values (${blog.getId()},${blog.getCompany().getId()}, ${blog.getUser().getId()},'${blog.getRole()}','${blog.getContent()}', ${blog.getSelectionStatus()}, JSON_ARRAY(${blog.getTags()}))`;
            await connection.query(query);
        }
        catch(err)
        {
            console.log(err);
            throw Error(err.message);
        }
        finally
        {
            connection.release();
        }
    }

    async accept(blogId)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var blog = await this.getById(blogId);
            //SEND EMAIL CODE STARTS HERE
            var content = '<table style="width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border: 1px solid #dddddd;">';
            content = content+'<tr>';
            content = content+'<td>';
            content = content+`<p style="color: #555555; font-size: 16px;">Dear ${blog.getUser().getName()},</p>`;
            content = content+`<p style="color: #555555; font-size: 16px;">We are pleased to inform you that your request to add your edited Recruitment Experience for the <strong>${blog.getCompany().getName()}</strong> to our platform has been successfully accepted and processed.</p>`;
            content = content+`<p style="color: #555555; font-size: 16px;">The ${blog.getCompany().getName()} Experience edited Recruitment Experience(s) are now live on our platform and available for students to view. We appreciate your time and contribution towards our platform.</p>`;
            content = content+'<p style="color: #555555; font-size: 16px;">If you have any further requests or need additional assistance, please feel free to reach out to us.</p>';
            content = content+'<p style="color: #555555; font-size: 16px;">Thank you for your continued support.</p>';
            content = content+'<p style="color: #555555; font-size: 16px;">Best Regards,<br>IET-PlacementInsights</p>';
            content = content+'</td>';
            content = content+'</tr>';
            content = content+'</table>';
            var subject = `${blog.getCompany().getName()} Updation Request Accepted`;            
            var userEmail = blog.getUser().getEmail();
            //Move Tags
            var tags = "";
            if(blog.getTags() != "")
            {
                var inputTags = blog.getTags();
                for(var i = 0; i < inputTags.length; i++)
                {
                    if(i == inputTags.length-1)
                    {
                        tags = tags+"'"+inputTags[i]+"'";
                    }
                    else
                    {
                        tags = tags+"'"+inputTags[i]+"',";
                    }
                }
            }
            var query = `update blog set role = '${blog.getRole()}', content = '${blog.getContent()}', selection_status = ${blog.getSelectionStatus()}, tags = JSON_ARRAY(${tags}), date = current_date() where id = ${blog.getId()}`;
            await connection.query(query);
            query = `delete from blog_update where blog_id = ${blogId}`;
            await connection.query(query);
            email.sendEmails(userEmail,subject,content);
            connection.release();
        }
        catch(err)
        {
            console.log(err);
            throw Error(err.message);
        }
        finally
        {
            connection.release();
        }
    }

    async reject(blogId, reason)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var blog = await this.getById(blogId);
            var query = `delete from blog_update where blog_id = ${blogId}`;
            //SEND EMAIL CODE STARTS HERE
            var subject = `Blog Updation Request Rejection`;
            var content = `<h2 style="color: #f44336;">Blog Updation - Rejected</h2>`;
            content = content+`<p>Dear ${blog.getUser().getName()},</p>`;
            content = content+`<p>Thank you for submitting your edited blog post for "<strong>${blog.getCompany().getName()} Interview Experience</strong>" for consideration on our website. After careful review, our editorial team has decided not to move forward with publishing your edited submission at this time`;
            if(reason != "")
            {
                content = content+` due to : ${reason}`;
            }            
            content = content+`</p>`;
            content = content+`<p>Although your previous blog will remain as it is on our platform, we encourage you to continue writing and contributing to the community. We appreciate your interest in our platform and hope you will consider submitting future content.</p>`;
            content = content+`<p>If you have any questions or need feedback, please feel free to reach out to us.</p>`;
            content = content+`<p>Best regards,</p>`;
            content = content+`<p>IET-PlacementInsights<br>IETDAVV, Indore</p>`;
            var userEmail = blog.getUser().getEmail();
            await connection.query(query);
            email.sendEmails(userEmail,subject,content);
        }
        catch(err)
        {
            console.log(err);
            throw Error(err.message);
        }
        finally
        {
            connection.release();
        }
    }
}

//This is the DAO Class for Request
class CompanyRequest
{
    //This method gives all the request present in
    //the database
    async getAll()
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select distinct(name), count (user_id) as count from company_request group by name order by name`;
            var [resultSet] = await connection.query(query);
            var requests = [];
            resultSet.map((row)=>
            {
                var request = new Entities.CompanyRequest(row.name,null);
                request.setCount(row.count);
                requests.push(request);
            });
            connection.release();
            //Returning the requests from database to server
            return requests;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Cannot get requests");
        }
        finally
        {
            connection.release();
        }
    }

    //This function is used to add the request to database
    async add(request)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            //Check whether company exist in database
            var query = `select id from company where lower(name) = '${request.getName().toLowerCase()}'`;
            var [resultSet] = await connection.query(query);
            if(resultSet.length > 0)
            {
                throw Error(`Company ${request.getName()} already exist`);
            }
            //Check for author exist or not and add if it does not exist
            //then add request to database.
            query = `insert into company_request values ('${request.getName()}',${request.getUser().getId()})`;
            await connection.query(query);
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Cannot add request");
        }
        finally
        {
            connection.release();
        }
    }

    //This function accepts the request
    async accept(name)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            //get all the authors who made same request.
            var query = `select user.name,user.email from company_request inner join user on user.id = company_request.user_id where lower(company_request.name) = '${name.toLowerCase()}'`;
            //send mail to all the authors
            var [resultSet] = await connection.query(query);
            var authors = [];
            resultSet.map((row)=>
            {
                var author = new Entities.User(0,row.email,row.name);
                authors.push(author);
            });
            authors.map((author)=>
            {
                var content = '<table style="width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border: 1px solid #dddddd;">';
                content = content+'<tr>';
                content = content+'<td>';
                content = content+`<p style="color: #555555; font-size: 16px;">Dear ${author.getName()},</p>`;
                content = content+`<p style="color: #555555; font-size: 16px;">We are pleased to inform you that your request to add your Recruitment Experience for the <strong>${name}</strong> to our platform has been successfully accepted and processed.</p>`;
                content = content+`<p style="color: #555555; font-size: 16px;">The ${name} Recruitment Experience(s) are now live on our platform and available for students to view. We appreciate your time and contribution towards our platform.</p>`;
                content = content+'<p style="color: #555555; font-size: 16px;">If you have any further requests or need additional assistance, please feel free to reach out to us.</p>';
                content = content+'<p style="color: #555555; font-size: 16px;">Thank you for your continued support.</p>';
                content = content+'<p style="color: #555555; font-size: 16px;">Best Regards,<br>IET-PlacementInsights</p>';
                content = content+'</td>';
                content = content+'</tr>';
                content = content+'</table>';
                var subject = `${name} Request Accepted`;
                //Sending mail to the people
                email.sendEmails(author.getEmail(),subject,content);
            });
            //add company to database
            var company = new Company();
            var comp = await company.add(new Entities.Company(0,name));
            
            //Deleting the request from the database
            query = `delete from company_request where lower(name) = '${name.toLowerCase()}'`;
            await connection.query(query);
            
            //Returning the company with id at which 
            //company is added
            connection.release();
            return comp;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Cannot accept request");
        }
        finally
        {
            connection.release();
        }
    }

    //This function rejects the request
    async reject(name)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            //get all the authors who made same request.
            var query = `select user.name,user.email from company_request inner join user on user.id = company_request.user_id where lower(company_request.name) = '${name.toLowerCase()}'`;
            //send mail to all the authors
            var [resultSet] = await connection.query(query);
            if(resultSet.length == 0)
                throw Error(`No request for company ${name}`);
            var authors = [];
            resultSet.map((row)=>
            {
                var author = new Entities.User(0,row.email,row.name);
                authors.push(author);
            });
            authors.map((author)=>
            {
                var subject = `${name} Request Rejected`;
                var content = `<table style="width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border: 1px solid #dddddd;">`
                content = content+`<tr>`;
                content = content+`<td>`;
                content = content+`<p style="color: #555555; font-size: 16px;">Dear ${author.getName()},</p>`;
                content = content+`<p style="color: #555555; font-size: 16px;">We regret to inform you that your request to add your Recruitment Experience for the <strong>${name}</strong> to our platform has been rejected. Unfortunately, it does not meet our current criteria or requirements.</p>`;
                content = content+`<p style="color: #555555; font-size: 16px;">We understand this may be disappointing, but we encourage you to review our guidelines and reach out if you believe there may have been an oversight or if you need further clarification.</p>`;
                content = content+`<p style="color: #555555; font-size: 16px;">We appreciate your understanding and hope to assist you better in the future.</p>`;
                content = content+`<p style="color: #555555; font-size: 16px;">Best Regards,<br>IET-PlacementInsights</p>`;
                content = content+`</td>`;
                content = content+`</tr>`;
                content = content+`</table>`;
                email.sendEmails(author.getEmail(),subject,content);  
            });

            //Deleting the request from the database
            query = `delete from company_request where lower(name) = '${name.toLowerCase()}'`;
            await connection.query(query);
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Cannot reject request");
        }
        finally
        {
            connection.release();
        }
    }
}

//This class has DAO for adding the request for publishing
//the blog on the website
class BlogRequest
{

    //This method is for getting all the requests for the blog
    async getAll()
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select user.name as user_name, user.id as user_id, user.email, company.id as company_id, company.name as company_name , blog.id, blog.content, blog.selection_status, blog.role,DATE_FORMAT(blog.date, '%D %M %Y') as date, blog.tags from user inner join blog on user.id = blog.user_id inner join company on company.id = blog.company_id where blog.acceptance_status = false order by date DESC`;
            var [resultSet] = await connection.query(query);
            var blogRequests = [];
            resultSet.map((row)=>
            {
                var blog = new Entities.Blog(row.id,new Entities.Company(row.company_id,row.company_name), row.content,row.selection_status,new Entities.User(row.user_id,row.email,row.user_name),row.role,row.date,row.tags);
                blogRequests.push(blog);
            });
            connection.release();
            return blogRequests;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Cannot get Requests for the blogs");
        }
        finally
        {
            connection.release();
        }
    }

    //This method adds a request for the blog publishing
    async add(blog)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            if(await new Company().companyExist(blog.getCompany().getId()) == false)
            {
                throw Error(`Company id ${blog.getCompany().getId()} does not exist`);
            }
            var query = `insert into blog (content,selection_status,user_id, company_id,role,date,acceptance_status,tags) values ('${blog.getContent()}', ${blog.getSelectionStatus()}, ${blog.getUser().getId()}, ${blog.getCompany().getId()}, '${blog.getRole()}', current_date(),false,JSON_ARRAY(${blog.getTags()}))`;
            await connection.query(query);
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Cannot add request for blog");
        }
        finally
        {
            connection.release();
        }
    }

    //This mehtod rejects the request for a blog
    async reject(id, reason)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select user.name as user_name, user.email, company.name as company_name from user inner join blog on user.id = blog.user_id inner join company on blog.company_id = company.id where blog.id = ${id}`
            var [resultSet] = await connection.query(query);
            if(resultSet.length == 0)
                throw Error(`Cannot find request for blog of id : ${id}`)
            var row = resultSet[0];
            var author = new Entities.User(-1,row.email,row.user_name);
            var company = new Entities.Company(0,row.company_name);
            var subject = `Blog Post Rejection`;
            var content = `<h2 style="color: #f44336;">Blog Post Submission - Rejected</h2>`;
            content = content+`<p>Dear ${author.getName()},</p>`;
            content = content+`<p>Thank you for submitting your blog post for "<strong>${company.getName()} Interview Experience</strong>" for consideration on our website. After careful review, our editorial team has decided not to move forward with publishing your submission at this time.`;
            if(reason != "")
            {
                content = content+" due to : "+reason+".</p>";
            }
            content = content+`<p>Please know that this decision was made after thorough consideration, and we encourage you to continue writing and contributing to the community. We appreciate your interest in our platform and hope you will consider submitting future content.</p>`;
            content = content+`<p>If you have any questions or need feedback, please feel free to reach out to us.</p>`;
            content = content+`<p>Best regards,</p>`;
            content = content+`<p>IET-PlacementInsights<br>IETDAVV, Indore</p>`;
            query = `delete from blog where id = ${id}`;
            await connection.query(query);
            email.sendEmails(author.getEmail(),subject,content);
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Cannot reject request");
        }
        finally
        {
            connection.release();
        }
    }

    //This method accepts the blog request
    async accept(id)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select user.name as user_name, user.email, user.id as user_id, company.name as company_name from user inner join blog on user.id = blog.user_id inner join company on company.id = blog.company_id where blog.id = ${id}`;
            var [resultSet] = await connection.query(query);
            if(resultSet.length == 0)
                throw Error(`Blog request for id ${id} does not exist`);
            var row = resultSet[0];
            var company = new Entities.Company(-1,row.company_name);
            var author = new Entities.User(row.user_id,row.email,row.user_name);
            var subject = `Blog Post Acceptance`;
            var content = `<h2 style="color: #4CAF50;">Blog Post Submission - Accepted</h2>`;
            content = content+`<p>Dear ${author.getName()},</p>`;
            content = content+`<p>We are pleased to inform you that your blog post submission for "<strong>${company.getName()} Interview Experience</strong>" has been accepted for publication on our website.</p>`;
            content = content+`<p>Our editorial team has reviewed your submission and found it to be a valuable contribution to our readers.</p>`;
            content = content+`<p>If you have any questions or would like to discuss further details, feel free to reach out to us.</p>`;
            content = content+`<p>Thank you for your contribution!</p>`;
            content = content+`<p>Best regards,</p>`;
            content = content+`<p>IET-PlacementInsights<br>IETDAVV, Indore</p>`;
            var query = `update blog set acceptance_status = true where id = ${id}`;
            await connection.query(query);
            email.sendEmails(author.getEmail(),subject,content);
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Cannot accept the request");
        }
        finally
        {
            connection.release();
        }
    }
}

//This is the DAO for the User to help for login and logout functionality
class User
{
    //This method gives all details of the user
    async getById(id)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select * from user where id = ${id}`;
            var [resultSet] = await connection.query(query);
            if(resultSet.length != 1)
                return null;
            var row = resultSet[0];
            var user = new Entities.User(row.id,row.email,row.name,row.show_contact_details);
            user.setAlternateEmail(row.alternate_email);
            user.setLinkedinProfile(row.linkedin_profile);
            user.setPhoneNumber(row.phone_number);
            user.setCodingProfile(row.coding_profile);
            user.setGithubProfile(row.github_profile);
            user.setBranch(row.branch);
            user.setPassoutYear(row.passout_year);
            connection.release();
            return user;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            response.send({"success" : false, "error" : err.message});
        }
        finally
        {
            connection.release();
        }
    }

    //This method gives the user object from email
    async getByEmail(email)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select * from user where email = '${email}'`;
            var [resultSet] = await connection.query(query);
            if(resultSet.length == 0)
            {
                return null;
            }
            var row = resultSet[0];
            var user = new Entities.User(row.id,row.email,row.name,row.show_contact_details);
            connection.release();
            return user;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Cannot get user");
        }
        finally
        {
            connection.release();
        }
    }

    //This method adds a user
    async add(user)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select name from user where email = '${user.getEmail()}'`;
            var [resultSet] = await connection.query(query);
            if(resultSet.length > 0)
            {
                throw Error(`User with email ${user.getEmail()} already exist`);            
            }
            query = `insert into user (email,name,show_contact_details) values('${user.getEmail()}', '${user.getName()}',0)`;
            var [resultSet] = await connection.query(query);
            var userId = resultSet.insertId;
            user.setId(userId);
            connection.release();
            return user;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Unable to add User");
        }
        finally
        {
            connection.release();
        }
    }

    //This method updates the password of the user
    async update(user)
    {
        var connection;
        try
        {
            //CHANGE THIS METHOD TOO.
            var pool = await connector.getPool();
            var connection = await pool.getConnection();
            var query = `select email from user where id = '${user.getId()}'`;
            var [resultSet] = await connection.query(query);
            if(resultSet.length == 0)
            {
                throw Error(`User with id ${user.getId()} does not exist`);
            }
            query = `update user set alternate_email = '${user.getAlternateEmail()}', linkedin_profile = '${user.getLinkedinProfile()}',phone_number = '${user.getPhoneNumber()}',github_profile = '${user.getGithubProfile()}',coding_profile = '${user.getCodingProfile()}',branch = '${user.getBranch()}', passout_year = '${user.getPassoutYear()}', show_contact_details = ${user.getShowContactDetails()} where id = '${user.getId()}'`;
            await connection.query(query);
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error("Unable to update password");
        }
        finally
        {
            connection.release();
        }
    }
    async getLikesCount(id)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select count(blog_id) as count from likes where user_id = ${id}`;
            var [resultSet] = await connection.query(query);
            connection.release();
            if(resultSet.length == 0)
                return 0;
            return resultSet[0].count;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error(err.message);
        }
        finally
        {
            connection.release();
        }
    }
    async getPostCount(id)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            var connection = await pool.getConnection();
            var query = `select count(selection_status) as count from blog where user_id = ${id} and acceptance_status = 1`;
            var [resultSet] = await connection.query(query);
            connection.release();
            if(resultSet.length == 0)
                return 0;
            return resultSet[0].count;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error(err.message);
        }
        finally
        {
            connection.release();
        }
    }
    async getBlogMaxLikes(id)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            var connection = await pool.getConnection();
            var query = `select user.name as user_name,user.email,blog.user_id, blog.id,blog.content,DATE_FORMAT(blog.date, '%D %M %Y') as date,blog.role,blog.selection_status,blog.company_id,company.name as company_name, (select count(user_id) as likes_count from likes where likes.blog_id = blog.id) as likes_count,blog.tags from user inner join blog on user.id = blog.user_id inner join company on blog.company_id = company.id where blog.acceptance_status = true order by likes_count DESC limit 1`;
            var [resultSet] = await connection.query(query);
            connection.release();
            if(resultSet.length == 0)
            {
                return null;
            }
            var row = resultSet[0];
            var blog = new Entities.Blog(row.id,new Entities.Company(row.company_id, row.company_name), row.content,row.selection_status,new Entities.User(row.user_id,row.email,row.user_name),row.role,row.date,row.tags);
            blog.setLikeCount(row.likes_count);
            return blog;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error(err.messgae);
        }
        finally
        {
            connection.release();
        }
    }
}

class Like
{
    async add(like)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select user_id from likes where user_id = ${like.getUserId()} and blog_id = ${like.getBlogId()}`;
            var [resultSet] = await connection.query(query);
            if(resultSet.length > 0)
            {
                return;
            }
            query = `insert into likes (user_id, blog_id) values (${like.getUserId()}, ${like.getBlogId()})`;
            await connection.query(query);
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error(err.message);
        }
        finally
        {
            connection.release();
        }
    }
    async delete(like)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `delete from likes where blog_id = ${like.getBlogId()} and user_id = ${like.getUserId()}`;
            await connection.query(query);
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error(err.message);
        }
        finally
        {
            connection.release();
        }
    }
    async likeExist(like)
    {
        var connection;
        try
        {
            var pool = await connector.getPool();
            connection = await pool.getConnection();
            var query = `select user_id from likes where user_id = ${like.getUserId()} and blog_id = ${like.getBlogId()}`;
            var [resultSet] = await connection.query(query);
            connection.release();
            if(resultSet.length == 1)
            {
                return true;
            }
            return false;
        }
        catch(err)
        {
            console.log(err);
            connection.release();
            throw Error(err.message);
        }
        finally
        {
            connection.release();
        }
    }
}

//Exporting Manager classes
module.exports = { Company, Blog, CompanyRequest, BlogRequest, User, Like, BlogUpdate };