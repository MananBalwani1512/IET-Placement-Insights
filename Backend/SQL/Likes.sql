create table Likes
(
    user_id int not null,
    blog_id int not null,
    foreign key (user_id) references user(id),
    foreign key (blog_id) references blog(id),
    primary key(user_id, blog_id)
);