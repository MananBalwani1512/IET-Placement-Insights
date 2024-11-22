/*
Creating the company table that stores the companies
that visited the campus for the recruitments
*/
create table company
(
    id int auto_increment primary key,
    name varchar(100) unique not null
);