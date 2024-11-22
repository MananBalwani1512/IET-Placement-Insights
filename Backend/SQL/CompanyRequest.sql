create table company_request
(
    name varchar(100) not null,
    user_id int not null,
    primary key(name,user_id),
    foreign key (user_id) references user(id)
);