FROM node:10.18-alpine

ARG P_USER_NAME=mea
ARG P_UID=21001
ENV NODE_ENV=production HOME=/opt/mea

# Create a new user to our new container and avoid the root userx
RUN addgroup --gid ${P_UID} ${P_USER_NAME} && \
    adduser --disabled-password --uid ${P_UID} ${P_USER_NAME} -G ${P_USER_NAME} && \
    mkdir -p ${HOME} && \
    chown -R ${P_UID}:${P_UID} ${HOME}

WORKDIR ${HOME}
USER ${P_UID}

ADD --chown="21001:21001" dist/package*.json ./
ADD --chown="21001:21001" dist/.npmrc ./

RUN rm -rf package-lock.json && npm install --silent --production

ADD --chown="21001:21001" dist/ .

CMD npm start
