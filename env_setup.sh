profile=$1
overwrite=${2:-false}
echo "overwrite=$overwrite"

if [ -f "~/.aws/config" ]; then
    pexist=$(grep tenac ~/.aws/config)
fi


#--------update aws cli
function awscli_install(){    
    if [[ $(uname -m) == *arch64* ]]; then 
        curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"
    else
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    fi

    unzip -qq awscliv2.zip
    ./aws/install --update
    #
    if [ -f /usr/bin/aws ]; then
        rm /usr/bin/aws || echo ""
    fi
    #
    ln -s /usr/local/bin/aws /usr/bin/aws
    rm -rf .aws
}
if command -v aws >/dev/null; then
   if [[ $(aws --version) = aws-cli/1.* ]]; then
       awscli_install  || echo "unable to install cli"
   fi
else
   awscli_install  || echo "unable to install cli"     
fi

if command -v aws >/dev/null; then
    echo ""
else
    echo "awscli not found in any path - exiting"
    exit
fi

#-------do everything else
function get_aws_profile() {
    region=${1:-"us-east-1"}
    if [ ! -z "${profile}" ] && [[ $profile != "null" ]]; then
	prof="--profile $profile --region $region"
    else
	prof="--region $region"
    fi
    echo $prof
}

function get_ssm_secret() {
    #echo "reading key=$1 from aws secret manager"
    res=$(aws secretsmanager get-secret-value \
       	      --secret-id $1  \
	      --query SecretString \
              --output text $prof || echo "")
    echo $res
}

function gen_ssm_secret() {
    #echo "generating random password from aws secret manager"
    #--require-each-included-type \    
    res=$(aws secretsmanager get-random-password \
	      --exclude-punctuation \
	      --password-length ${1:-20} $prof | jq -r '.RandomPassword')
    echo $res
}

function save_ssm_secret() {
    echo "saving key=$2, value=$1 to aws secret manager"
    res=$(aws secretsmanager create-secret  \
	      --name $2  \
	      --secret-string $1 $prof)
}

function get_api_key(){
    # app_key salt
    e=${1:-"dev"}
    key=${2:-"API_KEY"}
    ssmappkey="${e}/csengine-api-key"
    appkey=$(get_ssm_secret $ssmappkey)
    if [ -z "$appkey" ]; then
	echo "Generating Random APP_KEY and saving it in AWS secret manager"
	appkey=$(gen_ssm_secret 20)
        string="{\"$key\":\"$appkey\"}"
	save_ssm_secret $string $ssmappkey
    fi
    echo ""
    echo "{\"$key\":\"$appkey\"}"
    echo ""
}


curdir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
efs_path="/mnt/efs/tgs"
#determine rootdir for env and cred files
if [ -d "${efs_path}" ]; then
    rootdir=${efs_path}
else
    rootdir=$curdir
fi

region="us-east-1"
prof=$(get_aws_profile $region)
echo "using prof=$prof .."


envdir=$rootdir
mkdir -p $envdir


#fastapi vars
envfile="$envdir/.env"


if [ ! -f "$envfile" ] || $overwrite ; then
    keyname='tgad/env'    
    echo "reading $keyname from AWS SM .."
    res=$(get_ssm_secret $keyname)
    echo "#" > $envfile
    for x in $res; do
        echo "$x" >> $envfile
    done
    echo "secret saved to ${envfile}"
else
    echo "using existing ${envfile}"
fi
#echo "===============cat ${envfile}============"
#cat $envfile
#echo "========================================="
