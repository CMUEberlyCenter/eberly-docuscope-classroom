FROM node:latest as builder
WORKDIR /tmp
COPY ./classroom/package.json /tmp/package.json
RUN npm install
RUN mkdir -p /classroom && cp -a /tmp/node_modules /classroom
WORKDIR /classroom
COPY ./classroom .
RUN npm run build --prod

FROM tiangolo/uwsgi-nginx-flask:python3.7
COPY requirements.txt /tmp
RUN pip install --upgrade pip && pip install --no-cache-dir --upgrade -r /tmp/requirements.txt
ENV STATIC_INDEX 1
COPY ./app /app
COPY --from=builder /classroom/dist/classroom /app/static
