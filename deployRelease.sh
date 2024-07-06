VERSION=$(node -p -e "require('./server/package.json').version")

docker build -t laberbear/better-boerse-browser:$VERSION --target server . 
docker push laberbear/better-boerse-browser:$VERSION