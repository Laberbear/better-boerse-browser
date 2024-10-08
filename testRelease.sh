VERSION=$(node -p -e "require('./package.json').version")

docker build -t laberbear/better-boerse-browser:$VERSION --target server . 

docker run \
    -p 3001:3001 \
    -v ./data:/opt/data \
    laberbear/better-boerse-browser:$VERSION