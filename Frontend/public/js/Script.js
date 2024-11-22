function searchFilters(blogs,text)
{
    var filteredBlogs = [];
    if(text == "")
    {
        return blogs;
    }
    for(var i = 0; i < blogs.length; i++)
    {
        var blog = blogs[i];
        for(var j = 0; j < blog.tags.length; j++)
        {
            var tag = blog.tags[j];
            if(tag.toLowerCase().includes(text.toLowerCase()))
            {
                filteredBlogs.push(blog);
                break;
            }
        }
    }
    return filteredBlogs;
}
function pagination(blogs,blogsPerPage,currentPage)
{
    if(blogs.length == 0)
    {
        var data = 
        {
            "blogs" : []
        };
        return data;
    }
    var totalBlogs = blogs.length;
    var totalPages = Math.ceil(totalBlogs/blogsPerPage);
    var start = (currentPage-1)*blogsPerPage;
    var end = start+blogsPerPage;
    var paginatedBlogs = [];
    
    for(var i = start; i < end && i < totalBlogs; i++)
    {
        paginatedBlogs.push(blogs[i]);
    }
    var data = 
    {
        blogs : paginatedBlogs,
        totalPages : totalPages
    }
    return data;
}