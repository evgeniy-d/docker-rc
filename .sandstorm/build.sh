#!/bin/bash
set -x
set -euvo pipefail

# Make meteor bundle
sudo chown vagrant:vagrant /home/vagrant -R
cd /opt/app
meteor npm install capnp
meteor npm install
meteor build --directory /home/vagrant/

export NODE_ENV=production
# Use npm and node from the Meteor dev bundle to install the bundle's dependencies.
TOOL_VERSION=$(meteor show --ejson $(<.meteor/release) | grep '^ *"tool":' |
    sed -re 's/^.*"(meteor-tool@[^"]*)".*$/\1/g')
TOOLDIR=$(echo $TOOL_VERSION | tr @ /)
PATH=$HOME/.meteor/packages/$TOOLDIR/mt-os.linux.x86_64/dev_bundle/bin:$PATH
cd /home/vagrant/bundle/programs/server
npm install --production

# Copy our launcher script into the bundle so the grain can start up.
mkdir -p /home/vagrant/bundle/opt/app/.sandstorm/
cp /opt/app/.sandstorm/launcher.sh /home/vagrant/bundle/opt/app/.sandstorm/
