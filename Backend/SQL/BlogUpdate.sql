create table blog_update
(
    blog_id int not null primary key,
    company_id int not null,
    user_id int not null,
    role text not null,
    content text not null,
    selection_status boolean not null,
    tags JSON,
    foreign key (blog_id) references blog(id),
    foreign key (company_id) references company(id),
    foreign key (user_id) references user(id)
);