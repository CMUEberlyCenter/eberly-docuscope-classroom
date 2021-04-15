FROM node:latest as builder
WORKDIR /tmp
COPY ./classroom/package*.json /tmp/
RUN npm ci
RUN mkdir -p /classroom && cp -a /tmp/node_modules /classroom
WORKDIR /classroom
COPY ./classroom .
RUN npm run build:docuscope
#RUN npm run build_prod
#RUN npm run build_dev

FROM tiangolo/uvicorn-gunicorn-fastapi:python3.8
ARG BRANCH="master"
ARG COMMIT=""
ARG TAG="latest"
ARG USER=""
LABEL branch=${BRANCH}
LABEL commit=${COMMIT}
LABEL maintainer=${USER}
LABEL version=${TAG}
LABEL description="DocuScope Classroom visualization tools web interface"
COPY requirements.txt /tmp
RUN pip install --upgrade pip && pip install --no-cache-dir --upgrade -r /tmp/requirements.txt
#ENV STATIC_INDEX 1
COPY ./app /app
COPY --from=builder /classroom/dist/classroom /app/static
