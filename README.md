MOTIONSIGN DEVELOPMENT MANUAL 
  
**Features:**
 
FEATURES ARE LOCATED IN THE **. /APP DIRECTORY** 
 
A features can contain multiple modules, so all features would have a folder that contains all modules that are specific to that feature as shown in the boilerplate. you would be working on different features ensure to document your code. Each Feature would be worked on as independent part of the system with documentation explaining how the feature works and what each Module do.
 
 
**Modules:**  

 are built to make up a feature. All modules must be built as individual micro services  and must reside in their respective feature folder, all modules must be built dynamically so as to be imported across different feature 
 
  	     
	
Data Structure :
 All data key should save in the database with small letters and with underscores where needed  e.g first_name,  last_name,user_id. 
Database tables names should be clearly defined and the content in each table should be documented after development to be used by future modules,  
The database model is the ./database/models    directory 
 
 
                               **General Code Structures**
 
 
 
1. Comments on each block of code 
2. Constant indentation : there are several ways to indenting your code. Let's use this one

  
```
#!NODE
function foo()
{
if (maybe)
{
do_it_now();
again();
}
else
{
abort_mission();
}
finalize();
}

```
 
3. Very often  certain tasks require a few lines of codes. It is a good idea to keep these tasks within separate blocks of code, with some spaces between them.

4. DRY Principle (Don’t Repeat Yourself)  this is the reason why we modularize our systems 
5. Naming Principles,  use the Standard Naming Conventions
6. Regular code refactoring