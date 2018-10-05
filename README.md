# Mobile Web Specialist Certification Course
---
## Project Overview: Stage 3

1. clone https://github.com/seckboy/mws-restaurant-stage-3.git

2. In the home directory of that project, run "node server"

That will run the api server at http://localhost:1337

3. clone https://github.com/seckboy/mws-restaurant-stage-1.git

4. In the home directory of this project, run "docker build -t restaurant-project ." to build the docker container

5. Run this to run the docker container on http://localhost (port 80):
docker run -d -p 80:80 -v {PATH-TO-PROJECT}/mws-restaurant-stage-1:/usr/local/apache2/htdocs --name restaurant-project restaurant-project


