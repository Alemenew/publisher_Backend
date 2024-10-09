
#-----------------------------------------------
#---- Setup necessary ENV variables ------------
#-----------------------------------------------
branch_name=$(git symbolic-ref -q HEAD)
branch_name=${branch_name##refs/heads/}
export branch_name=${branch_name:-HEAD}

#========================================= 
#       write Dockerfile
#=========================================
echo "Using Dockerfile ... "
name="backend"
port=3500
tport=3500

#=========================================
#       write docker-compose.yml
#=========================================

cat <<EOF > docker-compose.yml
version: "3"
services:
  $name:
    container_name: $name
    build: .
    image: $name:latest
    restart: unless-stopped
    networks: 
      - network1 
    expose:
      - $tport
    ports:
      - "$port:$tport"
networks:
  network1:
    name: aiqem
    external: true  
EOF
if [ -d /mnt/efs ]; then
cat <<EOF >> docker-compose.yml
    volumes:
      - /mnt/efs:/mnt/efs

EOF
fi

#    network_mode: "host"    

#-----------------------------------------------
#---- build Strapi CMS ------------
#-----------------------------------------------
docker-compose down -t 0

# res=$(docker ps -aq)
# if [ ! -z $res ]; then
#     docker rm $res
# fi

#make .env file if it does not exist
if ! test -e .env; then
  echo "traying to generate .env .. "
  profile="aiqem"
  profiletouse=
  FILE="~/.aws/config"
  if [ -e "$FILE" ]; then
    if grep -q $profile "$File"; then
      profiletouse=$profile
    fi
  fi
  echo "Running env_setup.sh with profile=$profiletouse ..."
  if test -e env_setup.sh; then
    bash env_setup.sh $profiletouse
  elif test -e ../env_setup.sh; then
    bash ../env_setup.sh $profiletouse
  else
    echo "Error: .env file is not found and env_setup.sh is not found!"
    exit
  fi
else
  echo "***using existing .env file****"
fi


docker-compose build  $name
docker-compose up --remove-orphans --force-recreate -d $name
docker ps

echo "----- Logs so far ..-----"
echo "docker logs $(docker ps | head -2 | tail -1 | cut -d " " -f 1)"
docker logs $(docker ps | head -2 | tail -1 | cut -d " " -f 1)

