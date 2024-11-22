create table user
(
    id int auto_increment primary key,
    email varchar(200) unique not null,
    name varchar(100) not null,
    alternate_email varchar(200) unique,
    linkedin_profile varchar(200) unique,
    phone_number varchar(10) unique,
    github_profile varchar(200) unique,
    coding_profile varchar(200) unique,
    branch varchar(200) unique,
    passout_year varchar(4),
    show_contact_details boolean not null
);
